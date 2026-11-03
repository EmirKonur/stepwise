<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import {
		GRID_SIZES,
		HEURISTICS,
		SEARCHES,
		WEIGHT_COST,
		findHeuristic,
		findSearch,
		recordSearch,
		type Grid,
		type GridSize,
		type Layout
	} from '#lib/algorithms/pathfinding/index.ts';
	import CodePanel from '#lib/components/CodePanel.svelte';
	import Counters from '#lib/components/Counters.svelte';
	import GridStage, { type Brush } from '#lib/components/GridStage.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Picker from '#lib/components/Picker.svelte';
	import Segmented from '#lib/components/Segmented.svelte';
	import Transport from '#lib/components/Transport.svelte';
	import Workbench from '#lib/components/Workbench.svelte';
	import { freshSeed } from '#lib/engine/index.ts';
	import { Player } from '#lib/player.svelte.ts';
	import { searchCaption } from '#lib/render/captions.ts';
	import { searchMarkers } from '#lib/render/markers.ts';
	import { formatPath, parsePath, pathGrid, type PathParams } from '#lib/url/path.ts';
	import { onExternalNavigation, shareLink, syncUrl } from '#lib/url/sync.svelte.ts';

	const initial = parsePath(page.url.searchParams);
	let params = $state<PathParams>(initial);
	let brush = $state<Brush>('wall');

	const algorithm = $derived(findSearch(params.algo) ?? SEARCHES[0]!);
	const heuristic = $derived(findHeuristic(params.heuristic) ?? HEURISTICS[0]!);
	const grid = $derived(pathGrid(params));
	const timeline = $derived(recordSearch(algorithm, grid, heuristic));
	const player = new Player(() => timeline.last, initial.step);
	const frame = $derived(timeline.seek(player.step));
	const markers = $derived(searchMarkers(timeline));
	const query = $derived(formatPath({ ...params, step: player.step }));

	syncUrl(
		() => query,
		() => !player.playing
	);
	onDestroy(() => player.destroy());

	onExternalNavigation(() => {
		params = parsePath(page.url.searchParams);
		player.reset(params.step);
	});

	function update(next: Partial<PathParams>) {
		params = { ...params, ...next };
		player.reset(0);
	}

	/**
	 * Editing while parked on the last frame keeps you there, so the final
	 * path redraws live as walls go down. Anywhere else, edits rewind.
	 */
	function edit(next: Grid) {
		const atEnd = player.last > 0 && player.step >= player.last;
		params = { ...params, custom: next };
		player.reset(atEnd ? player.last : 0);
	}

	const search = $derived(frame.state);
	const status = $derived(
		search.outcome === 'found'
			? `Path found: ${search.path.length - 1} moves, cost ${search.pathCost}`
			: search.outcome === 'unreachable'
				? 'No path: the goal is walled off'
				: frame.step === 0
					? `${grid.cols} x ${grid.rows} grid, ready`
					: 'Searching'
	);

	const sizeOptions = (Object.keys(GRID_SIZES) as GridSize[]).map((size) => ({
		value: size,
		label: size.toUpperCase(),
		hint: `${GRID_SIZES[size].cols} x ${GRID_SIZES[size].rows}`
	}));
	const layoutOptions: { value: Layout; label: string; hint: string }[] = [
		{ value: 'scatter', label: 'Scatter', hint: 'Random walls and weights' },
		{ value: 'maze', label: 'Maze', hint: 'Carved maze with a few loops' },
		{ value: 'open', label: 'Open', hint: 'An empty field' }
	];
	const brushes: { value: Brush; label: string; hint: string }[] = [
		{ value: 'wall', label: 'Wall', hint: 'Impassable' },
		{ value: 'weight', label: 'Weight', hint: `Costs ${WEIGHT_COST} to enter` },
		{ value: 'erase', label: 'Erase', hint: 'Back to open ground' }
	];
	const BRUSH_ICON = { wall: 'wall', weight: 'weight', erase: 'erase' } as const;
</script>

<svelte:head>
	<title>{algorithm.name} · Stepwise</title>
</svelte:head>

