import { record, seeded, shuffle, type RecordOptions, type Timeline } from '../../engine/index.ts';
import { avl } from './avl.ts';
import { bst } from './bst.ts';
import {
	emptyTree,
	treeModel,
	type TreeCounter,
	type TreeEvent,
	type TreeOp,
	type TreeOpKind,
	type TreeProgram,
	type TreeState,
	type TreeView
} from './model.ts';

export interface TreeAlgorithm {
	readonly id: string;
	readonly name: string;
	readonly summary: string;
	readonly code: Readonly<Record<TreeOpKind, readonly string[]>>;
	run(view: TreeView, op: TreeOp): TreeProgram;
}

export const TREES: readonly TreeAlgorithm[] = [bst, avl];

export function findTree(id: string | null): TreeAlgorithm | undefined {
	return TREES.find((algorithm) => algorithm.id === id);
}

export const MIN_KEY = 1;
export const MAX_KEY = 99;
/** Past this the drawing gets too small to read on a phone. */
export const MAX_NODES = 31;
/** Keeps shared URLs a sane length. */
export const MAX_OPS = 160;

export type TreeTimeline = Timeline<TreeState, TreeEvent, TreeCounter, number>;

/** Records every operation in order on one timeline, starting from an empty tree. */
export function recordTree(
	algorithm: TreeAlgorithm,
	ops: readonly TreeOp[],
	options?: RecordOptions
): TreeTimeline {
	return record(
		treeModel,
		emptyTree(),
		function* (live) {
			for (const op of ops) yield* algorithm.run(live, op);
		},
		options
	);
}

/** Distinct random keys to start from, so the first visit has a tree to play with. */
export function starterOps(seed: string, count = 11): TreeOp[] {
	const keys = Array.from({ length: MAX_KEY - MIN_KEY + 1 }, (_, index) => index + MIN_KEY);
	return shuffle(keys, seeded(`tree:${seed}`))
		.slice(0, count)
		.map((key) => ({ kind: 'insert', key }));
}

export * from './model.ts';
