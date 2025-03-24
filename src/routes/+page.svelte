<script lang="ts">
  import { onMount } from 'svelte';
  import type { Action } from '$lib/types';
  import confetti from 'canvas-confetti';
  import { getApiUrl } from '$lib/config';
  import { actionsStore } from '$lib/stores/actions';
  import { auth } from '$lib/stores/auth';
  import AuthForm from '$lib/components/AuthForm.svelte';

  let actions: Action[] = [];
  let newActionTitle = '';
  let newActionDescription = '';
  let actionToDelete: Action | null = null;
  let actionToArchive: Action | null = null;
  let actionToUnarchive: Action | null = null;
  let actionToDecrement: Action | null = null;
  let showCreateForm = false;
  let celebratingAction: Action | null = null;
  let isDevMode = import.meta.env.DEV;
  let isOffline = !$auth.isOnline;
  let error = '';
  let showMenu = false;

  // Subscribe to the stores
  actionsStore.subscribe((value) => {
    actions = value;
  });

  $: activeActions = actions.filter(a => !a.completed);
  $: completedActions = actions.filter(a => a.completed);

  // Load actions when auth state changes
  $: if ($auth.user) {
    actionsStore.loadActions();
  }

  function celebrateCompletion(action: Action) {
    celebratingAction = action;
    
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Hide celebration after 3 seconds
    setTimeout(() => {
      celebratingAction = null;
    }, 3000);
  }

  async function loadActions() {
    if ($auth.user) {
      await actionsStore.loadActions();
    }
  }

  async function createAction() {
    if (!newActionTitle.trim()) {
        error = 'Title is required';
        return;
    }

    const result = await actionsStore.createAction({
        title: newActionTitle,
        description: newActionDescription,
        status: 'active',
        targetCount: 100,
        currentCount: 0,
        completed: false
    });

    if (!result) {
        error = 'Failed to create action. Please try again.';
        return;
    }

    // Reset form
    newActionTitle = '';
    newActionDescription = '';
    error = '';
  }

  async function recordProgress(action: Action, count: number) {
    if (action.completed) return;
    
    try {
        const result = await actionsStore.recordProgress(action, count);
        if (result && !action.completed && result.action.completed) {
            celebrateCompletion(result.action);
        }
    } catch (error) {
        console.error('Failed to record progress:', error);
    }
  }

  async function handleIncrement(action: Action) {
    try {
        await actionsStore.recordProgress(action, 1);
    } catch (error) {
        console.error('Failed to increment:', error);
    }
  }

  async function handleDecrement(action: Action) {
    try {
        await actionsStore.decrementProgress(action);
    } catch (error) {
        console.error('Failed to decrement:', error);
    }
  }

  async function handleArchive(action: Action) {
    try {
        await actionsStore.archiveAction(action);
    } catch (error) {
        console.error('Failed to archive:', error);
    }
  }

  async function handleUnarchive(action: Action) {
    try {
        await actionsStore.unarchiveAction(action);
    } catch (error) {
        console.error('Failed to unarchive:', error);
    }
  }

  async function handleDelete(action: Action) {
    try {
        await actionsStore.deleteAction(action);
        actionToDelete = null;
    } catch (error) {
        console.error('Failed to delete:', error);
    }
  }

  function toggleOffline() {
    actionsStore.toggleOffline();
  }

  async function handleLogout() {
    try {
        await auth.logout();
    } catch (e) {
        if (e instanceof Error && e.message === 'Cannot log out while offline') {
            error = 'You are currently offline. Please check your internet connection and try again.';
        } else {
            error = e instanceof Error ? e.message : 'Failed to log out';
        }
    }
  }

  onMount(loadActions);
</script>

