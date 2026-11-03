<script lang="ts" module>
	export type Brush = 'wall' | 'weight' | 'erase';
</script>

<script lang="ts">
	import {
		OPEN,
		WALL,
		WEIGHT,
		cellAt,
		coords,
		moveEndpoint,
		paint,
		type CellKind,
		type Grid,
		type SearchFrame
	} from '../algorithms/pathfinding/index.ts';
	import { cellName } from '../render/captions.ts';
	import { gridScene } from '../render/grid.ts';

	let {
		grid,
		frame,
		brush,
		onedit
	}: {
		grid: Grid;
		frame: SearchFrame;
		brush: Brush;
		/** Called with the edited grid; the page decides what that does to playback. */
		onedit: (next: Grid) => void;
	} = $props();

	const BRUSH_KIND: Record<Brush, CellKind> = { wall: WALL, weight: WEIGHT, erase: OPEN };

	let width = $state(0);
	let height = $state(0);
	const size = $derived(Math.max(8, Math.floor(Math.min(width / grid.cols, height / grid.rows))));
	const scene = $derived(gridScene(frame, grid, size));

	let svg: SVGSVGElement | undefined = $state();
	let cursor = $state(0);
	let gesture:
		| { kind: 'paint'; paintWith: CellKind; last: number }
		| { kind: 'drag'; which: 'start' | 'goal' }
		| null = null;

	function cellFromPointer(event: PointerEvent): number | null {
		if (!svg) return null;
		const box = svg.getBoundingClientRect();
		const col = Math.floor(((event.clientX - box.left) / box.width) * grid.cols);
		const row = Math.floor(((event.clientY - box.top) / box.height) * grid.rows);
		if (col < 0 || row < 0 || col >= grid.cols || row >= grid.rows) return null;
		return cellAt(grid, col, row);
	}

	function apply(next: Grid) {
		if (next !== grid) onedit(next);
	}

	function onpointerdown(event: PointerEvent) {
		if (event.button !== 0) return;
		const cell = cellFromPointer(event);
		if (cell === null) return;
		svg?.setPointerCapture(event.pointerId);
		cursor = cell;
		if (cell === grid.start || cell === grid.goal) {
			gesture = { kind: 'drag', which: cell === grid.start ? 'start' : 'goal' };
			return;
		}
		// Pressing on a cell that already has the brush's kind erases along the drag instead.
		const target = BRUSH_KIND[brush];
		const paintWith = grid.cells[cell] === target && target !== OPEN ? OPEN : target;
		gesture = { kind: 'paint', paintWith, last: cell };
		apply(paint(grid, cell, paintWith));
	}

	function onpointermove(event: PointerEvent) {
		if (!gesture) return;
		const cell = cellFromPointer(event);
		if (cell === null) return;
		if (gesture.kind === 'drag') {
			apply(moveEndpoint(grid, gesture.which, cell));
		} else if (cell !== gesture.last) {
			gesture.last = cell;
			apply(paint(grid, cell, gesture.paintWith));
		}
	}

	function onpointerup() {
		gesture = null;
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.metaKey || event.ctrlKey || event.altKey) return;
		const { col, row } = coords(grid, cursor);
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-1, 0],
			ArrowRight: [1, 0],
			ArrowUp: [0, -1],
			ArrowDown: [0, 1]
		};
		const move = moves[event.key];
		if (move) {
			const c = Math.max(0, Math.min(grid.cols - 1, col + move[0]));
			const r = Math.max(0, Math.min(grid.rows - 1, row + move[1]));
			cursor = cellAt(grid, c, r);
		} else if (event.key === 'Enter') {
			const target = BRUSH_KIND[brush];
			apply(paint(grid, cursor, grid.cells[cursor] === target ? OPEN : target));
		} else if (event.key === 's' || event.key === 'S') {
			apply(moveEndpoint(grid, 'start', cursor));
		} else if (event.key === 'g' || event.key === 'G') {
			apply(moveEndpoint(grid, 'goal', cursor));
		} else {
			return;
		}
		// Claim the key so the global playback shortcuts leave it alone.
		event.preventDefault();
	}

	const cursorPoint = $derived(coords(grid, Math.min(cursor, grid.cells.length - 1)));
	const startTriangle = $derived.by(() => {
		const { x, y } = scene.start;
		const r = size * 0.32;
		return `${x - r * 0.8},${y - r} ${x + r},${y} ${x - r * 0.8},${y + r}`;
	});
