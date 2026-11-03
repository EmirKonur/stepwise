<script lang="ts">
	import { onDestroy } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { resolve } from '$app/paths';
	import { SORTS, generateInput, recordSort } from '#lib/algorithms/sorting/index.ts';
	import ArrayStage from '#lib/components/ArrayStage.svelte';

	// The hero is a real recording, not an illustration: quicksort on a seeded input, on a loop.
	const quick = SORTS.find((sort) => sort.id === 'quick')!;
	const hero = recordSort(quick, generateInput('random', 24, '1919'));
	const resting = Math.round(hero.last * 0.42);
	let step = $state(resting);

	let timer: ReturnType<typeof setInterval> | undefined;
	$effect(() => {
		if (prefersReducedMotion.current) {
			step = resting;
			return;
		}
		timer = setInterval(() => {
			step = step >= hero.last + 12 ? 0 : step + 1;
		}, 110);
		return () => clearInterval(timer);
	});
	onDestroy(() => clearInterval(timer));

	const frame = $derived(hero.seek(step));

	const modes = [
		{
			href: resolve('/sort'),
			number: '01',
			title: 'Sort',
			tone: 'red',
			line: 'Seven sorts on random, nearly sorted, reversed, few-unique or hand-typed input.',
			list: 'Bubble, insertion, selection, Shell, merge, quick, heap'
		},
		{
			href: resolve('/race'),
			number: '02',
			title: 'Race',
			tone: 'blue',
			line: 'Two sorts, one input, one operation per tick. Watch the counters diverge.',
			list: 'Any pair of the seven'
		},
		{
			href: resolve('/path'),
			number: '03',
			title: 'Path',
			tone: 'yellow',
			line: 'Paint walls and weights, drag the endpoints, compare how each search spreads.',
			list: 'BFS, DFS, Dijkstra, A* with four heuristics'
		},
		{
			href: resolve('/tree'),
			number: '04',
			title: 'Tree',
			tone: 'ink',
			line: 'Insert, search and delete, with every pointer change and rotation on the timeline.',
			list: 'Binary search tree, AVL tree'
		}
	] as const;
</script>

<svelte:head>
	<title>Stepwise · algorithms, one event at a time</title>
</svelte:head>