<Workbench stepMs={player.transitionMs}>
	{#snippet heading()}
		<div class="title">
			<p class="eyebrow">
				<span>Path</span>
				<span class="guarantee">{algorithm.guarantee}</span>
			</p>
			<h1>{algorithm.name}</h1>
			<p class="summary">{algorithm.summary}</p>
			<p
				class="status"
				class:found={search.outcome === 'found'}
				class:failed={search.outcome === 'unreachable'}
				data-testid="path-status"
			>
				{status}
			</p>
		</div>
	{/snippet}

	{#snippet aside()}
		<Picker
			label="Algorithm"
			items={SEARCHES.map((search) => ({ id: search.id, name: search.name, meta: '' }))}
			value={params.algo}
			onchange={(algo) => update({ algo })}
		/>
		<div class="controls">
			{#if algorithm.usesHeuristic}
				<div class="group">
					<Segmented
						label="Heuristic"
						value={heuristic.id}
						options={HEURISTICS.map((h) => ({ value: h.id, label: h.name }))}
						onchange={(id) => update({ heuristic: id })}
					/>
					<p class="note" class:warn={!heuristic.admissible}>{heuristic.note}</p>
				</div>
			{/if}
			<Segmented
				label="Brush"
				value={brush}
				options={brushes}
				onchange={(value) => (brush = value)}
			>
				{#snippet icon(value)}<Icon name={BRUSH_ICON[value]} size={14} />{/snippet}
			</Segmented>
			<p class="note">
				Drag on the grid to paint. Drag the triangle (start) or the circle (goal) to move them.
			</p>
			<Segmented
				label="Starting grid"
				value={params.layout}
				options={layoutOptions}
				onchange={(layout) => update({ layout, custom: null })}
			/>
			<div class="row">
				<Segmented
					label="Size"
					value={params.size}
					options={sizeOptions}
					onchange={(size) => update({ size, custom: null })}
				/>
				<button
					type="button"
					class="square"
					onclick={() => update({ seed: freshSeed(), custom: null })}
					aria-label="New random grid"
					data-tip="New grid (R)"
				>
					<Icon name="shuffle" />
				</button>
			</div>
			{#if params.custom}
				<p class="note">Edited by hand. Pick a starting grid to throw the edits away.</p>
			{/if}
		</div>
	{/snippet}

	{#snippet stage()}
		<ul class="legend" aria-label="Legend">
			<li><span class="swatch frontier"></span>Frontier</li>
			<li><span class="swatch visited"></span>Visited</li>
			<li><span class="swatch current"></span>Expanding</li>
			<li><span class="swatch path"></span>Path</li>
			<li><span class="dot"></span>Weight (cost {WEIGHT_COST})</li>
		</ul>
		<div class="grid">
			<GridStage {grid} {frame} {brush} onedit={edit} />
		</div>
	{/snippet}

	{#snippet side()}
		<CodePanel
			lines={algorithm.code}
			active={frame.line}
			caption={searchCaption(frame, grid, algorithm.code)}
			announce={!player.playing}
		/>
		<Counters
			items={[
				{
					label: 'Visited',
					value: frame.counts.visited,
					tone: 'blue',
					hint: 'Cells expanded so far'
				},
				{
					label: 'Frontier',
					value: search.frontier,
					tone: 'paper',
					hint: 'Cells waiting to be expanded'
				},
				{
					label: 'Pushes',
					value: frame.counts.pushes,
					tone: 'yellow',
					hint: 'Queue, stack or heap insertions'
				},
				{
					label: 'Cost',
					value: search.outcome === 'found' ? search.pathCost : '-',
					tone: 'red',
					hint: 'Weighted cost of the final path'
				}
			]}
		/>
	{/snippet}

	{#snippet transport()}
		<Transport
			{player}
			{markers}
			shareUrl={() => shareLink(query)}
			onshuffle={() => update({ seed: freshSeed(), custom: null })}
		/>
	{/snippet}
</Workbench>

<style>
	.title {
		padding: var(--space-4) var(--space-5);
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

	.guarantee {
		padding: 0 6px;
		background: var(--ink);
		color: var(--paper);
	}

	h1 {
		margin: var(--space-1) 0 var(--space-2);
		font-size: clamp(2rem, 3.8vw, 3.5rem);
		font-weight: 900;
		font-stretch: 106%;
		line-height: 0.95;
		letter-spacing: -0.035em;
		text-transform: uppercase;
	}

	.summary {
		max-width: 70ch;
		margin-bottom: var(--space-3);
		color: var(--ink-soft);
		font-size: var(--text-sm);
	}

	.status {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		border: var(--rule) solid var(--ink);
		font-weight: 700;
	}

	.status.found {
		background: var(--red);
		border-color: var(--red);
		color: var(--on-red);
	}

	.status.failed {
		background: var(--ink);
		color: var(--paper);
	}

	.controls {
		display: grid;
		gap: var(--space-4);
		padding: var(--space-4);
		border-top: var(--rule) solid var(--ink);
	}

	.group {
		display: grid;
		gap: var(--space-2);
	}

	.note {
		color: var(--ink-soft);
		font-size: var(--text-sm);
	}

	.note.warn {
		color: var(--red);
		font-weight: 600;
	}

	.row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: var(--space-3);
	}

	.square {
		display: grid;
		place-items: center;
		width: 36px;
		height: 36px;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
	}

	.square:hover {
		background: var(--yellow);
		color: var(--on-yellow);
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
		border: 1px solid var(--hair);
	}

	.swatch.frontier {
		background: var(--blue);
	}

	.swatch.visited {
		background: var(--visited);
	}

	.swatch.current {
		background: var(--yellow);
	}

	.swatch.path {
		height: 4px;
		width: 16px;
		border: 0;
		background: var(--red);
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--ink);
	}

	.grid {
		flex: 1;
		min-height: 0;
		padding: var(--space-4);
	}
</style>
