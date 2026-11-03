import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	GRID_SIZES,
	LAYOUTS,
	OPEN,
	WALL,
	WEIGHT,
	decodeCells,
	encodeCells,
	generateGrid,
	moveEndpoint,
	neighbours,
	paint,
	type Grid,
	type GridSize
} from './grid.ts';

const sizes = Object.keys(GRID_SIZES) as GridSize[];

function reachable(grid: Grid): boolean {
	const seen = new Set([grid.start]);
	const queue = [grid.start];
	while (queue.length > 0) {
		const cell = queue.shift() as number;
		if (cell === grid.goal) return true;
		for (const next of neighbours(grid, cell)) {
			if (!seen.has(next)) {
				seen.add(next);
				queue.push(next);
			}
		}
	}
	return false;
}

describe('cell codec', () => {
	it('round-trips any grid', () => {
		fc.assert(
			fc.property(
				fc.array(fc.constantFrom(OPEN, WALL, WEIGHT), { minLength: 1, maxLength: 1300 }),
				(kinds) => {
					const cells = Uint8Array.from(kinds);
					expect(decodeCells(encodeCells(cells), cells.length)).toEqual(cells);
				}
			)
		);
	});

	it('stays URL safe', () => {
		const { cols, rows } = GRID_SIZES.l;
		const cells = generateGrid('scatter', 'l', 'url').cells;
		const encoded = encodeCells(cells);
		expect(encoded).toMatch(/^[\w-]+$/);
		expect(encoded.length).toBe(Math.ceil(Math.ceil((cols * rows) / 4) / 3) * 4 - 2);
	});

	it.each([
		['wrong length', encodeCells(new Uint8Array(12)), 40],
		['bad characters', 'abc$', 16],
		['an unknown cell kind', encodeCells(Uint8Array.from([3, 0, 0, 0])), 4]
	])('rejects %s', (_, text, count) => {
		expect(decodeCells(text, count)).toBeNull();
	});
});

describe('generateGrid', () => {
	it.each(LAYOUTS)('%s is deterministic per seed and keeps the endpoints open', (layout) => {
		fc.assert(
			fc.property(fc.constantFrom(...sizes), fc.stringMatching(/^[a-z0-9]{1,6}$/), (size, seed) => {
				const grid = generateGrid(layout, size, seed);
				expect(generateGrid(layout, size, seed)).toEqual(grid);
				expect(grid.cells.length).toBe(GRID_SIZES[size].cols * GRID_SIZES[size].rows);
				expect(grid.cells[grid.start]).toBe(OPEN);
				expect(grid.cells[grid.goal]).toBe(OPEN);
				expect(grid.start).not.toBe(grid.goal);
			}),
			{ numRuns: 30 }
		);
	});

	it('always carves a maze with a route from start to goal', () => {
		fc.assert(
			fc.property(fc.constantFrom(...sizes), fc.stringMatching(/^[a-z0-9]{1,6}$/), (size, seed) => {
				expect(reachable(generateGrid('maze', size, seed))).toBe(true);
			}),
			{ numRuns: 50 }
		);
	});
});

describe('editing', () => {
	const grid = generateGrid('open', 's', 'edit');

	it('never paints over the start or goal', () => {
		expect(paint(grid, grid.start, WALL)).toBe(grid);
		expect(paint(grid, grid.goal, WEIGHT)).toBe(grid);
	});

	it('returns a new grid and leaves the old one untouched', () => {
		const painted = paint(grid, 0, WALL);
		expect(painted.cells[0]).toBe(WALL);
		expect(grid.cells[0]).toBe(OPEN);
	});

	it('clears a wall when an endpoint is dropped on it, but not onto the other endpoint', () => {
		const walled = paint(grid, 5, WALL);
		const moved = moveEndpoint(walled, 'start', 5);
		expect(moved.start).toBe(5);
		expect(moved.cells[5]).toBe(OPEN);
		expect(moveEndpoint(grid, 'start', grid.goal)).toBe(grid);
	});
});
