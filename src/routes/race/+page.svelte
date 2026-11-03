<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import {
		SORTS,
		findSort,
		isOperation,
		recordSort,
		type SortAlgorithm
	} from '#lib/algorithms/sorting/index.ts';
	import InputControls from '#lib/components/InputControls.svelte';
	import RaceLane from '#lib/components/RaceLane.svelte';
	import Transport from '#lib/components/Transport.svelte';
	import Workbench from '#lib/components/Workbench.svelte';
	import { freshSeed } from '#lib/engine/index.ts';
	import { Player } from '#lib/player.svelte.ts';
	import type { Marker } from '#lib/render/markers.ts';
	import { inputValues, type InputParams } from '#lib/url/input.ts';
	import { formatRace, parseRace } from '#lib/url/race.ts';
	import { onExternalNavigation, shareLink, syncUrl } from '#lib/url/sync.svelte.ts';

	const initial = parseRace(page.url.searchParams);
	let aId = $state(initial.a);
	let bId = $state(initial.b);
	let input = $state<InputParams>(initial);

	const values = $derived(inputValues(input));
	const laneA = $derived(prepare(findSort(aId) ?? SORTS[0]!, values));
	const laneB = $derived(prepare(findSort(bId) ?? SORTS[0]!, values));
	const last = $derived(Math.max(laneA.operations.length, laneB.operations.length));
	const player = new Player(() => last, initial.tick);

	/**
	 * The race clock counts operations, not events: one tick is one compare,
	 * swap or element write in each lane. Bookkeeping events (focus, marks,
	 * code-line moves) ride along for free, so a chatty listing is not penalized.
	 */
	function prepare(algorithm: SortAlgorithm, input: readonly number[]) {
		const timeline = recordSort(algorithm, input);
		return { algorithm, timeline, operations: timeline.stepsWhere(isOperation) };
	}

	function frameAt(lane: ReturnType<typeof prepare>, tick: number) {
		if (tick === 0) return lane.timeline.seek(0);
		const step =
			tick >= lane.operations.length ? lane.timeline.last : (lane.operations[tick - 1] ?? 0);
		return lane.timeline.seek(step);
	}

	const frameA = $derived(frameAt(laneA, player.step));
	const frameB = $derived(frameAt(laneB, player.step));
	const doneA = $derived(player.step >= laneA.operations.length);
	const doneB = $derived(player.step >= laneB.operations.length);
	const opsA = $derived(laneA.operations.length);
	const opsB = $derived(laneB.operations.length);

	const markers = $derived<Marker[]>(
		[
			{ step: opsA, tone: 'blue' as const, label: `A finishes` },
			{ step: opsB, tone: 'red' as const, label: `B finishes` }
		].toSorted((x, y) => x.step - y.step)
	);

	const query = $derived(formatRace({ a: aId, b: bId, ...input, tick: player.step }));
	syncUrl(
		() => query,
		() => !player.playing
	);
	onDestroy(() => player.destroy());

	onExternalNavigation(() => {
		const next = parseRace(page.url.searchParams);
		aId = next.a;
		bId = next.b;
		input = next;
		player.reset(next.tick);
	});

	function placeOf(mine: number, theirs: number, finished: boolean): number | null {
		if (!finished) return null;
		return mine <= theirs ? 1 : 2;
	}

	const verdict = $derived.by(() => {
		if (!doneA || !doneB) return null;
		const nameA = laneA.algorithm.name;
		const nameB = laneB.algorithm.name;
		if (opsA === opsB) return `Dead heat: both need ${opsA.toLocaleString('en-US')} operations.`;
		const [winner, loser, w, l] =
			opsA < opsB ? [nameA, nameB, opsA, opsB] : [nameB, nameA, opsB, opsA];
		return `${winner} finished ${(l - w).toLocaleString('en-US')} operations ahead of ${loser} (${w.toLocaleString('en-US')} against ${l.toLocaleString('en-US')}).`;
	});

	function changeInput(next: InputParams) {
		input = next;
		player.reset(0);
	}

	const sortOptions = SORTS.map((sort) => ({ id: sort.id, name: sort.name }));
