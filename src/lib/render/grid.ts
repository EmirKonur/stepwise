import {
	WALL,
	WEIGHT,
	coords,
	type Grid,
	type SearchFrame
} from '../algorithms/pathfinding/index.ts';
import { FRONTIER, VISITED } from '../algorithms/pathfinding/index.ts';

export type TileTone = 'open' | 'wall' | 'frontier' | 'visited' | 'current';

export interface Point {
	readonly x: number;
	readonly y: number;
}

export interface GridScene {
	readonly width: number;
	readonly height: number;
	readonly cell: number;
	/** One tone per cell, row-major. Weights are drawn separately on top. */
	readonly tiles: readonly TileTone[];
	/** Centres of weighted cells. */
	readonly weights: readonly Point[];
	/** Centres along the path revealed so far, goal first. */
	readonly path: readonly Point[];
	readonly start: Point;
	readonly goal: Point;
}

function centre(grid: Grid, cell: number, size: number): Point {
	const { col, row } = coords(grid, cell);
	return { x: (col + 0.5) * size, y: (row + 0.5) * size };
}

/** Pure: grid terrain plus search progress in, drawable shapes out. */
export function gridScene(frame: SearchFrame | null, grid: Grid, size: number): GridScene {
	const tiles: TileTone[] = new Array<TileTone>(grid.cells.length);
	const weights: Point[] = [];
	const state = frame?.state;
	for (let cell = 0; cell < grid.cells.length; cell++) {
		const kind = grid.cells[cell];
		if (kind === WEIGHT) weights.push(centre(grid, cell, size));
		if (kind === WALL) tiles[cell] = 'wall';
		else if (state?.current === cell) tiles[cell] = 'current';
		else if (state?.status[cell] === VISITED) tiles[cell] = 'visited';
		else if (state?.status[cell] === FRONTIER) tiles[cell] = 'frontier';
		else tiles[cell] = 'open';
	}
	return {
		width: grid.cols * size,
		height: grid.rows * size,
		cell: size,
		tiles,
		weights,
		path: (state?.path ?? []).map((cell) => centre(grid, cell, size)),
		start: centre(grid, grid.start, size),
		goal: centre(grid, grid.goal, size)
	};
}
