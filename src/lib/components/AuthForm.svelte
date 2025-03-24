<script lang="ts">
    import { auth } from '$lib/stores/auth';
    import { getApiUrl } from '$lib/config';

    let isSignUp = false;
    let email = '';
    let password = '';
    let name = '';
    let error = '';
    let isLoading = false;

    async function handleSubmit() {
        error = '';
        isLoading = true;

        try {
            const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
            const body = isSignUp ? { email, password, name } : { email, password };

            const response = await fetch(`${getApiUrl()}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            auth.setUser(data.user, data.token);
        } catch (e) {
            if (e instanceof Error && e.message === 'Cannot log in while offline') {
                error = 'You are currently offline. Please check your internet connection and try again.';
            } else {
                error = e instanceof Error ? e.message : 'Authentication failed';
            }
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-warm-100 dark:bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
        <div>
            <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-700 dark:text-gray-100">
                {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </h2>
        </div>
        <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
            <div class="rounded-md shadow-sm -space-y-px">
                {#if isSignUp}
                    <div>
                        <label for="name" class="sr-only">Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            bind:value={name}
                            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                            placeholder="Full name"
                        />
                    </div>
                {/if}
                <div>
                    <label for="email" class="sr-only">Email address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        bind:value={email}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 {isSignUp ? '' : 'rounded-t-md'} focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Email address"
                    />
                </div>
                <div>
                    <label for="password" class="sr-only">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        bind:value={password}
                        class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 text-gray-700 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Password"
                    />
                </div>
            </div>

            {#if error}
                <div class="text-red-500 dark:text-red-400 text-sm text-center">{error}</div>
            {/if}

            <div>
                <button
                    type="submit"
                    disabled={isLoading}
                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {#if isLoading}
                        <span class="absolute left-0 inset-y-0 flex items-center pl-3">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </span>
                    {/if}
                    {isSignUp ? 'Sign up' : 'Sign in'}
                </button>
            </div>
        </form>

        <div class="text-center">
            <button
                class="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                on:click={() => isSignUp = !isSignUp}
            >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
        </div>
    </div>
</div> 