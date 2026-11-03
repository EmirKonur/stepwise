<script lang="ts">
	import type { SortFrame } from '../algorithms/sorting/index.ts';
	import { barScene } from '../render/bars.ts';

	let {
		frame,
		buffer,
		label,
		compact = false
	}: {
		frame: SortFrame;
		/** Draw the merge buffer row. */
		buffer: boolean;
		label: string;
		/** Race lanes are short; drop the value labels there. */
		compact?: boolean;
	} = $props();

	let width = $state(0);
	let height = $state(0);
	const scene = $derived(
		width > 0 && height > 0 ? barScene(frame, { width, height, buffer }) : null
	);
</script>

<div class="stage" bind:clientWidth={width} bind:clientHeight={height}>
	{#if scene}
		<svg {width} {height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
			{#if scene.focus}
				<rect
					class="focus"
					x={scene.focus.x}
					y={scene.focus.y}
					width={scene.focus.width}
					height={scene.focus.height}
				/>
				<rect
					class="focus-rule"
					x={scene.focus.x}
					y={scene.baseline}
					width={scene.focus.width}
					height="4"
				/>
			{/if}
			{#if scene.bufferBaseline !== null}
				<line class="rule" x1="0" x2={width} y1={scene.bufferBaseline} y2={scene.bufferBaseline} />
				<text class="tag" x="4" y={scene.baseline + 30}>buffer b</text>
			{/if}
			<line class="rule" x1="0" x2={width} y1={scene.baseline} y2={scene.baseline} />
			{#each scene.holes as hole (hole.x)}
				<rect class="hole" x={hole.x} y={hole.y} width={hole.width} height={hole.height} />
			{/each}
			{#each scene.settled as square (square.x)}
				<rect
					class="settled"
					x={square.x}
					y={square.y}
					width={square.width}
					height={square.height}
				/>
			{/each}
			{#each scene.bars as bar (bar.id)}
				<g class="bar {bar.tone}" style:transform={`translate(${bar.x}px, ${bar.y}px)`}>
					<rect y={-bar.height} width={bar.width} height={bar.height} />
					{#if scene.labels && !compact && !bar.inBuffer}
						<text x={bar.width / 2} y={-bar.height - 5}>{bar.value}</text>
					{/if}
				</g>
			{/each}
		</svg>
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

	.focus {
		fill: var(--tint);
	}

	.focus-rule {
		fill: var(--ink);
	}

	.rule {
		stroke: var(--ink);
		stroke-width: 2;
	}

	.tag {
		fill: var(--ink-soft);
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.hole {
		fill: var(--ink-soft);
	}

	.settled {
		fill: var(--ink);
	}

	.bar {
		transition: transform var(--step-ms) var(--ease);
	}

	.bar rect {
		fill: var(--ink);
		transition:
			height var(--step-ms) var(--ease),
			y var(--step-ms) var(--ease);
	}

	.bar.compare rect {
		fill: var(--blue);
	}

	.bar.move rect {
		fill: var(--red);
	}

	.bar.mark rect {
		fill: var(--yellow);
		stroke: var(--yellow-edge);
		stroke-width: 2;
	}

	.bar text {
		fill: var(--ink);
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		text-anchor: middle;
	}
</style>
