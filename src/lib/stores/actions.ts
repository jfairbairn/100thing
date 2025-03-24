import { writable } from 'svelte/store';
import type { Action } from '$lib/types';
import { getApiUrl } from '$lib/config';

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
              await fetch(getApiUrl('/api/actions'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.action)
              });
              break;
            case 'update':
              await fetch(getApiUrl(`/api/actions/${change.action.id}`), {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(change.action)
              });
              break;
            case 'delete':
              console.log('Attempting to delete action:', change.action.id);
              const response = await fetch(getApiUrl(`/api/actions/${change.action.id}`), {
                method: 'DELETE'
              });
              if (!response.ok) {
                throw new Error(`Failed to delete action: ${response.statusText}`);
              }
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
        const response = await fetch(getApiUrl('/api/actions'));
        if (!response.ok) {
          throw new Error(`Failed to fetch actions: ${response.statusText}`);
        }
        const serverActions = await response.json();
        
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

  return {
    subscribe,
    createAction: async (action: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>) => {
      if (isOffline) {
        const newAction = {
          ...action,
          id: Date.now(), // Temporary ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        update(actions => [...actions, newAction]);
        pendingChanges.push({ type: 'create', action: newAction });
        savePendingChanges();
        console.log('Created action offline:', newAction);
        return newAction;
      }

      const response = await fetch(getApiUrl('/api/actions'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
      const newAction = await response.json();
      update(actions => [...actions, newAction]);
      return newAction;
    },
    updateAction: async (action: Action) => {
      if (isOffline) {
        update(actions => actions.map(a => a.id === action.id ? action : a));
        pendingChanges.push({ type: 'update', action });
        savePendingChanges();
        console.log('Updated action offline:', action);
        return action;
      }

      try {
        const response = await fetch(getApiUrl(`/api/actions/${action.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update action: ${response.statusText}`);
        }
        
        const updatedAction = await response.json();
        update(actions => actions.map(a => a.id === updatedAction.id ? updatedAction : a));
        return updatedAction;
      } catch (error) {
        console.error('Failed to update action:', error);
        // In case of error, still update the local state
        update(actions => actions.map(a => a.id === action.id ? action : a));
        return action;
      }
    },
    deleteAction: async (actionId: number) => {
      if (isOffline) {
        console.log('Deleting action offline:', actionId);
        // Find the action before removing it
        const action = currentActions.find(a => a.id === actionId);
        if (action) {
          console.log('Found action to delete:', action);
          // Add to pending changes first
          pendingChanges.push({ type: 'delete', action });
          savePendingChanges();
          console.log('Added delete to pending changes:', pendingChanges);
          // Then update the store
          update(actions => actions.filter(a => a.id !== actionId));
        } else {
          console.log('No action found with id:', actionId);
        }
        return;
      }

      await fetch(getApiUrl(`/api/actions/${actionId}`), {
        method: 'DELETE'
      });
      update(actions => actions.filter(a => a.id !== actionId));
    },
    setOffline: (offline: boolean) => {
      console.log('Setting offline state:', offline);
      isOffline = offline;
      if (!offline) {
        syncWithServer();
      }
    },
    isOffline: () => isOffline
  };
};

export const actionsStore = createActionsStore(); 