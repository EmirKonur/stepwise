<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { SORTS, findSort, recordSort } from '#lib/algorithms/sorting/index.ts';
	import ArrayStage from '#lib/components/ArrayStage.svelte';
	import CodePanel from '#lib/components/CodePanel.svelte';
	import Counters from '#lib/components/Counters.svelte';
	import InputControls from '#lib/components/InputControls.svelte';
	import Picker from '#lib/components/Picker.svelte';
	import SortFacts from '#lib/components/SortFacts.svelte';
	import Transport from '#lib/components/Transport.svelte';
	import Workbench from '#lib/components/Workbench.svelte';
	import { freshSeed } from '#lib/engine/index.ts';
	import { Player } from '#lib/player.svelte.ts';
	import { sortCaption } from '#lib/render/captions.ts';
	import { sortMarkers } from '#lib/render/markers.ts';
	import { inputValues, type InputParams } from '#lib/url/input.ts';
	import { formatSort, parseSort } from '#lib/url/sort.ts';
	import { onExternalNavigation, shareLink, syncUrl } from '#lib/url/sync.svelte.ts';

	const initial = parseSort(page.url.searchParams);
	let algoId = $state(initial.algo);
	let input = $state<InputParams>(initial);

	const algorithm = $derived(findSort(algoId) ?? SORTS[0]!);
	const values = $derived(inputValues(input));
	const timeline = $derived(recordSort(algorithm, values));
	const player = new Player(() => timeline.last, initial.step);
	const frame = $derived(timeline.seek(player.step));
	const markers = $derived(sortMarkers(timeline));
	const query = $derived(formatSort({ algo: algoId, ...input, step: player.step }));

	syncUrl(
		() => query,
		() => !player.playing
	);
	onDestroy(() => player.destroy());

	onExternalNavigation(() => {
		const next = parseSort(page.url.searchParams);
		algoId = next.algo;
		input = next;
		player.reset(next.step);
	});

	function selectAlgorithm(id: string) {
		algoId = id;
		player.reset(0);
	}

	function changeInput(next: InputParams) {
		input = next;
		player.reset(0);
	}

	function shuffle() {
		changeInput({
			...input,
			input: input.input === 'custom' ? 'random' : input.input,
			seed: freshSeed()
		});
	}

	const index = $derived(SORTS.indexOf(algorithm) + 1);
</script>

<svelte:head>
	<title>{algorithm.name} · Stepwise</title>
</svelte:head>

<Workbench stepMs={player.transitionMs}>
	{#snippet heading()}
		<div class="title">
			<p class="eyebrow">
				<span>Sort</span>
				<span>{String(index).padStart(2, '0')} / {String(SORTS.length).padStart(2, '0')}</span>
			</p>
			<h1>{algorithm.name}</h1>
			<p class="summary">{algorithm.summary}</p>
			<SortFacts {algorithm} />
		</div>
	{/snippet}

	{#snippet aside()}
		<Picker
			label="Algorithm"
			items={SORTS.map((sort) => ({ id: sort.id, name: sort.name, meta: sort.complexity.average }))}
			value={algoId}
			onchange={selectAlgorithm}
		/>
		<InputControls params={input} onchange={changeInput} />
	{/snippet}

	{#snippet stage()}
		<ul class="legend" aria-label="Legend">
			<li><span class="swatch blue"></span>Compared</li>
			<li><span class="swatch red"></span>Moved</li>
			{#if algorithm.markRole}
				<li>
					<span class="swatch yellow"></span>{algorithm.markRole.charAt(0).toUpperCase() +
						algorithm.markRole.slice(1)}
				</li>
			{/if}
			<li><span class="swatch square"></span>In final place</li>
		</ul>
		<div class="bars">
			<ArrayStage
				{frame}
				buffer={algorithm.usesBuffer}
				label={`${algorithm.name}, step ${frame.step} of ${timeline.last}`}
			/>
		</div>
	{/snippet}

	{#snippet side()}
		<CodePanel
			lines={algorithm.code}
			active={frame.line}
			caption={sortCaption(frame, algorithm)}
			announce={!player.playing}
		/>
		<Counters
			items={[
				{
					label: 'Comparisons',
					value: frame.counts.comparisons,
					tone: 'blue',
					hint: 'Every a[i] against a[j] check'
				},
				{ label: 'Swaps', value: frame.counts.swaps, tone: 'red', hint: 'Two elements exchanged' },
				{
					label: 'Writes',
					value: frame.counts.writes,
					tone: 'yellow',
					hint: 'Single stores: into the merge buffer and back'
				}
			]}
		/>
	{/snippet}

	{#snippet transport()}
		<Transport {player} {markers} shareUrl={() => shareLink(query)} onshuffle={shuffle} />
	{/snippet}
</Workbench>

<style>
	.title {
		padding: var(--space-4) var(--space-5) var(--space-4);
	}

	.eyebrow {
		display: flex;
		justify-content: space-between;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		margin: var(--space-1) 0 var(--space-2);
		font-size: clamp(2.25rem, 4.2vw, var(--text-3xl));
		font-weight: 900;
		font-stretch: 108%;
		line-height: 0.95;
		letter-spacing: -0.035em;
		text-transform: uppercase;
	}

	.summary {
		max-width: 62ch;
		margin-bottom: var(--space-3);
		color: var(--ink-soft);
		font-size: var(--text-sm);
	}

	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2) var(--space-4);
		margin: 0;
		padding: var(--space-3) var(--space-5);
		list-style: none;
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		border-bottom: 1px solid var(--hair);
	}

	.legend li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	.swatch {
		width: 12px;
		height: 12px;
		background: var(--ink);
	}

	.swatch.blue {
		background: var(--blue);
	}

	.swatch.red {
		background: var(--red);
	}

	.swatch.yellow {
		background: var(--yellow);
		outline: 2px solid var(--yellow-edge);
		outline-offset: -2px;
	}

	.swatch.square {
		width: 6px;
		height: 6px;
	}

	.bars {
		flex: 1;
		min-height: 0;
		padding: var(--space-5) var(--space-5) var(--space-3);
	}
</style>
