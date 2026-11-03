<script lang="ts">
	import { untrack } from 'svelte';
	import type { TreeFrame } from '../algorithms/trees/index.ts';
	import { treeScene } from '../render/tree.ts';
	import { between, positions, type Point } from '../render/tween.ts';

	let {
		frame,
		showBalance,
		duration,
		onpick
	}: {
		frame: TreeFrame;
		/** AVL shows each node's balance factor. */
		showBalance: boolean;
		/** Move animation length in ms; 0 snaps. */
		duration: number;
		/** Clicking a node offers its key to the operation form. */
		onpick: (key: number) => void;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	const scene = $derived(width > 0 && height > 0 ? treeScene(frame, { width, height }) : null);

	/*
	 * Positions are tweened here rather than with CSS so edges can follow their
	 * nodes: an edge is drawn between two interpolated points, which a CSS
	 * transition on each node could not provide.
	 */
	let shown = $state.raw<ReadonlyMap<number, Point>>(positions([]));
	let raf = 0;

	$effect(() => {
		if (!scene) return;
		const target = positions(scene.nodes);
		const from = untrack(() => shown);
		if (duration === 0 || from.size === 0) {
			shown = target;
			return;
		}
		const started = performance.now();
		const tick = (now: number) => {
			const t = (now - started) / duration;
			shown = between(from, target, t);
			if (t < 1) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});

	const at = (id: number): Point => {
		const node = scene?.nodes.find((candidate) => candidate.id === id);
		return shown.get(id) ?? (node ? { x: node.x, y: node.y } : { x: 0, y: 0 });
	};

	const balanceLabel = (value: number) => (value > 0 ? `+${value}` : String(value));
</script>

<div class="stage" bind:clientWidth={width} bind:clientHeight={height}>
	{#if scene}
		<svg
			{width}
			{height}
			viewBox={`0 0 ${width} ${height}`}
			role="img"
			aria-label={`Tree with ${scene.nodes.length} nodes`}
		>
			<defs>
				<marker
					id="arrow"
					viewBox="0 0 10 10"
					refX="9"
					refY="5"
					markerWidth="7"
					markerHeight="7"
					orient="auto-start-reverse"
				>
					<path d="M0 0 10 5 0 10z" class="arrowhead" />
				</marker>
			</defs>
			{#each scene.edges as edge (`${edge.parent}-${edge.child}`)}
				{@const a = at(edge.parent)}
				{@const b = at(edge.child)}
				<line class="edge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
			{/each}
			{#if scene.copy}
				{@const a = at(scene.copy.from)}
				{@const b = at(scene.copy.to)}
				<line class="copy" x1={a.x} y1={a.y} x2={b.x} y2={b.y} marker-end="url(#arrow)" />
			{/if}
			{#each scene.nodes as node (node.id)}
				{@const p = at(node.id)}
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<g
					class="node {node.tone}"
					transform={`translate(${p.x} ${p.y})`}
					onclick={() => onpick(node.key)}
				>
					<circle r={scene.radius} />
					<text class="key" dy="0.36em" font-size={Math.max(11, scene.radius * 0.78)}
						>{node.key}</text
					>
					{#if showBalance && scene.radius >= 14}
						<!-- Straight below the node is the one spot no edge ever crosses. -->
						<text class="balance" class:off={Math.abs(node.balance) > 1} y={scene.radius + 13}>
							{balanceLabel(node.balance)}
						</text>
					{/if}
				</g>
			{/each}
			{#if scene.probe}
				{@const p = at(scene.probe.node)}
				<g
					class="probe"
					transform={`translate(${p.x - scene.radius - 30} ${p.y - scene.radius - 14})`}
				>
					<rect width="30" height="22" />
					<text x="15" y="15.5">{scene.probe.key}</text>
				</g>
			{/if}
		</svg>
		{#if scene.nodes.length === 0}
			<p class="empty">Empty tree. Insert a key to plant the root.</p>
		{/if}
	{/if}
</div>

<style>
	.stage {
		position: relative;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	svg {
		position: absolute;
		inset: 0;
		display: block;
	}

	.edge {
		stroke: var(--ink);
		stroke-width: 3;
	}

	.copy {
		stroke: var(--red);
		stroke-width: 3;
		stroke-dasharray: 6 5;
	}

	.arrowhead {
		fill: var(--red);
	}

	.node {
		cursor: pointer;
	}

	.node circle {
		fill: var(--paper);
		stroke: var(--ink);
		stroke-width: 3;
	}

	.node .key {
		fill: var(--ink);
		font-weight: 800;
		text-anchor: middle;
		pointer-events: none;
	}

	.node.cursor circle {
		fill: var(--yellow);
	}

	.node.compare circle {
		fill: var(--blue);
		stroke: var(--blue);
	}

	.node.compare .key {
		fill: var(--on-blue);
	}

	.node.result circle,
	.node.rotate circle,
	.node.copy circle {
		fill: var(--red);
		stroke: var(--red);
	}

	.node.result .key,
	.node.rotate .key,
	.node.copy .key {
		fill: var(--on-red);
	}

	.balance {
		text-anchor: middle;
		fill: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
	}

	.balance.off {
		fill: var(--red);
	}

	.probe rect {
		fill: var(--yellow);
		stroke: var(--yellow-edge);
		stroke-width: 2;
	}

	.probe text {
		fill: var(--on-yellow);
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
		text-anchor: middle;
	}

	.empty {
		position: absolute;
		inset: 40% 0 auto;
		text-align: center;
		font-weight: 700;
		color: var(--ink-soft);
	}
</style>
