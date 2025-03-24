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
  }

  // Subscribe to changes and save to localStorage
  if (typeof window !== 'undefined') {
    subscribe(actions => {
      currentActions = actions;
      localStorage.setItem('actions', JSON.stringify(actions));
    });
  }

  // Sync with server when online
  async function syncWithServer() {
    if (isOffline) return;

    try {
      // First, apply any pending changes
      for (const change of pendingChanges) {
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
            await fetch(getApiUrl(`/api/actions/${change.action.id}`), {
              method: 'DELETE'
            });
            break;
        }
      }

      // Clear pending changes
      pendingChanges = [];

      // Then get the latest state from the server
      const response = await fetch(getApiUrl('/api/actions'));
      const serverActions = await response.json();
      
      // Update the store with server state
      set(serverActions);
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  // Handle online/offline events
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOffline = false;
      syncWithServer();
    });

    window.addEventListener('offline', () => {
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
        update(actions => actions.filter(a => a.id !== actionId));
        const action = currentActions.find(a => a.id === actionId);
        if (action) {
          pendingChanges.push({ type: 'delete', action });
        }
        return;
      }

      await fetch(getApiUrl(`/api/actions/${actionId}`), {
        method: 'DELETE'
      });
      update(actions => actions.filter(a => a.id !== actionId));
    },
    setOffline: (offline: boolean) => {
      isOffline = offline;
      if (!offline) {
        syncWithServer();
      }
    },
    isOffline: () => isOffline
  };
};

export const actionsStore = createActionsStore(); 