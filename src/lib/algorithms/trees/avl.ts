import { BST_CODE, WALKS } from './bst.ts';
import {
	balance,
	child,
	sideOf,
	type TreeEvent,
	type TreeOp,
	type TreeOpKind,
	type TreeProgram,
	type TreeView
} from './model.ts';

const REBALANCE = [
	'  for each ancestor a, bottom up',
	'    b = height(a.left) - height(a.right)',
	'    if b > 1:',
	'      if balance(a.left) < 0: rotateLeft(a.left)',
	'      rotateRight(a)',
	'    if b < -1:',
	'      if balance(a.right) > 0: rotateRight(a.right)',
	'      rotateLeft(a)'
];

const AVL_CODE: Readonly<Record<TreeOpKind, readonly string[]>> = {
	insert: [...BST_CODE.insert, ...REBALANCE],
	search: BST_CODE.search,
	delete: [...BST_CODE.delete, ...REBALANCE]
};

/**
 * Walks the changed path bottom-up and fixes any node whose subtrees differ in
 * height by more than one. Heights are recomputed from the live tree rather
 * than stored, which is O(n) per check but keeps the state (and every
 * checkpoint) down to the pointers themselves; trees here stay under 32 nodes.
 */
function* rebalance(
	view: TreeView,
	ancestors: readonly number[],
	first: number
): Generator<TreeEvent, void, number> {
	for (let i = ancestors.length - 1; i >= 0; i--) {
		const a = ancestors[i] as number;
		const parent = ancestors[i - 1] ?? -1;
		yield { type: 'visit', node: a, line: first };
		const b = balance(view, a);
		yield { type: 'line', line: first + 1 };
		if (b > 1) {
			yield { type: 'line', line: first + 2 };
			const left = child(view, a, 'left');
			if (balance(view, left) < 0) {
				yield { type: 'rotate', node: left, dir: 'left', parent: a, side: 'left', line: first + 3 };
			}
			yield {
				type: 'rotate',
				node: a,
				dir: 'right',
				parent,
				side: sideOf(view, parent, a),
				line: first + 4
			};
		} else if (b < -1) {
			yield { type: 'line', line: first + 5 };
			const right = child(view, a, 'right');
			if (balance(view, right) > 0) {
				yield {
					type: 'rotate',
					node: right,
					dir: 'right',
					parent: a,
					side: 'right',
					line: first + 6
				};
			}
			yield {
				type: 'rotate',
				node: a,
				dir: 'left',
				parent,
				side: sideOf(view, parent, a),
				line: first + 7
			};
		}
	}
}

export const avl = {
	id: 'avl',
	name: 'AVL tree',
	summary:
		'A binary search tree that rotates after every insert and delete so no two sibling subtrees differ in height by more than one. Height stays under 1.44 log2 n.',
	code: AVL_CODE,
	*run(view: TreeView, op: TreeOp): TreeProgram {
		yield { type: 'begin', op, line: 1 };
		const walk = yield* WALKS[op.kind](view, op.key);
		if (walk.ancestors.length > 0) {
			yield* rebalance(view, walk.ancestors, BST_CODE[op.kind].length + 1);
		}
		yield { type: 'result', node: walk.node, outcome: walk.outcome, line: walk.line };
	}
} as const;
