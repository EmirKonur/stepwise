import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { replay } from '../../../test/replay.ts';
import {
	HEURISTICS,
	OPEN,
	SEARCHES,
	WALL,
	WEIGHT,
	coords,
	findHeuristic,
	findSearch,
	neighbours,
	recordSearch,
	searchModel,
	searchState,
	stepCost,
	type Grid,
	type SearchAlgorithm
} from './index.ts';

const manhattan = HEURISTICS[0]!;

function algorithm(id: string): SearchAlgorithm {
	const found = findSearch(id);
	if (!found) throw new Error(`no algorithm ${id}`);
	return found;
}

/** Random grids up to 9 x 9, roughly a fifth walls and a fifth weights. */
const gridArb: fc.Arbitrary<Grid> = fc
	.record({ cols: fc.integer({ min: 2, max: 9 }), rows: fc.integer({ min: 2, max: 9 }) })
	.chain(({ cols, rows }) => {
		const count = cols * rows;
		return fc
			.record({
				cells: fc.array(fc.constantFrom(OPEN, OPEN, OPEN, WALL, WEIGHT), {
					minLength: count,
					maxLength: count
				}),
				start: fc.nat(count - 1),
				goal: fc.nat(count - 1)
			})
			.filter(({ start, goal }) => start !== goal)
			.map(({ cells, start, goal }) => {
				const packed = Uint8Array.from(cells);
				packed[start] = OPEN;
				packed[goal] = OPEN;
				return { cols, rows, cells: packed, start, goal };
			});
	});

/**
 * Reference shortest paths by brute-force relaxation until nothing changes
 * (Bellman-Ford without the edge ordering). Slow, but too simple to be wrong.
 */
function referenceCost(grid: Grid, weighted: boolean): number {
	const dist = new Array<number>(grid.cells.length).fill(Number.POSITIVE_INFINITY);
	dist[grid.start] = 0;
	for (let changed = true; changed;) {
		changed = false;
		for (let u = 0; u < grid.cells.length; u++) {
			const du = dist[u] as number;
			if (!Number.isFinite(du) || grid.cells[u] === WALL) continue;
			for (const v of neighbours(grid, u)) {
				const candidate = du + (weighted ? stepCost(grid, v) : 1);
				if (candidate < (dist[v] as number)) {
					dist[v] = candidate;
					changed = true;
				}
			}
		}
	}
	return dist[grid.goal] as number;
}

function finalState(search: SearchAlgorithm, grid: Grid, heuristic = manhattan) {
	const timeline = recordSearch(search, grid, heuristic);
	return timeline.seek(timeline.last).state;
}

/** Path runs start to goal through adjacent non-wall cells and its reported cost adds up. */
function expectValidPath(grid: Grid, path: readonly number[], reportedCost: number): void {
	const forward = path.toReversed();
	expect(forward[0]).toBe(grid.start);
	expect(forward.at(-1)).toBe(grid.goal);
	let cost = 0;
	for (let i = 1; i < forward.length; i++) {
		const a = coords(grid, forward[i - 1] as number);
		const b = coords(grid, forward[i] as number);
		expect(Math.abs(a.col - b.col) + Math.abs(a.row - b.row)).toBe(1);
		expect(grid.cells[forward[i] as number]).not.toBe(WALL);
		cost += stepCost(grid, forward[i] as number);
	}
	expect(cost).toBe(reportedCost);
}

