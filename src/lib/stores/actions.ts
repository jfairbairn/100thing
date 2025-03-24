import { writable } from 'svelte/store';
import type { Action } from '$lib/types';
import { getApiUrl } from '$lib/config';
import { auth } from './auth';

// Create a store for actions
const createActionsStore = () => {
  const { subscribe, set, update } = writable<Action[]>([]);
  let isOffline = false;
  let pendingChanges: { type: 'create' | 'update' | 'delete', action: Action }[] = [];
  let currentActions: Action[] = [];

  // Load from localStorage on initialization
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('actions');
    if (stored) {
      const parsed = JSON.parse(stored);
      currentActions = parsed;
      set(parsed);
    }

    // Load pending changes from localStorage
    const storedPendingChanges = localStorage.getItem('pendingChanges');
    if (storedPendingChanges) {
      pendingChanges = JSON.parse(storedPendingChanges);
      console.log('Loaded pending changes from localStorage:', pendingChanges);
    }
  }

  // Subscribe to changes and save to localStorage
  if (typeof window !== 'undefined') {
    subscribe(actions => {
      currentActions = actions;
      localStorage.setItem('actions', JSON.stringify(actions));
    });
  }

  // Function to save pending changes to localStorage
  function savePendingChanges() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
      console.log('Saved pending changes to localStorage:', pendingChanges);
    }
  }

  async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = auth.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch');
    }

    // For DELETE requests or responses with no content, don't try to parse JSON
    if (options.method === 'DELETE' || response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Sync with server when online
  async function syncWithServer() {
    if (isOffline) return;

    try {
      console.log('Starting sync with server. Pending changes:', pendingChanges);
      
      // First, apply any pending changes
      const successfulChanges: { type: 'create' | 'update' | 'delete', action: Action }[] = [];
      
      for (const change of pendingChanges) {
        try {
          console.log('Processing change:', change);
          switch (change.type) {
            case 'create':
              await fetchWithAuth(getApiUrl('/api/actions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.action)
              });
              break;
            case 'update':
              await fetchWithAuth(getApiUrl(`/api/actions/${change.action.id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.action)
              });
              break;
            case 'delete':
              console.log('Attempting to delete action:', change.action.id);
              await fetchWithAuth(getApiUrl(`/api/actions/${change.action.id}`), {
                method: 'DELETE'
              });
              console.log('Delete request successful');
              break;
          }
          // If we get here, the change was successful
          successfulChanges.push(change);
          console.log('Change successful:', change);
        } catch (error) {
          console.error(`Failed to apply ${change.type} change:`, error);
          // If a change fails, we should keep it in pendingChanges
        }
      }

      console.log('Successful changes:', successfulChanges);
      console.log('Current pending changes:', pendingChanges);

      // Remove successful changes from pendingChanges
      pendingChanges = pendingChanges.filter(change => 
        !successfulChanges.some(successful => 
          successful.type === change.type && successful.action.id === change.action.id
        )
      );

      // Save updated pending changes to localStorage
      savePendingChanges();

      console.log('Pending changes after filtering:', pendingChanges);

      // If all changes were successful, fetch latest server state
      if (pendingChanges.length === 0) {
        console.log('All changes successful, fetching latest server state');
        // Then get the latest state from the server
        const serverActions = await fetchWithAuth(getApiUrl('/api/actions'));
        
        // Update the store with server state, ensuring deleted actions are removed
        const deletedActionIds = successfulChanges
          .filter(change => change.type === 'delete')
          .map(change => change.action.id);
          
        const finalActions = serverActions.filter((action: Action) => 
          !deletedActionIds.includes(action.id)
        );
        
        set(finalActions);
      } else {
        console.log('Some changes failed, keeping in pending changes');
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  // Handle online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log('Browser online event fired');
      isOffline = false;
      syncWithServer();
    });

    window.addEventListener('offline', () => {
      console.log('Browser offline event fired');
      isOffline = true;
    });
  }

  async function loadActions() {
    try {
      const actions = await fetchWithAuth(getApiUrl('/api/actions'));
      set(actions);
    } catch (error) {
      console.error('Failed to load actions:', error);
    }
  }

  async function createAction(action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const newActions = await fetchWithAuth(getApiUrl('/api/actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
      if (!Array.isArray(newActions) || newActions.length === 0) {
        throw new Error('Invalid response from server');
      }
      update(actions => [...actions, newActions[0]]);
      return newActions[0];
    } catch (error) {
      console.error('Failed to create action:', error);
      // Instead of throwing, we'll return null and let the UI handle the error
      return null;
    }
  }

  async function deleteAction(action: Action) {
    try {
      await fetchWithAuth(getApiUrl(`/api/actions/${action.id}`), {
        method: 'DELETE'
      });
      update(actions => actions.filter(a => a.id !== action.id));
    } catch (error) {
      console.error('Failed to delete action:', error);
      throw error;
    }
  }

  async function archiveAction(action: Action) {
    try {
      const [updatedAction] = await fetchWithAuth(getApiUrl('/api/actions'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: action.id, completed: true })
      });
      update(actions => actions.map(a => a.id === action.id ? updatedAction : a));
    } catch (error) {
      console.error('Failed to archive action:', error);
      throw error;
    }
  }

  async function unarchiveAction(action: Action) {
    try {
      const [updatedAction] = await fetchWithAuth(getApiUrl('/api/actions'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: action.id, completed: false })
      });
      update(actions => actions.map(a => a.id === action.id ? updatedAction : a));
    } catch (error) {
      console.error('Failed to unarchive action:', error);
      throw error;
    }
  }

  async function recordProgress(action: Action, count: number) {
    try {
      const response = await fetchWithAuth(getApiUrl('/api/progress'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id, count })
      });
      update(actions => actions.map(a => a.id === action.id ? response.action : a));
      return response;
    } catch (error) {
      console.error('Failed to record progress:', error);
      throw error;
    }
  }

  async function decrementProgress(action: Action) {
    try {
      const response = await fetchWithAuth(getApiUrl('/api/progress'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId: action.id })
      });
      update(actions => actions.map(a => a.id === action.id ? response.action : a));
      return response;
    } catch (error) {
      console.error('Failed to decrement progress:', error);
      throw error;
    }
  }

  function toggleOffline() {
    isOffline = !isOffline;
  }

  return {
    subscribe,
    loadActions,
    createAction,
    deleteAction,
    archiveAction,
    unarchiveAction,
    recordProgress,
    decrementProgress,
    toggleOffline,
    isOffline: () => isOffline,
    syncWithServer
  };
};

export const actionsStore = createActionsStore(); 