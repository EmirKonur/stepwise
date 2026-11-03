<script lang="ts" module>
	export interface PickerItem {
		readonly id: string;
		readonly name: string;
		readonly meta: string;
	}
</script>

<script lang="ts">
	let {
		label,
		items,
		value,
		onchange
	}: {
		label: string;
		items: readonly PickerItem[];
		value: string;
		onchange: (id: string) => void;
	} = $props();

	const name = $props.id();
</script>

<fieldset class="picker">
	<legend class="label">{label}</legend>
	{#each items as item, index (item.id)}
		<label class:checked={item.id === value}>
			<input
				type="radio"
				{name}
				value={item.id}
				checked={item.id === value}
				onchange={() => onchange(item.id)}
			/>
			<span class="index">{String(index + 1).padStart(2, '0')}</span>
			<span class="name">{item.name}</span>
			<span class="meta">{item.meta}</span>
		</label>
	{/each}
</fieldset>

<style>
	.picker {
		display: grid;
		margin: 0;
		padding: 0;
		border: 0;
		border-top: var(--rule) solid var(--ink);
	}

	.label {
		padding: var(--space-3) var(--space-4) var(--space-2);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		float: left;
		width: 100%;
	}

	label {
		display: grid;
		grid-template-columns: 2rem 1fr auto;
		align-items: baseline;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-4);
		border-top: 1px solid var(--hair);
		cursor: pointer;
	}

	label:hover {
		background: var(--tint);
	}

	label.checked {
		background: var(--ink);
		color: var(--paper);
	}

	label:has(input:focus-visible) {
		outline: 3px solid var(--blue);
		outline-offset: -3px;
	}

	input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}

	.index {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	label.checked .index {
		color: var(--yellow);
	}

	.name {
		font-weight: 700;
	}

	.meta {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		color: var(--ink-soft);
	}

	label.checked .meta {
		color: inherit;
		opacity: 0.8;
	}
</style>
