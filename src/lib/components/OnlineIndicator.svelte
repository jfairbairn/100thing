<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import { actionsStore } from '$lib/stores/actions';
  
  let isOnline = true;
  
  if (browser) {
    // Subscribe to the store's offline state
    actionsStore.subscribe(() => {
      isOnline = !actionsStore.isOffline();
    });
    
    onMount(() => {
      // Get initial state from store
      isOnline = !actionsStore.isOffline();
      console.log('Initial online state:', isOnline);
      
      // Add event listeners to keep store in sync with browser
      window.addEventListener('online', () => {
        console.log('Browser online event fired');
        actionsStore.setOffline(false);
      });
      
      window.addEventListener('offline', () => {
        console.log('Browser offline event fired');
        actionsStore.setOffline(true);
      });
    });
    
    onDestroy(() => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
    });
  }
</script>

{#if browser}
  <div class="online-indicator" class:offline={!isOnline}>
    {#if isOnline}
      Online
    {:else}
      Offline
    {/if}
  </div>
{/if}

<style>
  .online-indicator {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    background-color: #22c55e;
    color: white;
    transition: all 0.2s ease;
    z-index: 9999;
  }
  
  .offline {
    background-color: #ef4444;
  }
</style> 