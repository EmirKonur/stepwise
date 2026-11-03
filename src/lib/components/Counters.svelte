<script lang="ts" module>
	export interface CounterItem {
		readonly label: string;
		readonly value: number | string;
		readonly tone: 'blue' | 'red' | 'yellow' | 'ink' | 'paper';
		readonly hint: string;
	}
</script>

<script lang="ts">
	let { items }: { items: readonly CounterItem[] } = $props();
	const format = (value: number | string) =>
		typeof value === 'number' ? value.toLocaleString('en-US') : value;
</script>

<!-- Four counters do not fit a 400px column at display size, so they wrap two by two. -->
<dl class="counters" style:--columns={items.length > 3 ? 2 : items.length}>
	{#each items as item (item.label)}
		<div class="counter {item.tone}" data-tip={item.hint}>
			<dt>{item.label}</dt>
			<dd data-testid={`counter-${item.label.toLowerCase()}`}>{format(item.value)}</dd>
		</div>
	{/each}
</dl>

<style>
	.counters {
		display: grid;
		grid-template-columns: repeat(var(--columns), minmax(0, 1fr));
		gap: var(--rule);
		margin: 0;
		background: var(--ink);
	}

	.counter {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: var(--space-2);
		min-width: 0;
		padding: var(--space-3) var(--space-4);
		background: var(--paper);
	}

	.blue {
		background: var(--blue);
		color: var(--on-blue);
	}

	.red {
		background: var(--red);
		color: var(--on-red);
	}

	.yellow {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.ink {
		background: var(--ink);
		color: var(--paper);
	}

	dt {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	dd {
		margin: 0;
		overflow: hidden;
		font-size: var(--text-2xl);
		font-weight: 900;
		line-height: 1;
		letter-spacing: -0.03em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	@media (max-width: 1400px) {
		dd {
			font-size: var(--text-xl);
		}
	}
</style>
