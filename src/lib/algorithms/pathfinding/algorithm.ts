import { record, type RecordOptions, type Timeline } from '../../engine/index.ts';
import { stepCost, type Grid } from './grid.ts';
import type { Heuristic } from './heuristics.ts';
import {
	searchModel,
	searchState,
	type SearchCounter,
	type SearchEvent,
	type SearchProgram,
	type SearchState
} from './model.ts';

export interface SearchAlgorithm {
	readonly id: string;
	readonly name: string;
	readonly summary: string;
	/** What the returned path is guaranteed to be. */
	readonly guarantee: string;
	readonly usesHeuristic: boolean;
	readonly code: readonly string[];
	/** `heuristic` is ignored by algorithms that do not use one. */
	run(grid: Grid, heuristic: Heuristic): SearchProgram;
}

export type SearchTimeline = Timeline<SearchState, SearchEvent, SearchCounter>;

export function recordSearch(
	algorithm: SearchAlgorithm,
	grid: Grid,
	heuristic: Heuristic,
	options?: RecordOptions
): SearchTimeline {
	return record(
		searchModel,
		searchState(grid.cells.length),
		() => algorithm.run(grid, heuristic),
		options
	);
}

/** Emits the found path goal-first, then `done` with its weighted cost. */
export function* walkBack(grid: Grid, parent: Int32Array, line: number): SearchProgram {
	let cost = 0;
	for (let cell = grid.goal; cell !== -1; cell = parent[cell] ?? -1) {
		yield { type: 'path', cell, line };
		if (cell !== grid.start) cost += stepCost(grid, cell);
	}
	yield { type: 'done', found: true, cost, line };
}
