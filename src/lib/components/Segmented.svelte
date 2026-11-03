<script lang="ts" module>
	export interface Option<T extends string> {
		readonly value: T;
		readonly label: string;
		readonly hint?: string;
	}
</script>

<script lang="ts" generics="T extends string">
	import type { Snippet } from 'svelte';

	let {
		label,
		options,
		value,
		onchange,
		icon
	}: {
		label: string;
		options: readonly Option<T>[];
		value: T;
		onchange: (value: T) => void;
		/** Optional glyph before each option's text. */
		icon?: Snippet<[T]>;
	} = $props();

	const name = $props.id();
</script>

<fieldset class="segmented">
	<legend class="label">{label}</legend>
	<div class="options">
		{#each options as option (option.value)}
			<label class:checked={option.value === value} data-tip={option.hint}>
				<input
					type="radio"
					{name}
					value={option.value}
					checked={option.value === value}
					onchange={() => onchange(option.value)}
				/>
				{#if icon}{@render icon(option.value)}{/if}
				<span>{option.label}</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.segmented {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	.label {
		margin-bottom: var(--space-2);
		padding: 0;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-1);
	}

	label {
		display: inline-flex;
		align-items: center;
		gap: var(--space-2);
		padding: 5px 10px;
		border: var(--rule) solid var(--ink);
		font-size: var(--text-sm);
		font-weight: 600;
		cursor: pointer;
		user-select: none;
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
		outline-offset: 2px;
	}

	input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		pointer-events: none;
	}
</style>
