import { walkBack } from './algorithm.ts';
import { neighbours, stepCost, type Grid } from './grid.ts';
import type { SearchProgram } from './model.ts';
import { MinQueue } from './queue.ts';

/**
 * Dijkstra and A* are the same loop; A* just adds an estimate of the remaining
 * cost to the priority. Both listings share this line numbering.
 *
 * Ties on priority go to the cell with the smaller estimate (closer to the
 * goal), then to insertion order. Closed cells are never reopened, which is
 * correct for consistent heuristics and is what makes an inadmissible one
 * visibly return worse paths.
 */
export function* bestFirst(grid: Grid, estimate: (cell: number) => number): SearchProgram {
	const size = grid.cells.length;
	const g = new Int32Array(size).fill(-1);
	const parent = new Int32Array(size).fill(-1);
	const closed = new Uint8Array(size);
	const open = new MinQueue();

	g[grid.start] = 0;
	const h0 = estimate(grid.start);
	open.push(grid.start, h0, h0);
	yield { type: 'relax', cell: grid.start, from: -1, cost: 0, line: 1 };

	while (open.size > 0) {
		const u = open.pop();
		if (closed[u]) {
			yield { type: 'line', line: 4 };
			continue;
		}
		closed[u] = 1;
		yield { type: 'visit', cell: u, line: 5 };
		if (u === grid.goal) return yield* walkBack(grid, parent, 6);
		yield { type: 'line', line: 7 };
		for (const v of neighbours(grid, u)) {
			if (closed[v]) continue;
			const tentative = (g[u] as number) + stepCost(grid, v);
			const known = g[v] as number;
			if (known !== -1 && tentative >= known) continue;
			g[v] = tentative;
			parent[v] = u;
			const h = estimate(v);
			open.push(v, tentative + h, h);
			yield { type: 'relax', cell: v, from: u, cost: tentative, line: 11 };
		}
	}
	yield { type: 'done', found: false, cost: 0, line: 12 };
}
