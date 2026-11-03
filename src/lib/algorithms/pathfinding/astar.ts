import type { SearchAlgorithm } from './algorithm.ts';
import { bestFirst } from './best-first.ts';

export const astar: SearchAlgorithm = {
	id: 'astar',
	name: 'A* search',
	summary:
		'Dijkstra with a sense of direction: the priority is cost so far plus an estimate of the cost remaining. With an admissible estimate the path is still the cheapest.',
	guarantee: 'Cheapest path if h is admissible',
	usesHeuristic: true,
	code: [
		'g[start] = 0; open.push(start, h(start))',
		'while open is not empty',
		'  u = open.popMin()  // lowest g + h',
		'  if u is closed: continue',
		'  close(u)',
		'  if u == goal: return path to u',
		'  for each non-wall neighbour v of u',
		'    t = g[u] + cost(v)',
		'    if t < g[v]',
		'      g[v] = t; parent[v] = u',
		'      open.push(v, t + h(v))',
		'return "no path"'
	],
	run(grid, heuristic) {
		return bestFirst(grid, (cell) => heuristic.estimate(grid, cell));
	}
};
