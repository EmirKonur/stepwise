<script lang="ts">
	import type { SortAlgorithm, SortFrame } from '../algorithms/sorting/index.ts';
	import ArrayStage from './ArrayStage.svelte';

	let {
		letter,
		algorithm,
		frame,
		operations,
		finished,
		place
	}: {
		letter: 'A' | 'B';
		algorithm: SortAlgorithm;
		frame: SortFrame;
		/** Total operations this lane needs to finish. */
		operations: number;
		finished: boolean;
		/** 1 or 2 once finished; ties share first place. */
		place: number | null;
	} = $props();

	const line = $derived((algorithm.code[frame.line - 1] ?? '').trim());
	const done = $derived(frame.counts.comparisons + frame.counts.swaps + frame.counts.writes);
</script>

<article class="lane" class:b={letter === 'B'} aria-label={`Lane ${letter}: ${algorithm.name}`}>
	<header>
		<span class="letter">{letter}</span>
		<h2>{algorithm.name}</h2>
		{#if finished}
			<span class="place" class:first={place === 1} data-testid={`place-${letter}`}>
				{place === 1 ? 'First' : 'Second'}
			</span>
		{/if}
	</header>
	<div class="bars">
		<ArrayStage
			{frame}
			buffer={algorithm.usesBuffer}
			label={`Lane ${letter}, ${algorithm.name}`}
			compact
		/>
	</div>
	<dl class="stats">
		<div>
			<dt>Comparisons</dt>
			<dd>{frame.counts.comparisons.toLocaleString('en-US')}</dd>
		</div>
		<div>
			<dt>Swaps</dt>
			<dd>{frame.counts.swaps.toLocaleString('en-US')}</dd>
		</div>
		<div>
			<dt>Writes</dt>
			<dd>{frame.counts.writes.toLocaleString('en-US')}</dd>
		</div>
		<div class="total">
			<dt>Operations</dt>
			<dd>{done.toLocaleString('en-US')}<span> / {operations.toLocaleString('en-US')}</span></dd>
		</div>
	</dl>
	<p class="line"><span class="number">{frame.line || '-'}</span><code>{line || 'idle'}</code></p>
</article>

<style>
	.lane {
		display: flex;
		flex-direction: column;
		min-width: 0;
		min-height: 0;
		background: var(--paper);
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--rule) solid var(--ink);
	}

	.letter {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		background: var(--blue);
		color: var(--on-blue);
		font-size: var(--text-lg);
		font-weight: 900;
	}

	.b .letter {
		background: var(--red);
		color: var(--on-red);
	}

	h2 {
		flex: 1;
		font-size: var(--text-xl);
		font-weight: 900;
		font-stretch: 106%;
		letter-spacing: -0.02em;
		text-transform: uppercase;
		line-height: 1;
	}

	.place {
		padding: 2px 8px;
		border: var(--rule) solid var(--ink);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.place.first {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.bars {
		flex: 1;
		min-height: 160px;
		padding: var(--space-4) var(--space-4) var(--space-2);
	}

	.stats {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.6fr);
		margin: 0;
		border-top: var(--rule) solid var(--ink);
	}

	.stats div {
		padding: var(--space-2) var(--space-3);
		border-right: var(--rule) solid var(--ink);
	}

	.stats div:last-child {
		border-right: 0;
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}

	dd {
		margin: 0;
		font-size: var(--text-xl);
		font-weight: 900;
		line-height: 1.1;
	}

	.total dd span {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 400;
		color: var(--ink-soft);
	}

	.line {
		display: flex;
		gap: var(--space-3);
		padding: var(--space-2) var(--space-4);
		border-top: var(--rule) solid var(--ink);
		background: var(--yellow);
		color: var(--on-yellow);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		white-space: pre;
		overflow: hidden;
	}

	.number {
		min-width: 2ch;
		font-weight: 600;
		text-align: right;
	}

	@media (max-width: 560px) {
		.stats {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.stats div:nth-child(2) {
			border-right: 0;
		}

		.stats div:nth-child(-n + 2) {
			border-bottom: var(--rule) solid var(--ink);
		}
	}
</style>
