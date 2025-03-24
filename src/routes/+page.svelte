<script lang="ts">
  import { onMount } from 'svelte';
  import type { Action } from '$lib/types';
  import confetti from 'canvas-confetti';
  import { getApiUrl } from '$lib/config';
  import { actionsStore } from '$lib/stores/actions';

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
  let isOffline = actionsStore.isOffline();

  // Subscribe to the actions store
  actionsStore.subscribe((value) => {
    actions = value;
    isOffline = actionsStore.isOffline();
  });

  $: activeActions = actions
    .filter(a => !a.completed)
    .sort((a, b) => {
      // If neither action has progress, maintain original order
      if (a.currentCount === 0 && b.currentCount === 0) return 0;
      // If only one action has no progress, it should come first
      if (a.currentCount === 0) return -1;
      if (b.currentCount === 0) return 1;
      // For actions with progress, sort by current count (ascending)
      return a.currentCount - b.currentCount;
    });
  $: completedActions = actions.filter(a => a.completed);

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
    // Actions are now managed by the store
  }

  async function createAction() {
    if (!newActionTitle.trim()) return;
    
    await actionsStore.createAction({
      title: newActionTitle,
      description: newActionDescription,
      status: 'active',
      targetCount: 100,
      currentCount: 0,
      completed: false
    });
    
    newActionTitle = '';
    newActionDescription = '';
  }

  async function recordProgress(action: Action, count: number) {
    if (action.completed) return;
    
    const updatedAction = {
      ...action,
      currentCount: action.currentCount + count,
      completed: action.currentCount + count >= action.targetCount
    };
    
    await actionsStore.updateAction(updatedAction);

    // Check if this update completed the action
    if (!action.completed && updatedAction.completed) {
      celebrateCompletion(updatedAction);
    }
  }

  async function deleteAction(action: Action) {
    await actionsStore.deleteAction(action.id);
    actionToDelete = null;
  }

  async function archiveAction(action: Action) {
    const updatedAction = {
      ...action,
      completed: true
    };
    await actionsStore.updateAction(updatedAction);
    actionToArchive = null;
  }

  async function unarchiveAction(action: Action) {
    const updatedAction = {
      ...action,
      completed: false
    };
    await actionsStore.updateAction(updatedAction);
    actionToUnarchive = null;
  }

  async function decrementProgress(action: Action) {
    const updatedAction = {
      ...action,
      currentCount: Math.max(0, action.currentCount - 1),
      completed: false
    };
    await actionsStore.updateAction(updatedAction);
    actionToDecrement = null;
  }

  function toggleOffline() {
    isOffline = !isOffline;
    actionsStore.setOffline(isOffline);
  }

  onMount(loadActions);
</script>

<div class="api-url-display bg-gray-100 p-2 text-sm text-gray-600 rounded-md mb-4">
  API URL: {getApiUrl('') || 'Not set'}
</div>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">100 Things</h1>
      <p class="text-lg text-gray-600">Track your progress on meaningful actions</p>
    </div>

    <!-- Create Action Button -->
    <div class="mt-8 flex justify-start">
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
          on:click={() => actionToDelete && deleteAction(actionToDelete)}
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
          on:click={() => actionToArchive && archiveAction(actionToArchive)}
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
          on:click={() => actionToUnarchive && unarchiveAction(actionToUnarchive)}
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
            actionToDecrement && decrementProgress(actionToDecrement);
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

<!-- Add offline toggle in dev mode -->
{#if isDevMode}
  <div class="fixed top-4 right-4 z-50">
    <button
      on:click={toggleOffline}
      class="px-4 py-2 rounded-md {isOffline ? 'bg-red-500' : 'bg-green-500'} text-white font-medium"
    >
      {isOffline ? 'Offline Mode' : 'Online Mode'}
    </button>
  </div>
{/if}
