<script lang="ts">
	import { onDestroy } from 'svelte';
	import { page } from '$app/state';
	import {
		MAX_KEY,
		MAX_NODES,
		MAX_OPS,
		MIN_KEY,
		TREES,
		findTree,
		height,
		reachableNodes,
		recordTree,
		starterOps,
		type TreeOpKind
	} from '#lib/algorithms/trees/index.ts';
	import CodePanel from '#lib/components/CodePanel.svelte';
	import Counters from '#lib/components/Counters.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Picker from '#lib/components/Picker.svelte';
	import Transport from '#lib/components/Transport.svelte';
	import TreeStage from '#lib/components/TreeStage.svelte';
	import Workbench from '#lib/components/Workbench.svelte';
	import { freshSeed } from '#lib/engine/index.ts';
	import { Player } from '#lib/player.svelte.ts';
	import { treeCaption } from '#lib/render/captions.ts';
	import { treeMarkers } from '#lib/render/markers.ts';
	import { onExternalNavigation, shareLink, syncUrl } from '#lib/url/sync.svelte.ts';
	import { formatTree, parseTree, type TreeParams } from '#lib/url/tree.ts';

	const initial = parseTree(page.url.searchParams);
	let params = $state<TreeParams>(initial);
	let key = $state<number | null>(null);
	let formError = $state('');

	const algorithm = $derived(findTree(params.algo) ?? TREES[0]!);
	const timeline = $derived(recordTree(algorithm, params.ops));
	const player = new Player(() => timeline.last, initial.step ?? Number.POSITIVE_INFINITY);
	const frame = $derived(timeline.seek(player.step));
	const markers = $derived(treeMarkers(timeline));
	const begins = $derived(timeline.stepsWhere((event) => event.type === 'begin'));
	const query = $derived(formatTree({ ...params, step: player.step }));

	const finalTree = $derived(timeline.seek(timeline.last).state);
	const finalKeys = $derived(
		reachableNodes(finalTree).map((node) => finalTree.key[node] as number)
	);

	syncUrl(
		() => query,
		() => !player.playing
	);
	onDestroy(() => player.destroy());

	onExternalNavigation(() => {
		params = parseTree(page.url.searchParams);
		player.reset(params.step ?? player.last);
	});

	const current = $derived(frame.state);
	const kind = $derived<TreeOpKind>(current.op?.kind ?? 'insert');
	const nodeCount = $derived(reachableNodes(current).length);

	/** Appends an operation to the history and plays it from its first event. */
	function perform(op: TreeOpKind) {
		if (key === null || !Number.isInteger(key) || key < MIN_KEY || key > MAX_KEY) {
			formError = `Keys are whole numbers from ${MIN_KEY} to ${MAX_KEY}.`;
			return;
		}
		if (params.ops.length >= MAX_OPS) {
			formError = `The history is full (${MAX_OPS} operations). Start a new tree.`;
			return;
		}
		if (op === 'insert' && !finalKeys.includes(key) && finalKeys.length >= MAX_NODES) {
			formError = `The tree is full (${MAX_NODES} nodes). Delete a key first.`;
			return;
		}
		formError = '';
		params = { ...params, ops: [...params.ops, { kind: op, key }] };
		player.reset((begins.at(-1) ?? 1) - 1);
		player.play();
	}

	function randomKey(): number {
		const absent = Array.from({ length: MAX_KEY }, (_, i) => i + 1).filter(
			(candidate) => !finalKeys.includes(candidate)
		);
		const pool = absent.length > 0 ? absent : finalKeys;
		const [roll = 0] = crypto.getRandomValues(new Uint32Array(1));
		return pool[roll % pool.length] ?? MIN_KEY;
	}

	function newTree() {
		params = { ...params, ops: starterOps(freshSeed()) };
		formError = '';
		player.reset(player.last);
	}

	function clearTree() {
		params = { ...params, ops: [] };
		formError = '';
		player.reset(0);
	}

	const VERB: Record<TreeOpKind, string> = { insert: 'Insert', search: 'Search', delete: 'Delete' };
	const LETTER: Record<TreeOpKind, string> = { insert: '+', search: '?', delete: '-' };
	const activeOp = $derived(current.opCount - 1);