describe('shortest paths on random grids', () => {
	it("Dijkstra's path cost matches the reference", () => {
		fc.assert(
			fc.property(gridArb, (grid) => {
				const expected = referenceCost(grid, true);
				const state = finalState(algorithm('dijkstra'), grid);
				if (!Number.isFinite(expected)) {
					expect(state.outcome).toBe('unreachable');
					return;
				}
				expect(state.outcome).toBe('found');
				expect(state.pathCost).toBe(expected);
				expectValidPath(grid, state.path, state.pathCost);
			}),
			{ numRuns: 300 }
		);
	});

	it('A* with every admissible heuristic matches the reference and never beats Dijkstra on cost', () => {
		const admissible = HEURISTICS.filter((heuristic) => heuristic.admissible);
		fc.assert(
			fc.property(gridArb, fc.constantFrom(...admissible), (grid, heuristic) => {
				const expected = referenceCost(grid, true);
				const dijkstra = finalState(algorithm('dijkstra'), grid);
				const state = finalState(algorithm('astar'), grid, heuristic);
				if (!Number.isFinite(expected)) {
					expect(state.outcome).toBe('unreachable');
					return;
				}
				expect(state.pathCost).toBe(expected);
				expect(state.pathCost).toBe(dijkstra.pathCost);
				expectValidPath(grid, state.path, state.pathCost);
			}),
			{ numRuns: 300 }
		);
	});

	it('BFS finds the fewest moves, whatever the weights cost', () => {
		fc.assert(
			fc.property(gridArb, (grid) => {
				const expected = referenceCost(grid, false);
				const state = finalState(algorithm('bfs'), grid);
				if (!Number.isFinite(expected)) {
					expect(state.outcome).toBe('unreachable');
					return;
				}
				expect(state.path.length - 1).toBe(expected);
				expectValidPath(grid, state.path, state.pathCost);
			}),
			{ numRuns: 300 }
		);
	});

	it('DFS finds a valid path exactly when one exists', () => {
		fc.assert(
			fc.property(gridArb, (grid) => {
				const reachable = Number.isFinite(referenceCost(grid, false));
				const state = finalState(algorithm('dfs'), grid);
				expect(state.outcome).toBe(reachable ? 'found' : 'unreachable');
				if (reachable) expectValidPath(grid, state.path, state.pathCost);
			}),
			{ numRuns: 300 }
		);
	});

	it('an inadmissible heuristic can return a costlier path', () => {
		// S w G
		// . . .    the weight costs 5, so the detour (cost 4) beats going straight (cost 6).
		const grid: Grid = {
			cols: 3,
			rows: 2,
			cells: Uint8Array.from([OPEN, WEIGHT, OPEN, OPEN, OPEN, OPEN]),
			start: 0,
			goal: 2
		};
		expect(finalState(algorithm('astar'), grid, manhattan).pathCost).toBe(4);
		expect(finalState(algorithm('astar'), grid, findHeuristic('greedy')).pathCost).toBe(6);
	});
});

describe.each(SEARCHES.map((search) => [search.name, search] as const))('%s', (_, search) => {
	it('records the same events every run, and replay reproduces any frame', () => {
		fc.assert(
			fc.property(gridArb, fc.double({ min: 0, max: 1, noNaN: true }), (grid, at) => {
				const timeline = recordSearch(search, grid, manhattan, { checkpointEvery: 8 });
				expect(recordSearch(search, grid, manhattan).events).toEqual(timeline.events);
				const step = Math.round(at * timeline.last);
				const expected = replay(searchModel, searchState(grid.cells.length), timeline.events, step);
				expect(timeline.seek(step).state).toEqual(expected.state);
			}),
			{ numRuns: 100 }
		);
	});

	it('keeps the frontier counter equal to the number of frontier cells', () => {
		fc.assert(
			fc.property(gridArb, (grid) => {
				const timeline = recordSearch(search, grid, manhattan);
				for (let step = 0; step <= timeline.last; step += 3) {
					const { state } = timeline.seek(step);
					expect(state.frontier).toBe(state.status.filter((status) => status === 1).length);
				}
			}),
			{ numRuns: 60 }
		);
	});

	it('only references lines in its listing', () => {
		const grid: Grid = {
			cols: 4,
			rows: 3,
			cells: Uint8Array.from([
				OPEN,
				WALL,
				OPEN,
				OPEN,
				OPEN,
				WEIGHT,
				OPEN,
				WALL,
				OPEN,
				OPEN,
				OPEN,
				OPEN
			]),
			start: 0,
			goal: 3
		};
		for (const event of recordSearch(search, grid, manhattan).events) {
			expect(event.line).toBeGreaterThan(0);
			expect(event.line).toBeLessThanOrEqual(search.code.length);
		}
	});
});