</script>

<svelte:head>
	<title>{laneA.algorithm.name} vs {laneB.algorithm.name} · Stepwise</title>
</svelte:head>

<Workbench stepMs={player.transitionMs}>
	{#snippet heading()}
		<div class="title">
			<p class="eyebrow">Race · identical input, one operation per tick</p>
			<h1>
				<span class="a">{laneA.algorithm.name}</span>
				<span class="vs">vs</span>
				<span class="b">{laneB.algorithm.name}</span>
			</h1>
			<p class="verdict" class:final={verdict !== null} aria-live="polite">
				{verdict ??
					'Each tick, both lanes perform one comparison, swap or write. Fewer operations crosses first.'}
			</p>
		</div>
	{/snippet}

	{#snippet aside()}
		<div class="lanes">
			{#each [{ letter: 'A', value: aId }, { letter: 'B', value: bId }] as lane (lane.letter)}
				<label class="select">
					<span class="label">Lane {lane.letter}</span>
					<select
						value={lane.value}
						onchange={(event) => {
							if (lane.letter === 'A') aId = event.currentTarget.value;
							else bId = event.currentTarget.value;
							player.reset(0);
						}}
					>
						{#each sortOptions as option (option.id)}
							<option value={option.id}>{option.name}</option>
						{/each}
					</select>
				</label>
			{/each}
		</div>
		<InputControls params={input} onchange={changeInput} />
	{/snippet}

	{#snippet stage()}
		<div class="track">
			<RaceLane
				letter="A"
				algorithm={laneA.algorithm}
				frame={frameA}
				operations={opsA}
				finished={doneA}
				place={placeOf(opsA, opsB, doneA)}
			/>
			<RaceLane
				letter="B"
				algorithm={laneB.algorithm}
				frame={frameB}
				operations={opsB}
				finished={doneB}
				place={placeOf(opsB, opsA, doneB)}
			/>
		</div>
	{/snippet}

	{#snippet transport()}
		<Transport
			{player}
			{markers}
			unit="Tick"
			shareUrl={() => shareLink(query)}
			onshuffle={() =>
				changeInput({
					...input,
					input: input.input === 'custom' ? 'random' : input.input,
					seed: freshSeed()
				})}
		/>
	{/snippet}
</Workbench>

<style>
	.title {
		padding: var(--space-4) var(--space-5);
	}

	.eyebrow {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	h1 {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0 var(--space-4);
		margin: var(--space-1) 0 var(--space-3);
		font-size: clamp(2rem, 3.6vw, 3.5rem);
		font-weight: 900;
		font-stretch: 106%;
		line-height: 1;
		letter-spacing: -0.035em;
		text-transform: uppercase;
	}

	.vs {
		font-family: var(--font-mono);
		font-size: var(--text-lg);
		font-weight: 600;
		letter-spacing: 0;
		text-transform: lowercase;
	}

	.a,
	.b {
		text-decoration: underline;
		text-decoration-thickness: 0.16em;
		text-underline-offset: 0.08em;
		text-decoration-skip-ink: none;
	}

	.a {
		text-decoration-color: var(--blue);
	}

	.b {
		text-decoration-color: var(--red);
	}

	.verdict {
		max-width: 80ch;
		color: var(--ink-soft);
		font-size: var(--text-sm);
	}

	.verdict.final {
		display: inline-block;
		padding: var(--space-1) var(--space-3);
		background: var(--yellow);
		color: var(--on-yellow);
		font-weight: 700;
	}

	.lanes {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
		border-bottom: var(--rule) solid var(--ink);
	}

	.select {
		display: grid;
		gap: var(--space-1);
	}

	.label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	select {
		padding: var(--space-2) var(--space-3);
		border: var(--rule) solid var(--ink);
		border-radius: 0;
		background: var(--paper);
		font-weight: 700;
	}

	.track {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: var(--rule);
		flex: 1;
		min-height: 0;
		background: var(--ink);
	}

	@media (max-width: 900px) {
		.track {
			grid-template-columns: minmax(0, 1fr);
			grid-auto-rows: minmax(300px, auto);
		}
	}
</style>
