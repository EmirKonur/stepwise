import { walkBack, type SearchAlgorithm } from './algorithm.ts';
import { neighbours } from './grid.ts';

export const dfs: SearchAlgorithm = {
	id: 'dfs',
	name: 'Depth-first search',
	summary:
		'Follows one corridor as far as it goes before backtracking, using a stack. Finds a path if one exists, with no promise about its length or cost.',
	guarantee: 'Any path',
	usesHeuristic: false,
	code: [
		'stack = [start]',
		'while stack is not empty',
		'  u = stack.pop()',
		'  if u is visited: continue',
		'  visited.add(u)',
		'  if u == goal: return path to u',
		'  for each non-wall neighbour v of u, last first',
		'    if v not in visited',
		'      parent[v] = u; stack.push(v)',
		'return "no path"'
	],
	*run(grid) {
		const parent = new Int32Array(grid.cells.length).fill(-1);
		const depth = new Int32Array(grid.cells.length).fill(0);
		const visited = new Uint8Array(grid.cells.length);
		const stack = [grid.start];
		yield { type: 'enqueue', cell: grid.start, from: -1, cost: 0, line: 1 };
		while (stack.length > 0) {
			const u = stack.pop() as number;
			yield { type: 'line', line: 3 };
			if (visited[u]) {
				yield { type: 'line', line: 4 };
				continue;
			}
			visited[u] = 1;
			yield { type: 'visit', cell: u, line: 5 };
			if (u === grid.goal) return yield* walkBack(grid, parent, 6);
			yield { type: 'line', line: 7 };
			// Pushing in reverse means the first neighbour (north) is popped first.
			for (const v of neighbours(grid, u).reverse()) {
				if (visited[v]) continue;
				parent[v] = u;
				depth[v] = (depth[u] as number) + 1;
				stack.push(v);
				yield { type: 'enqueue', cell: v, from: u, cost: depth[v] as number, line: 9 };
			}
		}
		yield { type: 'done', found: false, cost: 0, line: 10 };
	}
};