</script>

<div class="stage" bind:clientWidth={width} bind:clientHeight={height}>
	{#if width > 0}
		<!-- An application-role editor owns its keys; Svelte's check does not treat that role as interactive. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
		<svg
			bind:this={svg}
			width={scene.width}
			height={scene.height}
			viewBox={`0 0 ${scene.width} ${scene.height}`}
			role="application"
			tabindex="0"
			aria-label={`Grid editor, ${grid.cols} by ${grid.rows}. Cursor at ${cellName(grid, cursor)}. Arrow keys move, Enter paints, S and G place start and goal.`}
			aria-roledescription="grid editor"
			{onpointerdown}
			{onpointermove}
			{onpointerup}
			onpointercancel={onpointerup}
			{onkeydown}
		>
			{#each scene.tiles as tone, cell (cell)}
				<rect
					class="tile {tone}"
					x={(cell % grid.cols) * size}
					y={Math.floor(cell / grid.cols) * size}
					width={size}
					height={size}
				/>
			{/each}
			{#each scene.weights as point (`${point.x},${point.y}`)}
				<circle class="weight" cx={point.x} cy={point.y} r={size * 0.2} />
			{/each}
			{#if scene.path.length > 1}
				<polyline
					class="path"
					points={scene.path.map((p) => `${p.x},${p.y}`).join(' ')}
					stroke-width={size * 0.3}
				/>
			{/if}
			<rect
				class="start"
				x={scene.start.x - size / 2}
				y={scene.start.y - size / 2}
				width={size}
				height={size}
			/>
			<polygon class="start-mark" points={startTriangle} />
			<circle class="goal" cx={scene.goal.x} cy={scene.goal.y} r={size * 0.42} />
			<circle class="goal-core" cx={scene.goal.x} cy={scene.goal.y} r={size * 0.16} />
			<rect
				class="cursor"
				x={cursorPoint.col * size + 1.5}
				y={cursorPoint.row * size + 1.5}
				width={size - 3}
				height={size - 3}
			/>
		</svg>
	{/if}
</div>

<style>
	.stage {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		min-height: 0;
		overflow: hidden;
	}

	svg {
		position: absolute;
		display: block;
		touch-action: none;
		cursor: crosshair;
		user-select: none;
	}

	svg:focus-visible {
		outline: 3px solid var(--blue);
		outline-offset: 3px;
	}

	.tile {
		fill: var(--paper);
		stroke: var(--hair);
		stroke-width: 1;
		transition: fill calc(var(--step-ms) * 0.6) linear;
	}

	.tile.wall {
		fill: var(--wall);
		stroke: var(--wall);
	}

	.tile.visited {
		fill: var(--visited);
	}

	.tile.frontier {
		fill: var(--blue);
	}

	.tile.current {
		fill: var(--yellow);
	}

	.weight {
		fill: var(--ink);
		pointer-events: none;
	}

	.path {
		fill: none;
		stroke: var(--red);
		stroke-linejoin: miter;
		stroke-linecap: square;
		pointer-events: none;
	}

	.start {
		fill: var(--ink);
	}

	.start-mark {
		fill: var(--yellow);
	}

	.goal {
		fill: var(--red);
		stroke: var(--ink);
		stroke-width: 2;
	}

	.goal-core {
		fill: var(--paper);
	}

	.start,
	.start-mark,
	.goal,
	.goal-core {
		cursor: grab;
	}

	.cursor {
		fill: none;
		stroke: none;
		pointer-events: none;
	}

	svg:focus-visible .cursor {
		stroke: var(--red);
		stroke-width: 3;
	}
</style>
