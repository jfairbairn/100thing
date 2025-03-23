<script lang="ts">
  import { onMount } from 'svelte';
  import type { Project, Action, Progress } from '$lib/types';

  let projects: Project[] = [];
  let selectedProject: Project | null = null;
  let newProjectName = '';
  let newActionTitle = '';
  let newActionDescription = '';

  async function loadProjects() {
    const response = await fetch('/api/projects');
    projects = await response.json();
  }

  async function createProject() {
    if (!newProjectName.trim()) return;
    
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newProjectName })
    });
    
    const project = await response.json();
    projects = [...projects, project];
    newProjectName = '';
  }

  async function createAction() {
    if (!selectedProject || !newActionTitle.trim()) return;
    
    const response = await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: selectedProject.id,
        title: newActionTitle,
        description: newActionDescription
      })
    });
    
    const action = await response.json();
    selectedProject.actions = [...(selectedProject.actions || []), action];
    newActionTitle = '';
    newActionDescription = '';
  }

  async function recordProgress(action: Action, count: number) {
    const response = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionId: action.id,
        count
      })
    });
    
    const { progress: newProgress, action: updatedAction } = await response.json();
    
    // Update the action in the selected project
    if (selectedProject) {
      selectedProject.actions = (selectedProject.actions || []).map(a => 
        a.id === updatedAction.id ? updatedAction : a
      );
    }
  }

  onMount(loadProjects);
</script>

<div class="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
  <div class="max-w-7xl mx-auto">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-2">100 Things</h1>
      <p class="text-lg text-gray-600">Track your progress on meaningful actions</p>
    </div>

    <!-- Project Creation -->
    <div class="mt-8 bg-white rounded-lg shadow p-6">
      <h2 class="text-xl font-semibold mb-4">Create New Project</h2>
      <div class="flex gap-4">
        <input
          type="text"
          bind:value={newProjectName}
          placeholder="Project name"
          class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
        <button
          on:click={createProject}
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Project
        </button>
      </div>
    </div>

    <!-- Projects List -->
    <div class="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {#each projects as project}
        <div
          class="bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
          class:ring-2={selectedProject?.id === project.id}
          class:ring-indigo-500={selectedProject?.id === project.id}
          on:click={() => selectedProject = project}
        >
          <h3 class="text-lg font-medium text-gray-900">{project.name}</h3>
          <p class="mt-1 text-sm text-gray-500">{project.description || 'No description'}</p>
          
          {#if selectedProject?.id === project.id}
            <!-- Action Creation -->
            <div class="mt-4">
              <input
                type="text"
                bind:value={newActionTitle}
                placeholder="Action title"
                class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <textarea
                bind:value={newActionDescription}
                placeholder="Action description"
                class="mt-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <button
                on:click={createAction}
                class="mt-2 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add Action
              </button>
            </div>

            <!-- Actions List -->
            <div class="mt-4 space-y-4">
              {#each project.actions || [] as action}
                <div class="border rounded-md p-4">
                  <h4 class="font-medium">{action.title}</h4>
                  <p class="text-sm text-gray-500">{action.description}</p>
                  <div class="mt-2 flex items-center justify-between">
                    <div class="text-sm">
                      Progress: {action.currentCount}/{action.targetCount}
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
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>