</script>

<svelte:head>
	<title>{algorithm.name} · Stepwise</title>
</svelte:head>

<Workbench stepMs={player.transitionMs}>
	{#snippet heading()}
		<div class="title">
			<p class="eyebrow">
				<span>Tree</span>
				<span>
					{#if current.op}
						Operation {current.opCount} of {params.ops.length}
					{:else}
						{params.ops.length} operations
					{/if}
				</span>
			</p>
			<h1>{algorithm.name}</h1>
			<p class="summary">{algorithm.summary}</p>
			<p class="op">
				{#if current.op}
					<span class="verb">{VERB[current.op.kind]}</span>
					<span class="key">{current.op.key}</span>
					{#if current.outcome}<span class="outcome {current.outcome}">{current.outcome}</span>{/if}
				{:else}
					<span class="verb">Ready</span>
				{/if}
			</p>
		</div>
	{/snippet}

	{#snippet aside()}
		<Picker
			label="Structure"
			items={TREES.map((tree) => ({
				id: tree.id,
				name: tree.name,
				meta: tree.id === 'avl' ? 'balanced' : ''
			}))}
			value={params.algo}
			onchange={(algo) => {
				params = { ...params, algo };
				player.reset(player.last);
			}}
		/>
		<form
			class="ops"
			onsubmit={(event) => {
				event.preventDefault();
				perform('insert');
			}}
		>
			<label class="field">
				<span class="label">Key, {MIN_KEY} to {MAX_KEY}</span>
				<span class="input-row">
					<input
						type="number"
						inputmode="numeric"
						min={MIN_KEY}
						max={MAX_KEY}
						bind:value={key}
						placeholder="42"
						aria-invalid={formError !== ''}
						aria-describedby="op-error"
					/>
					<button
						type="button"
						class="square"
						onclick={() => (key = randomKey())}
						aria-label="Random key not in the tree"
						data-tip="Random new key"
					>
						<Icon name="shuffle" />
					</button>
				</span>
			</label>
			<div class="actions">
				<button type="submit" class="action insert"><Icon name="plus" size={16} />Insert</button>
				<button type="button" class="action" onclick={() => perform('search')}>
					<Icon name="search" size={16} />Search
				</button>
				<button type="button" class="action" onclick={() => perform('delete')}>
					<Icon name="minus" size={16} />Delete
				</button>
			</div>
			<p class="error" id="op-error" role="status">{formError}</p>
			<p class="hint">Click a node to use its key.</p>
		</form>
		<section class="history" aria-labelledby="history-title">
			<header>
				<h2 id="history-title" class="label">History</h2>
				<span class="tools">
					<button type="button" onclick={newTree} data-tip="New random tree (R)">New</button>
					<button type="button" onclick={clearTree} data-tip="Empty the tree">Clear</button>
				</span>
			</header>
			{#if params.ops.length === 0}
				<p class="hint">No operations yet.</p>
			{:else}
				<ol>
					{#each params.ops as op, index (index)}
						<li>
							<button
								type="button"
								class:active={index === activeOp}
								onclick={() => player.reset((begins[index] ?? 1) - 1)}
								aria-label={`Jump to ${VERB[op.kind]} ${op.key}`}
							>
								<span class="sign">{LETTER[op.kind]}</span>{op.key}
							</button>
						</li>
					{/each}
				</ol>
			{/if}
		</section>
	{/snippet}

	{#snippet stage()}
		<ul class="legend" aria-label="Legend">
			<li><span class="swatch yellow"></span>Cursor</li>
			<li><span class="swatch blue"></span>Compared</li>
			<li><span class="swatch red"></span>Rotated, copied or found</li>
			{#if algorithm.id === 'avl'}<li><span class="mono">+1</span>Balance factor</li>{/if}
		</ul>
		<div class="tree">
			<TreeStage
				{frame}
				showBalance={algorithm.id === 'avl'}
				duration={player.transitionMs * 1.4}
				onpick={(picked) => (key = picked)}
			/>
		</div>
	{/snippet}

	{#snippet side()}
		<CodePanel
			lines={algorithm.code[kind]}
			active={frame.line}
			caption={treeCaption(frame, algorithm.code[kind])}
			announce={!player.playing}
		/>
		<Counters
			items={[
				{
					label: 'Comparisons',
					value: frame.counts.comparisons,
					tone: 'blue',
					hint: 'Key comparisons, all operations'
				},
				{
					label: 'Rotations',
					value: frame.counts.rotations,
					tone: 'red',
					hint: 'AVL rebalancing rotations'
				},
				{
					label: 'Height',
					value: height(current, current.root),
					tone: 'yellow',
					hint: 'Levels from root to deepest leaf'
				},
				{ label: 'Nodes', value: nodeCount, tone: 'paper', hint: `At most ${MAX_NODES}` }
			]}
		/>
	{/snippet}

	{#snippet transport()}
		<Transport {player} {markers} shareUrl={() => shareLink(query)} onshuffle={newTree} />
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

	.op {
		display: flex;
		align-items: stretch;
		border: var(--rule) solid var(--ink);
		width: fit-content;
		font-weight: 800;
	}

	.op > span {
		padding: var(--space-1) var(--space-3);
	}

	.op .verb {
		background: var(--ink);
		color: var(--paper);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.op .key {
		min-width: 3ch;
		text-align: center;
	}

	.outcome {
		border-left: var(--rule) solid var(--ink);
		text-transform: capitalize;
	}

	.outcome.found,
	.outcome.inserted,
	.outcome.deleted {
		background: var(--red);
		color: var(--on-red);
	}

	.outcome.missing,
	.outcome.duplicate {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.ops {
		display: grid;
		gap: var(--space-3);
		padding: var(--space-4);
		border-top: var(--rule) solid var(--ink);
	}

	.label {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.field {
		display: grid;
		gap: var(--space-2);
	}

	.input-row {
		display: flex;
		gap: var(--space-2);
	}

	input {
		flex: 1;
		min-width: 0;
		padding: var(--space-2) var(--space-3);
		border: var(--rule) solid var(--ink);
		border-radius: 0;
		background: var(--paper);
		font-size: var(--text-lg);
		font-weight: 800;
	}

	input[aria-invalid='true'] {
		border-color: var(--red);
	}

	.square {
		display: grid;
		place-items: center;
		width: 44px;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
	}

	.square:hover,
	.action:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.actions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-2);
	}

	.action {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-1);
		padding: var(--space-2) 0;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
		font-weight: 700;
	}

	.action.insert {
		background: var(--ink);
		color: var(--paper);
	}

	.error {
		min-height: 1.2em;
		color: var(--red);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.error:empty {
		display: none;
	}

	.hint {
		color: var(--ink-soft);
		font-size: var(--text-sm);
	}

	.history {
		padding: var(--space-4);
		border-top: var(--rule) solid var(--ink);
	}

	.history header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-3);
	}

	.tools {
		display: flex;
		gap: var(--space-2);
	}

	.tools button {
		padding: 2px 8px;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	.tools button:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.history ol {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.history li button {
		min-width: 3.2em;
		padding: 2px 6px;
		border: 1px solid var(--ink);
		background: var(--paper);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	.history li button:hover {
		background: var(--tint);
	}

	.history li button.active {
		background: var(--ink);
		color: var(--paper);
	}

	.sign {
		display: inline-block;
		width: 1.2em;
		color: var(--ink-soft);
	}

	.active .sign {
		color: var(--yellow);
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
		border-radius: 50%;
	}

	.swatch.yellow {
		background: var(--yellow);
		outline: 2px solid var(--yellow-edge);
		outline-offset: -2px;
	}

	.swatch.blue {
		background: var(--blue);
	}

	.swatch.red {
		background: var(--red);
	}

	.mono {
		font-weight: 600;
	}

	.tree {
		flex: 1;
		min-height: 0;
	}
</style>
