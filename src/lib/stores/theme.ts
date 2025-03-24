import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createThemeStore() {
    const { subscribe, set, update } = writable(false);

    // Initialize from localStorage if in browser
    if (browser) {
        const isDark = localStorage.getItem('theme') === 'dark' || 
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        set(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                set(e.matches);
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    }

    return {
        subscribe,
        toggle: () => {
            update(isDark => {
                const newValue = !isDark;
                if (browser) {
                    localStorage.setItem('theme', newValue ? 'dark' : 'light');
                    if (newValue) {
                        document.documentElement.classList.add('dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                    }
                }
                return newValue;
            });
        }
    };
}

export const theme = createThemeStore(); 