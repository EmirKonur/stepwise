import {
	GRID_SIZES,
	HEURISTICS,
	LAYOUTS,
	SEARCHES,
	WALL,
	decodeCells,
	encodeCells,
	generateGrid,
	type Grid,
	type GridSize,
	type Layout
} from '../algorithms/pathfinding/index.ts';
import { DEFAULT_SEED } from './input.ts';
import { MAX_STEP, query, type QueryParams, readChoice, readInt, readSeed } from './params.ts';

export interface PathParams {
	readonly algo: string;
	readonly heuristic: string;
	readonly size: GridSize;
	readonly layout: Layout;
	readonly seed: string;
	/** Set once the grid has been edited by hand. It overrides `layout` and `seed`. */
	readonly custom: Grid | null;
	readonly step: number;
}

const sizes = Object.keys(GRID_SIZES) as GridSize[];

export function parsePath(params: QueryParams): PathParams {
	const size = readChoice(params, 'size', sizes, 'm');
	return {
		algo: readChoice(
			params,
			'algo',
			SEARCHES.map((search) => search.id),
			'astar'
		),
		heuristic: readChoice(
			params,
			'h',
			HEURISTICS.map((heuristic) => heuristic.id),
			'manhattan'
		),
		size,
		layout: readChoice(params, 'layout', LAYOUTS, 'scatter'),
		seed: readSeed(params, 'seed', DEFAULT_SEED),
		custom: parseCustomGrid(params, size),
		step: readInt(params, 'step', 0, MAX_STEP, 0)
	};
}

function parseCustomGrid(params: QueryParams, size: GridSize): Grid | null {
	const { cols, rows } = GRID_SIZES[size];
	const count = cols * rows;
	const cells = decodeCells(params.get('cells') ?? '', count);
	const start = readInt(params, 's', 0, count - 1, -1);
	const goal = readInt(params, 'g', 0, count - 1, -1);
	if (!cells || start === -1 || goal === -1 || start === goal) return null;
	if (cells[start] === WALL || cells[goal] === WALL) return null;
	return { cols, rows, cells, start, goal };
}

export function pathGrid(params: PathParams): Grid {
	return params.custom ?? generateGrid(params.layout, params.size, params.seed);
}

export function formatPath(params: PathParams): string {
	const grid = params.custom;
	return query({
		algo: params.algo,
		h: params.algo === 'astar' ? params.heuristic : null,
		size: params.size,
		...(grid
			? { cells: encodeCells(grid.cells), s: grid.start, g: grid.goal }
			: { layout: params.layout, seed: params.seed }),
		step: params.step
	});
}
