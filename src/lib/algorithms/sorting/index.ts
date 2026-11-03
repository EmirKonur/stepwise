import type { SortAlgorithm } from './algorithm.ts';
import { bubble } from './bubble.ts';
import { heap } from './heap.ts';
import { insertion } from './insertion.ts';
import { merge } from './merge.ts';
import { quick } from './quick.ts';
import { selection } from './selection.ts';
import { shell } from './shell.ts';

/** Display order in the picker. Adding an algorithm means adding it here. */
export const SORTS: readonly SortAlgorithm[] = [
	bubble,
	insertion,
	selection,
	shell,
	merge,
	quick,
	heap
];

export function findSort(id: string | null): SortAlgorithm | undefined {
	return SORTS.find((algorithm) => algorithm.id === id);
}

export { recordSort, type SortAlgorithm, type SortTimeline } from './algorithm.ts';
export * from './inputs.ts';
export * from './model.ts';
