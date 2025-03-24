import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';
import { actionsStore } from './actions';

interface User {
    id: number;
    email: string;
    name: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    isOnline: boolean;
}

function createAuthStore() {
    const initialState: AuthState = {
        user: null,
        token: null,
        isLoading: true,
        isOnline: browser ? navigator.onLine : true
    };

    const store = writable<AuthState>(initialState);
    const { subscribe, set, update } = store;

    // Initialize from localStorage if in browser
    if (browser) {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        if (storedToken && storedUser) {
            set({
                user: JSON.parse(storedUser),
                token: storedToken,
                isLoading: false,
                isOnline: navigator.onLine
            });
        } else {
            set({ ...initialState, isLoading: false });
        }

        // Listen for online/offline events
        window.addEventListener('online', () => {
            update(state => ({ ...state, isOnline: true }));
        });

        window.addEventListener('offline', () => {
            update(state => ({ ...state, isOnline: false }));
        });
    }

    return {
        subscribe,
        setUser: (user: User, token: string) => {
            if (!browser) return;
            
            const state = get(store);
            if (!state.isOnline) {
                throw new Error('Cannot log in while offline');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            set({ user, token, isLoading: false, isOnline: state.isOnline });
        },
        logout: async () => {
            if (!browser) return;
            
            const state = get(store);
            if (!state.isOnline) {
                throw new Error('Cannot log out while offline');
            }

            try {
                // Sync any pending changes before clearing state
                await actionsStore.syncWithServer();
                
                // Clear all localStorage items
                localStorage.clear();
                set({ ...initialState, isLoading: false, isOnline: state.isOnline });
            } catch (error) {
                console.error('Failed to sync changes before logout:', error);
                throw new Error('Failed to sync changes before logging out');
            }
        },
        getToken: () => {
            let token: string | null = null;
            subscribe(state => token = state.token)();
            return token;
        }
    };
}

export const auth = createAuthStore(); 