<script lang="ts">
	import '../app.css';
	import OnlineIndicator from '$lib/components/OnlineIndicator.svelte';
	let { children } = $props();
</script>

{@render children()}
<OnlineIndicator />
