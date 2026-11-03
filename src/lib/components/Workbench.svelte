<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		stepMs,
		heading,
		aside,
		stage,
		side,
		transport
	}: {
		/** Animation length for moves at the current playback speed. */
		stepMs: number;
		heading: Snippet;
		aside: Snippet;
		stage: Snippet;
		/** Without a side column the stage takes its width. */
		side?: Snippet;
		transport: Snippet;
	} = $props();
</script>

<!-- The 2px gaps over an ink background are the visible grid. -->
<div class="workbench" class:wide={!side} style:--step-ms={`${stepMs}ms`}>
	<section class="heading">{@render heading()}</section>
	<aside class="aside" aria-label="Settings">{@render aside()}</aside>
	<section class="stage" aria-label="Visualization">{@render stage()}</section>
	{#if side}<section class="side">{@render side()}</section>{/if}
	<section class="transport" aria-label="Timeline">{@render transport()}</section>
</div>

<style>
	.workbench {
		display: grid;
		grid-template-columns: 300px minmax(0, 1fr) 440px;
		grid-template-rows: auto minmax(0, 1fr) auto;
		grid-template-areas:
			'aside heading side'
			'aside stage side'
			'transport transport transport';
		gap: var(--rule);
		flex: 1;
		height: calc(100dvh - 58px);
		min-height: 620px;
		background: var(--ink);
	}

	.workbench.wide {
		grid-template-areas:
			'aside heading heading'
			'aside stage stage'
			'transport transport transport';
	}

	.workbench > * {
		min-width: 0;
		min-height: 0;
		background: var(--paper);
	}

	.heading {
		grid-area: heading;
	}

	.aside {
		grid-area: aside;
		overflow-y: auto;
	}

	.stage {
		grid-area: stage;
		position: relative;
		display: flex;
		flex-direction: column;
	}

	.side {
		grid-area: side;
		display: flex;
		flex-direction: column;
	}

	.transport {
		grid-area: transport;
		background: var(--ink);
	}

	@media (max-width: 1360px) {
		.workbench {
			grid-template-columns: 280px minmax(0, 1fr) 380px;
		}
	}

	@media (max-width: 1100px) {
		.workbench {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-rows: auto minmax(360px, 58vh) auto auto;
			grid-template-areas:
				'heading heading'
				'stage stage'
				'transport transport'
				'aside side';
			height: auto;
			min-height: 0;
		}

		.workbench.wide {
			grid-template-rows: auto minmax(520px, auto) auto auto;
			grid-template-areas:
				'heading heading'
				'stage stage'
				'transport transport'
				'aside aside';
		}

		.side {
			min-height: 420px;
		}
	}

	@media (max-width: 760px) {
		.workbench {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: auto minmax(260px, 46vh) auto auto auto;
			grid-template-areas: 'heading' 'stage' 'transport' 'side' 'aside';
		}

		.workbench.wide {
			grid-template-rows: auto auto auto auto;
			grid-template-areas: 'heading' 'stage' 'transport' 'aside';
		}

		.side {
			min-height: 0;
		}
	}
</style>
