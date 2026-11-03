<script lang="ts">
	import '@fontsource-variable/archivo/wdth.css';
	import '@fontsource/ibm-plex-mono/latin-400.css';
	import '@fontsource/ibm-plex-mono/latin-600.css';
	import '../app.css';
	import Cheatsheet from '#lib/components/Cheatsheet.svelte';
	import SiteHeader from '#lib/components/SiteHeader.svelte';
	import { onMount } from 'svelte';
	import { shortcutAllowed, watchFocusOrigin } from '#lib/keyboard.ts';
	import { theme } from '#lib/theme.svelte.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
	let helpOpen = $state(false);
	onMount(watchFocusOrigin);

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || !shortcutAllowed(event)) return;
		if (event.key === '?') {
			event.preventDefault();
			helpOpen = !helpOpen;
		} else if (event.key === 't' || event.key === 'T') {
			event.preventDefault();
			theme.toggle();
		}
	}
</script>

<svelte:window {onkeydown} />

<div class="app">
	<a class="skip" href="#main">Skip to content</a>
	<SiteHeader onhelp={() => (helpOpen = true)} />
	<main id="main">
		{@render children()}
	</main>
</div>
<Cheatsheet bind:open={helpOpen} />

<style>
	.app {
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	main {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.skip {
		position: absolute;
		left: var(--space-2);
		top: -100px;
		z-index: 50;
		padding: var(--space-2) var(--space-3);
		background: var(--yellow);
		color: var(--on-yellow);
		font-weight: 700;
	}

	.skip:focus {
		top: var(--space-2);
	}
</style>