<div class="index">
	<section class="hero">
		<div class="name">
			<h1>Step<br />wise</h1>
			<p class="pitch">Algorithms, one event at a time.</p>
		</div>
		<div class="copy">
			<p>
				Pick an algorithm, shape its input, then play, pause or scrub through every comparison,
				swap, relaxation and rotation. The code panel follows along line by line, the counters keep
				score, and the address bar always links to the exact moment on screen.
			</p>
			<p class="keys">Press <kbd>?</kbd> anywhere for the keyboard.</p>
		</div>
		<div class="bars" aria-hidden="true" style:--step-ms="100ms">
			<ArrayStage {frame} buffer={false} label="Quicksort playing on a loop" compact />
		</div>
	</section>

	<nav class="modes" aria-label="Visualizers">
		{#each modes as mode (mode.number)}
			<a class="mode {mode.tone}" href={mode.href}>
				<span class="number">{mode.number}</span>
				<span class="title">{mode.title}</span>
				<span class="line">{mode.line}</span>
				<span class="list">{mode.list}</span>
				<span class="glyph" aria-hidden="true">
					{#if mode.title === 'Sort'}
						<svg viewBox="0 0 60 40"
							><rect x="2" y="28" width="8" height="12" /><rect
								x="14"
								y="20"
								width="8"
								height="20"
							/><rect x="26" y="12" width="8" height="28" /><rect
								x="38"
								y="6"
								width="8"
								height="34"
							/><rect x="50" y="0" width="8" height="40" /></svg
						>
					{:else if mode.title === 'Race'}
						<svg viewBox="0 0 60 40"
							><rect x="0" y="4" width="44" height="12" /><rect
								x="0"
								y="24"
								width="60"
								height="12"
							/></svg
						>
					{:else if mode.title === 'Path'}
						<svg viewBox="0 0 60 40"
							><path d="M4 34H24V6H56" fill="none" stroke-width="6" /><rect
								x="0"
								y="30"
								width="8"
								height="8"
							/><circle cx="56" cy="6" r="5" /></svg
						>
					{:else}
						<svg viewBox="0 0 60 40"
							><path d="M30 8 14 30M30 8l16 22" stroke-width="4" /><circle
								cx="30"
								cy="8"
								r="7"
							/><circle cx="14" cy="31" r="7" /><circle cx="46" cy="31" r="7" /></svg
						>
					{/if}
				</span>
			</a>
		{/each}
	</nav>

	<section class="how" aria-labelledby="how-title">
		<h2 id="how-title">How it works</h2>
		<div class="steps">
			<article>
				<span class="n">1</span>
				<h3>Algorithms yield events</h3>
				<p>
					Each algorithm is a plain generator that yields <code>compare</code>, <code>swap</code>,
					<code>visit</code>, <code>relax</code> or <code>rotate</code> events. A sort never sees its
					array; it asks for comparisons and is told the answer.
				</p>
			</article>
			<article>
				<span class="n">2</span>
				<h3>A recorder keeps the run</h3>
				<p>
					The whole run is recorded up front as an event log with a full snapshot every 64 events.
					Any step is at most 63 replays away, so stepping backwards and scrubbing cost the same as
					stepping forwards.
				</p>
			</article>
			<article>
				<span class="n">3</span>
				<h3>Every frame is a link</h3>
				<p>
					Algorithm, input, seed and step live in the URL. Seeds make random inputs reproducible, so
					a link opens on the same comparison, in any browser.
				</p>
			</article>
		</div>
	</section>
</div>

<style>
	.index {
		display: grid;
		gap: var(--rule);
		background: var(--ink);
	}

	.index > * {
		background: var(--paper);
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		grid-template-rows: auto 1fr;
		grid-template-areas:
			'name bars'
			'copy bars';
		gap: var(--rule);
		background: var(--ink);
	}

	.hero > * {
		background: var(--paper);
	}

	.name {
		grid-area: name;
		padding: var(--space-6) var(--space-6) var(--space-5);
	}

	h1 {
		font-size: clamp(4.5rem, 11vw, 10.5rem);
		font-weight: 900;
		font-stretch: 112%;
		line-height: 0.82;
		letter-spacing: -0.05em;
		text-transform: uppercase;
	}

	.pitch {
		margin-top: var(--space-5);
		font-size: var(--text-xl);
		font-weight: 800;
		line-height: 1.1;
	}

	.copy {
		grid-area: copy;
		display: grid;
		align-content: start;
		gap: var(--space-4);
		padding: var(--space-5) var(--space-6) var(--space-6);
		font-size: var(--text-lg);
	}

	.copy p {
		max-width: 62ch;
	}

	.keys {
		font-size: var(--text-md);
		color: var(--ink-soft);
	}

	.bars {
		grid-area: bars;
		min-height: 420px;
		padding: var(--space-6) var(--space-6) var(--space-4);
	}

	.modes {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: var(--rule);
		background: var(--ink);
	}

	.mode {
		position: relative;
		display: grid;
		grid-template-rows: auto auto 1fr auto;
		gap: var(--space-2);
		min-height: 300px;
		padding: var(--space-5);
		text-decoration: none;
		transition: background 120ms var(--ease);
	}

	.mode.red {
		background: var(--red);
		color: var(--on-red);
	}

	.mode.blue {
		background: var(--blue);
		color: var(--on-blue);
	}

	.mode.yellow {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.mode.ink {
		background: var(--ink);
		color: var(--paper);
	}

	.mode:hover,
	.mode:focus-visible {
		background: var(--paper);
		color: var(--ink);
	}

	.mode:focus-visible {
		outline-offset: -6px;
	}

	.number {
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.title {
		font-size: var(--text-3xl);
		font-weight: 900;
		font-stretch: 110%;
		line-height: 0.9;
		letter-spacing: -0.04em;
		text-transform: uppercase;
	}

	.line {
		font-weight: 600;
		max-width: 32ch;
	}

	.list {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		letter-spacing: 0.02em;
	}

	.glyph {
		position: absolute;
		top: var(--space-5);
		right: var(--space-5);
		width: 60px;
	}

	.glyph svg {
		display: block;
		width: 100%;
		fill: currentColor;
		stroke: currentColor;
	}

	.glyph svg rect,
	.glyph svg circle {
		stroke: none;
	}

	.how {
		padding: var(--space-6);
	}

	h2 {
		margin-bottom: var(--space-5);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: var(--space-6);
	}

	.steps article {
		display: grid;
		align-content: start;
		gap: var(--space-2);
		padding-top: var(--space-3);
		border-top: 6px solid var(--ink);
	}

	.n {
		font-size: var(--text-2xl);
		font-weight: 900;
		line-height: 1;
	}

	h3 {
		font-size: var(--text-lg);
		font-weight: 800;
	}

	.steps p {
		color: var(--ink-soft);
	}

	code {
		font-family: var(--font-mono);
		font-size: 0.9em;
		color: var(--ink);
	}

	@media (max-width: 1000px) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
			grid-template-areas: 'name' 'bars' 'copy';
		}

		.bars {
			min-height: 300px;
		}

		.modes {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.steps {
			grid-template-columns: minmax(0, 1fr);
		}
	}

	@media (max-width: 560px) {
		.name,
		.copy,
		.how {
			padding: var(--space-5) var(--space-4);
		}

		.modes {
			grid-template-columns: minmax(0, 1fr);
		}

		.mode {
			min-height: 220px;
		}
	}
</style>