{#if $auth.isLoading}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
{:else if !$auth.user}
  <AuthForm />
{:else}
  <div class="container mx-auto px-4 py-8">
    <!-- Navigation Bar -->
    <div class="flex justify-between items-center mb-8">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold text-gray-900">100 Things</h1>
      </div>
      <div class="flex items-center space-x-4">
        <!-- Desktop menu -->
        <div class="hidden md:flex items-center space-x-4">
          <span class="text-gray-600">Welcome, {$auth.user.name}</span>
          <button
            on:click={handleLogout}
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Logout
          </button>
        </div>

        <!-- Mobile menu button -->
        <div class="md:hidden">
          <button
            on:click={() => showMenu = !showMenu}
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            aria-expanded="false"
          >
            <span class="sr-only">Open main menu</span>
            {#if !showMenu}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            {:else}
              <svg class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile menu -->
    {#if showMenu}
      <div class="md:hidden">
        <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <div class="px-3 py-2 text-sm text-gray-600">
            Welcome, {$auth.user.name}
          </div>
          <button
            on:click={() => {
              handleLogout();
              showMenu = false;
            }}
            class="w-full text-left px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Logout
          </button>
        </div>
      </div>
    {/if}

    {#if error}
      <div class="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    {/if}

    {#if isDevMode}
      <div class="api-url-display bg-gray-100 p-2 text-sm text-gray-600 rounded-md">
        API URL: {getApiUrl('') || 'Not set'}
      </div>
    {/if}

    <div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <!-- Create Action Button -->
        <div class="flex justify-start">
          <button
            on:click={() => showCreateForm = !showCreateForm}
            class="inline-flex items-center px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 {showCreateForm ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500' : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'}"
            aria-label={showCreateForm ? "Hide create form" : "Show create form"}
          >
            {#if !showCreateForm}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            {/if}
            {showCreateForm ? 'Cancel' : 'Create Action'}
          </button>
        </div>

        <!-- Action Creation -->
        {#if showCreateForm}
          <div class="mt-4 bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-semibold mb-4">Create New Action</h2>
            <div class="space-y-4">
              <input
                type="text"
                bind:value={newActionTitle}
                placeholder="Action title"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <textarea
                bind:value={newActionDescription}
                placeholder="Action description"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              ></textarea>
              <button
                on:click={() => {
                  createAction();
                  showCreateForm = false;
                }}
                class="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Create Action
              </button>
            </div>
          </div>
        {/if}

        <!-- Active Actions -->
        <div class="mt-8">
          {#if activeActions.length > 0}
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Active Actions</h2>
          {/if}
          <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each activeActions as action}
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex flex-wrap items-baseline gap-2">
                      <h3 class="text-lg font-medium text-gray-900">{action.title}</h3>
                      <span class="text-sm text-gray-600">{action.currentCount}/{action.targetCount}</span>
                    </div>
                  </div>
                  <div class="relative">
                    <button
                      on:click={() => action.showDropdown = !action.showDropdown}
                      class="text-gray-400 hover:text-gray-500"
                      aria-label="More options"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    {#if action.showDropdown}
                      <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                        <div class="py-1" role="menu">
                          {#if !action.completed}
                            <button
                              on:click={() => {
                                actionToArchive = action;
                                action.showDropdown = false;
                              }}
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Archive
                            </button>
                            {#if action.currentCount > 0}
                              <button
                                on:click={() => {
                                  actionToDecrement = action;
                                  action.showDropdown = false;
                                }}
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Decrement progress
                              </button>
                            {/if}
                          {:else if action.currentCount < action.targetCount}
                            <button
                              on:click={() => {
                                actionToUnarchive = action;
                                action.showDropdown = false;
                              }}
                              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              role="menuitem"
                            >
                              Unarchive
                            </button>
                          {/if}
                          <button
                            on:click={() => {
                              actionToDelete = action;
                              action.showDropdown = false;
                            }}
                            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                            role="menuitem"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
                
                <div class="mt-3">
                  <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style="width: {(action.currentCount / action.targetCount) * 100}%"
                    ></div>
                  </div>
                </div>

                <p class="mt-3 text-sm text-gray-500">{action.description || 'No description'}</p>
                
                <div class="mt-4 flex justify-end gap-2">
                  {#if import.meta.env.DEV}
                    <button
                      on:click={() => recordProgress(action, 5)}
                      class="px-4 py-3 text-base bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 min-w-[3rem]"
                    >
                      +5
                    </button>
                  {/if}
                  <button
                    on:click={() => recordProgress(action, 1)}
                    class="px-4 py-3 text-base bg-green-100 text-green-800 rounded-md hover:bg-green-200 min-w-[3rem]"
                  >
                    +1
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>

        <!-- Completed Actions -->
        {#if completedActions.length > 0}
          <div class="mt-12">
            <h2 class="text-2xl font-bold text-gray-900 mb-4">Completed Actions</h2>
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {#each completedActions as action}
                <div class="bg-white rounded-lg shadow p-6 opacity-75">
                  <div class="flex justify-between items-start">
                    <div>
                      <div class="flex flex-wrap items-baseline gap-2">
                        <h3 class="text-lg font-medium text-gray-900">{action.title}</h3>
                        <span class="text-sm text-gray-600">{action.currentCount}/{action.targetCount}</span>
                      </div>
                      <div class="mt-2">
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            class="bg-green-600 h-2.5 rounded-full"
                            style="width: {(action.currentCount / action.targetCount) * 100}%"
                          ></div>
                        </div>
                      </div>
                      <p class="mt-2 text-sm text-gray-500">{action.description || 'No description'}</p>
                    </div>
                    <div class="relative">
                      <button
                        on:click={() => action.showDropdown = !action.showDropdown}
                        class="text-gray-400 hover:text-gray-500"
                        aria-label="More options"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>
                      {#if action.showDropdown}
                        <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div class="py-1" role="menu">
                            {#if !action.completed}
                              <button
                                on:click={() => {
                                  actionToArchive = action;
                                  action.showDropdown = false;
                                }}
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Archive
                              </button>
                              {#if action.currentCount > 0}
                                <button
                                  on:click={() => {
                                    actionToDecrement = action;
                                    action.showDropdown = false;
                                  }}
                                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  role="menuitem"
                                >
                                  Decrement progress
                                </button>
                              {/if}
                            {:else if action.currentCount < action.targetCount}
                              <button
                                on:click={() => {
                                  actionToUnarchive = action;
                                  action.showDropdown = false;
                                }}
                                class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                role="menuitem"
                              >
                                Unarchive
                              </button>
                            {/if}
                            <button
                              on:click={() => {
                                actionToDelete = action;
                                action.showDropdown = false;
                              }}
                              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              role="menuitem"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      {/if}
                    </div>
                  </div>
                  
                  <div class="mt-4">
                    <div class="text-sm text-gray-600 mt-1">
                      {action.currentCount}/{action.targetCount} - Completed!
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    {#if actionToDelete}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Delete Action</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to delete "{actionToDelete.title}"? This action cannot be undone.
          </p>
          <div class="flex justify-end gap-3">
            <button
              on:click={() => actionToDelete = null}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              on:click={() => actionToDelete && handleDelete(actionToDelete)}
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if actionToArchive}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Archive Action</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to archive "{actionToArchive.title}"? This will mark it as completed.
          </p>
          <div class="flex justify-end gap-3">
            <button
              on:click={() => actionToArchive = null}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              on:click={() => actionToArchive && handleArchive(actionToArchive)}
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Archive
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if actionToUnarchive}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Unarchive Action</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to unarchive "{actionToUnarchive.title}"? This will make it active again.
          </p>
          <div class="flex justify-end gap-3">
            <button
              on:click={() => actionToUnarchive = null}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              on:click={() => actionToUnarchive && handleUnarchive(actionToUnarchive)}
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Unarchive
            </button>
          </div>
        </div>
      </div>
    {/if}

    {#if actionToDecrement}
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Decrement Progress</h3>
          <p class="text-sm text-gray-500 mb-6">
            Are you sure you want to decrement the progress of "{actionToDecrement.title}" by 1?
          </p>
          <div class="flex justify-end gap-3">
            <button
              on:click={() => actionToDecrement = null}
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              on:click={() => {
                actionToDecrement && handleDecrement(actionToDecrement);
                actionToDecrement = null;
              }}
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Decrement
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Add celebration overlay -->
    {#if celebratingAction}
      <div class="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
        <div class="bg-white rounded-lg shadow-xl p-8 transform transition-all duration-500 scale-100 animate-bounce">
          <div class="text-center">
            <div class="text-6xl mb-4 animate-spin">🎉</div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h3>
            <p class="text-lg text-gray-600">You've completed "{celebratingAction.title}"!</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Add online/offline indicator -->
    <div class="fixed top-4 right-4 z-50">
      <div class="w-3 h-3 rounded-full {$auth.isOnline ? 'bg-green-500' : 'bg-red-500'}"></div>
    </div>

    <!-- Add offline toggle in dev mode -->
    {#if isDevMode}
      <div class="fixed bottom-4 right-4 z-50">
        <button
          on:click={() => {
            if ($auth.isOnline) {
              window.dispatchEvent(new Event('offline'));
            } else {
              window.dispatchEvent(new Event('online'));
            }
          }}
          class="px-4 py-2 rounded-md {$auth.isOnline ? 'bg-green-500' : 'bg-red-500'} text-white font-medium"
        >
          {$auth.isOnline ? 'Online Mode' : 'Offline Mode'}
        </button>
      </div>
    {/if}
  </div>
{/if}
