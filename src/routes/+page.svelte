<script lang="ts">
  import { onMount } from 'svelte';
  import type { Action } from '$lib/types';
  import confetti from 'canvas-confetti';
  import { getApiUrl } from '$lib/config';

  let actions: Action[] = [];
  let newActionTitle = '';
  let newActionDescription = '';
  let actionToDelete: Action | null = null;
  let showCreateForm = false;
  let celebratingAction: Action | null = null;

  $: activeActions = actions.filter(a => !a.completed);
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
    const response = await fetch(getApiUrl('/api/actions'));
    actions = await response.json();
  }

  async function createAction() {
    if (!newActionTitle.trim()) return;
    
    const response = await fetch(getApiUrl('/api/actions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newActionTitle,
        description: newActionDescription
      })
    });
    
    const newAction = await response.json();
    actions = [...actions, newAction];
    newActionTitle = '';
    newActionDescription = '';
  }

  async function recordProgress(action: Action, count: number) {
    if (action.completed) return;
    
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionId: action.id,
        count
      })
    });
    
    const { progress: newProgress, action: updatedAction } = await response.json();
    
    // Update the action in the actions array
    actions = actions.map(a => 
      a.id === updatedAction.id ? updatedAction : a
    );

    // Check if this update completed the action
    if (!action.completed && updatedAction.completed) {
      celebrateCompletion(updatedAction);
    }
  }

  async function deleteAction(action: Action) {
    const response = await fetch(`/api/actions/${action.id}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      actions = actions.filter(a => a.id !== action.id);
      actionToDelete = null;
    }
  }

  onMount(loadActions);
</script>

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
                <h3 class="text-lg font-medium text-gray-900">{action.title}</h3>
                <p class="mt-1 text-sm text-gray-500">{action.description || 'No description'}</p>
              </div>
              <button
                on:click={() => actionToDelete = action}
                class="text-red-600 hover:text-red-800"
                aria-label="Delete action"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div class="mt-4 flex items-center justify-between">
              <div class="flex-1 mr-4">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                    style="width: {(action.currentCount / action.targetCount) * 100}%"
                  ></div>
                </div>
                <div class="text-sm text-gray-600 mt-1">
                  {action.currentCount}/{action.targetCount}
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  on:click={() => recordProgress(action, 1)}
                  class="px-2 py-1 text-sm bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                >
                  +1
                </button>
                <button
                  on:click={() => recordProgress(action, 5)}
                  class="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
                >
                  +5
                </button>
              </div>
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
                  <h3 class="text-lg font-medium text-gray-900">{action.title}</h3>
                  <p class="mt-1 text-sm text-gray-500">{action.description || 'No description'}</p>
                </div>
                <button
                  on:click={() => actionToDelete = action}
                  class="text-red-600 hover:text-red-800"
                  aria-label="Delete action"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <div class="mt-4">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    class="bg-green-600 h-2.5 rounded-full"
                    style="width: 100%"
                  ></div>
                </div>
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
