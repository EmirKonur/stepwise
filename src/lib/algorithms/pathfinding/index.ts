import type { SearchAlgorithm } from './algorithm.ts';
import { astar } from './astar.ts';
import { bfs } from './bfs.ts';
import { dfs } from './dfs.ts';
import { dijkstra } from './dijkstra.ts';

export const SEARCHES: readonly SearchAlgorithm[] = [bfs, dfs, dijkstra, astar];

export function findSearch(id: string | null): SearchAlgorithm | undefined {
	return SEARCHES.find((algorithm) => algorithm.id === id);
}

export { recordSearch, type SearchAlgorithm, type SearchTimeline } from './algorithm.ts';
export * from './grid.ts';
export * from './heuristics.ts';
export * from './model.ts';
