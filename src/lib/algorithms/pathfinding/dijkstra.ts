import type { SearchAlgorithm } from './algorithm.ts';
import { bestFirst } from './best-first.ts';

export const dijkstra: SearchAlgorithm = {
	id: 'dijkstra',
	name: "Dijkstra's algorithm",
	summary:
		'Always expands the cheapest unsettled cell, so it spreads evenly by cost and slows down through weighted cells. Returns the cheapest path.',
	guarantee: 'Cheapest path',
	usesHeuristic: false,
	code: [
		'dist[start] = 0; queue.push(start, 0)',
		'while queue is not empty',
		'  u = queue.popMin()',
		'  if u is settled: continue',
		'  settle(u)',
		'  if u == goal: return path to u',
		'  for each non-wall neighbour v of u',
		'    d = dist[u] + cost(v)',
		'    if d < dist[v]',
		'      dist[v] = d; parent[v] = u',
		'      queue.push(v, d)',
		'return "no path"'
	],
	run(grid) {
		return bestFirst(grid, () => 0);
	}
};
