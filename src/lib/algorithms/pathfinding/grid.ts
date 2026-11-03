import { seeded, shuffle } from '../../engine/index.ts';

export const OPEN = 0;
export const WALL = 1;
export const WEIGHT = 2;
export type CellKind = typeof OPEN | typeof WALL | typeof WEIGHT;

/** Entering a weighted cell costs this much; every other move costs 1. */
export const WEIGHT_COST = 5;

/** Odd dimensions so the maze generator's rooms and walls tile exactly. */
export const GRID_SIZES = {
	s: { cols: 21, rows: 13 },
	m: { cols: 33, rows: 19 },
	l: { cols: 45, rows: 27 }
} as const;
export type GridSize = keyof typeof GRID_SIZES;

export const LAYOUTS = ['scatter', 'maze', 'open'] as const;
export type Layout = (typeof LAYOUTS)[number];

export interface Grid {
	readonly cols: number;
	readonly rows: number;
	/** Row-major cell kinds. */
	readonly cells: Uint8Array;
	readonly start: number;
	readonly goal: number;
}

export function cellAt(grid: Pick<Grid, 'cols'>, col: number, row: number): number {
	return row * grid.cols + col;
}

export function coords(grid: Pick<Grid, 'cols'>, cell: number): { col: number; row: number } {
	return { col: cell % grid.cols, row: Math.floor(cell / grid.cols) };
}

export function stepCost(grid: Grid, cell: number): number {
	return grid.cells[cell] === WEIGHT ? WEIGHT_COST : 1;
}

/** Non-wall neighbours in a fixed north, east, south, west order, so traces are reproducible. */
export function neighbours(grid: Grid, cell: number): number[] {
	const { col, row } = coords(grid, cell);
	const candidates: [number, number][] = [
		[col, row - 1],
		[col + 1, row],
		[col, row + 1],
		[col - 1, row]
	];
	const result: number[] = [];
	for (const [c, r] of candidates) {
		if (c < 0 || r < 0 || c >= grid.cols || r >= grid.rows) continue;
		const next = cellAt(grid, c, r);
		if (grid.cells[next] !== WALL) result.push(next);
	}
	return result;
}

/** Returns a copy of `grid` with one cell changed. Start and goal can never become walls. */
export function paint(grid: Grid, cell: number, kind: CellKind): Grid {
	if (cell === grid.start || cell === grid.goal || grid.cells[cell] === kind) return grid;
	const cells = grid.cells.slice();
	cells[cell] = kind;
	return { ...grid, cells };
}

/** Moves the start or goal marker, clearing whatever was under it. */
export function moveEndpoint(grid: Grid, which: 'start' | 'goal', cell: number): Grid {
	const other = which === 'start' ? grid.goal : grid.start;
	if (cell === other || cell < 0 || cell >= grid.cells.length || grid[which] === cell) return grid;
	const cells = grid.cells.slice();
	cells[cell] = OPEN;
	return { ...grid, cells, [which]: cell };
}

/** Builds one of the seeded starter layouts. */
export function generateGrid(layout: Layout, size: GridSize, seed: string): Grid {
	const { cols, rows } = GRID_SIZES[size];
	const random = seeded(`${layout}:${size}:${seed}`);
	const cells = new Uint8Array(cols * rows);
	const mid = Math.floor(rows / 2);

	if (layout === 'maze') {
		carveMaze(cells, cols, rows, random);
		return {
			cols,
			rows,
			cells,
			start: cellAt({ cols }, 1, 1),
			goal: cellAt({ cols }, cols - 2, rows - 2)
		};
	}

	const start = cellAt({ cols }, 3, mid);
	const goal = cellAt({ cols }, cols - 4, mid);
	if (layout === 'scatter') {
		for (let cell = 0; cell < cells.length; cell++) {
			const roll = random();
			cells[cell] = roll < 0.26 ? WALL : roll < 0.38 ? WEIGHT : OPEN;
		}
		cells[start] = OPEN;
		cells[goal] = OPEN;
	}
	return { cols, rows, cells, start, goal };
}

/**
 * Recursive backtracker on the odd lattice, then a few walls knocked out so
 * there are loops. A perfect maze has exactly one route, which would make
 * every algorithm return the same path.
 */
function carveMaze(cells: Uint8Array, cols: number, rows: number, random: () => number): void {
	cells.fill(WALL);
	const at = (c: number, r: number) => r * cols + c;
	const stack: [number, number][] = [[1, 1]];
	cells[at(1, 1)] = OPEN;
	while (stack.length > 0) {
		const [c, r] = stack[stack.length - 1] as [number, number];
		const options = shuffle(
			[
				[0, -2],
				[2, 0],
				[0, 2],
				[-2, 0]
			].filter(([dc = 0, dr = 0]) => {
				const nc = c + dc;
				const nr = r + dr;
				return nc > 0 && nr > 0 && nc < cols - 1 && nr < rows - 1 && cells[at(nc, nr)] === WALL;
			}),
			random
		);
		const choice = options[0];
		if (!choice) {
			stack.pop();
			continue;
		}
		const [dc = 0, dr = 0] = choice;
		cells[at(c + dc / 2, r + dr / 2)] = OPEN;
		cells[at(c + dc, r + dr)] = OPEN;
		stack.push([c + dc, r + dr]);
	}
	for (let r = 1; r < rows - 1; r++) {
		for (let c = 1; c < cols - 1; c++) {
			const cell = at(c, r);
			if (cells[cell] === WALL && (r + c) % 2 === 1 && random() < 0.1) cells[cell] = OPEN;
			else if (cells[cell] === OPEN && random() < 0.08) cells[cell] = WEIGHT;
		}
	}
	cells[at(1, 1)] = OPEN;
	cells[at(cols - 2, rows - 2)] = OPEN;
}

/** Two bits per cell, base64url. A 45 x 27 grid packs into 408 characters. */
export function encodeCells(cells: Uint8Array): string {
	const bytes = new Uint8Array(Math.ceil(cells.length / 4));
	cells.forEach((kind, index) => {
		bytes[index >> 2] = (bytes[index >> 2] as number) | ((kind & 3) << ((index & 3) * 2));
	});
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

/** Inverse of {@link encodeCells}; `null` for anything malformed. */
export function decodeCells(text: string, count: number): Uint8Array | null {
	if (!/^[\w-]*$/.test(text)) return null;
	let binary: string;
	try {
		binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
	} catch {
		return null;
	}
	if (binary.length !== Math.ceil(count / 4)) return null;
	const cells = new Uint8Array(count);
	for (let index = 0; index < count; index++) {
		const kind = (binary.charCodeAt(index >> 2) >> ((index & 3) * 2)) & 3;
		if (kind > WEIGHT) return null;
		cells[index] = kind;
	}
	return cells;
}
