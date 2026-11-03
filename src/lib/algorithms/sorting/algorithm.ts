import { record, type RecordOptions, type Timeline } from '../../engine/index.ts';
import {
	arrayModel,
	arrayState,
	type ArrayState,
	type SortCounter,
	type SortEvent,
	type SortProgram
} from './model.ts';

export interface Complexity {
	readonly best: string;
	readonly average: string;
	readonly worst: string;
	readonly space: string;
}

/** A sorting algorithm as the app sees it: metadata, a listing, and a generator. */
export interface SortAlgorithm {
	readonly id: string;
	readonly name: string;
	readonly summary: string;
	readonly complexity: Complexity;
	readonly stable: boolean;
	/** What a `mark` event highlights, for the legend and captions; null if it never marks. */
	readonly markRole: string | null;
	/** Whether the renderer should reserve a row for the merge buffer. */
	readonly usesBuffer: boolean;
	/** Pseudocode for the code panel. Event `line` values index into it, starting at 1. */
	readonly code: readonly string[];
	/** Sorts `n` elements it can only see through `compare` replies. */
	run(n: number): SortProgram;
}

export type SortTimeline = Timeline<ArrayState, SortEvent, SortCounter, number>;

/** Records `algorithm` sorting `values`, ending with a `done` event. */
export function recordSort(
	algorithm: SortAlgorithm,
	values: readonly number[],
	options?: RecordOptions
): SortTimeline {
	return record(
		arrayModel,
		arrayState(values),
		function* () {
			yield* algorithm.run(values.length);
			yield { type: 'done', line: 0 };
		},
		options
	);
}
