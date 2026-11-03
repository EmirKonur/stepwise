<script lang="ts">
	import type { SortAlgorithm } from '../algorithms/sorting/index.ts';

	let { algorithm }: { algorithm: SortAlgorithm } = $props();
</script>

<dl class="facts">
	<div>
		<dt>Best</dt>
		<dd>{algorithm.complexity.best}</dd>
	</div>
	<div>
		<dt>Average</dt>
		<dd>{algorithm.complexity.average}</dd>
	</div>
	<div>
		<dt>Worst</dt>
		<dd>{algorithm.complexity.worst}</dd>
	</div>
	<div>
		<dt>Space</dt>
		<dd>{algorithm.complexity.space}</dd>
	</div>
	<div>
		<dt>Stable</dt>
		<dd>{algorithm.stable ? 'Yes' : 'No'}</dd>
	</div>
</dl>

<style>
	/* Ruled by the gaps, so the cells can wrap on narrow screens and keep clean lines. */
	.facts {
		display: grid;
		grid-template-columns: repeat(5, auto);
		gap: var(--rule);
		width: fit-content;
		max-width: 100%;
		margin: 0;
		border: var(--rule) solid var(--ink);
		background: var(--ink);
	}

	.facts div {
		padding: var(--space-1) var(--space-3);
		background: var(--paper);
	}

	dt {
		font-family: var(--font-mono);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--ink-soft);
	}

	dd {
		margin: 0;
		font-weight: 800;
		white-space: nowrap;
	}

	@media (max-width: 560px) {
		.facts {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			width: 100%;
		}

		.facts div {
			padding: var(--space-1) var(--space-2);
		}

		.facts div:last-child {
			grid-column: span 2;
		}
	}
</style>
