import { walkBack, type SearchAlgorithm } from './algorithm.ts';
import { neighbours } from './grid.ts';

export const bfs: SearchAlgorithm = {
	id: 'bfs',
	name: 'Breadth-first search',
	summary:
		'Explores in rings of equal move count using a FIFO queue. Ignores weights, so it finds the route with the fewest moves, not the cheapest one.',
	guarantee: 'Fewest moves',
	usesHeuristic: false,
	code: [
		'queue = [start]; seen = {start}',
		'while queue is not empty',
		'  u = queue.dequeue()',
		'  if u == goal: return path to u',
		'  for each non-wall neighbour v of u',
		'    if v not in seen',
		'      seen.add(v); parent[v] = u',
		'      queue.enqueue(v)',
		'return "no path"'
	],
	*run(grid) {
		const parent = new Int32Array(grid.cells.length).fill(-1);
		const depth = new Int32Array(grid.cells.length).fill(-1);
		const queue = [grid.start];
		depth[grid.start] = 0;
		yield { type: 'enqueue', cell: grid.start, from: -1, cost: 0, line: 1 };
		for (let head = 0; head < queue.length; head++) {
			const u = queue[head] as number;
			yield { type: 'visit', cell: u, line: 3 };
			if (u === grid.goal) return yield* walkBack(grid, parent, 4);
			yield { type: 'line', line: 5 };
			for (const v of neighbours(grid, u)) {
				if (depth[v] !== -1) continue;
				depth[v] = (depth[u] as number) + 1;
				parent[v] = u;
				queue.push(v);
				yield { type: 'enqueue', cell: v, from: u, cost: depth[v] as number, line: 8 };
			}
		}
		yield { type: 'done', found: false, cost: 0, line: 9 };
	}
};
