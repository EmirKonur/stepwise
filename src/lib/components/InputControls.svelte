<script lang="ts">
	import { untrack } from 'svelte';
	import {
		INPUT_KINDS,
		INPUT_LABELS,
		MAX_SIZE,
		MAX_VALUE,
		MIN_SIZE,
		parseCustom,
		type InputKind
	} from '../algorithms/sorting/index.ts';
	import { freshSeed } from '../engine/index.ts';
	import type { InputParams } from '../url/input.ts';
	import Icon from './Icon.svelte';
	import Segmented from './Segmented.svelte';

	let { params, onchange }: { params: InputParams; onchange: (next: InputParams) => void } =
		$props();

	const HINTS: Record<InputKind, string> = {
		random: 'A shuffled permutation of 1..n',
		nearly: 'Sorted, then a few short-range swaps',
		reversed: 'n down to 1',
		few: 'Only four distinct values',
		custom: 'Type your own list'
	};

	// The draft starts from the incoming values and then belongs to the textarea,
	// so half-typed (invalid) text survives while the last valid list stays live.
	let draft = $state(untrack(() => params.values?.join(', ')) ?? '5, 2, 9, 1, 7, 3, 8, 4');
	const parsed = $derived(parseCustom(draft));
	const sizeId = $props.id();

	function choose(kind: InputKind) {
		if (kind === 'custom') {
			onchange({
				...params,
				input: 'custom',
				values: parsed.ok ? parsed.values : [5, 2, 9, 1, 7, 3, 8, 4]
			});
		} else {
			onchange({ ...params, input: kind, values: null });
		}
	}

	function edit(text: string) {
		draft = text;
		const result = parseCustom(text);
		if (result.ok)
			onchange({ ...params, input: 'custom', values: result.values, size: result.values.length });
	}
</script>

<div class="input">
	<Segmented
		label="Input"
		value={params.input}
		options={INPUT_KINDS.map((kind) => ({
			value: kind,
			label: INPUT_LABELS[kind],
			hint: HINTS[kind]
		}))}
		onchange={choose}
	/>

	{#if params.input === 'custom'}
		<label class="custom">
			<span class="label">Values, 0 to {MAX_VALUE}</span>
			<textarea
				rows="3"
				spellcheck="false"
				value={draft}
				oninput={(event) => edit(event.currentTarget.value)}
				aria-invalid={!parsed.ok}
				aria-describedby={`${sizeId}-error`}></textarea>
			<span class="error" id={`${sizeId}-error`} role="status">{parsed.ok ? '' : parsed.error}</span
			>
		</label>
	{:else}
		<label class="size">
			<span class="label">Size</span>
			<input
				id={sizeId}
				type="range"
				min={MIN_SIZE}
				max={MAX_SIZE}
				value={params.size}
				oninput={(event) => onchange({ ...params, size: Number(event.currentTarget.value) })}
			/>
			<output for={sizeId}>{params.size}</output>
		</label>
		<div class="seed">
			<span class="label">Seed</span>
			<code>{params.seed}</code>
			<button
				type="button"
				onclick={() => onchange({ ...params, seed: freshSeed() })}
				aria-label="New random seed"
				data-tip="New seed (R)"
			>
				<Icon name="shuffle" />
			</button>
		</div>
	{/if}
</div>

<style>
	.input {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-4);
	}

	.label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.size {
		display: grid;
		grid-template-columns: auto 1fr 3ch;
		align-items: center;
		gap: var(--space-3);
	}

	.size input {
		accent-color: var(--ink);
	}

	output {
		font-weight: 800;
		text-align: right;
	}

	.seed {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: var(--space-3);
	}

	code {
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.seed button {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
	}

	.seed button:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.custom {
		display: grid;
		gap: var(--space-2);
	}

	textarea {
		width: 100%;
		padding: var(--space-2);
		border: var(--rule) solid var(--ink);
		border-radius: 0;
		background: var(--paper);
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		resize: vertical;
	}

	textarea[aria-invalid='true'] {
		border-color: var(--red);
	}

	.error {
		min-height: 1.3em;
		color: var(--red);
		font-size: var(--text-sm);
		font-weight: 600;
	}
</style>
