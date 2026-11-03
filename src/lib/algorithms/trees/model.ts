import type { Frame, Model, Program } from '../../engine/index.ts';

export type Side = 'left' | 'right';
export type TreeOpKind = 'insert' | 'search' | 'delete';
export type Outcome = 'inserted' | 'duplicate' | 'found' | 'missing' | 'deleted';

export interface TreeOp {
	readonly kind: TreeOpKind;
	readonly key: number;
}

/**
 * Pointer-level tree edits. Every event leaves a valid binary tree behind, so
 * any frame can be drawn on its own; that is why two-child deletes copy the
 * successor's key instead of splicing the successor node into place.
 */
export type TreeEvent =
	| { readonly type: 'line'; readonly line: number }
	/** Starts the next operation; the code panel switches to its listing. */
	| { readonly type: 'begin'; readonly line: number; readonly op: TreeOp }
	/** Moves the cursor to `node` (-1 clears it). */
	| { readonly type: 'visit'; readonly line: number; readonly node: number }
	/** Reply: sign of (operation key - node key). */
	| { readonly type: 'compare'; readonly line: number; readonly node: number }
	/** Creates node `node` holding `key` and hangs it under `parent` (-1 means as the root). */
	| {
			readonly type: 'attach';
			readonly line: number;
			readonly node: number;
			readonly key: number;
			readonly parent: number;
			readonly side: Side;
	  }
	/** Points `parent`'s `side` child (or the root, when parent is -1) at `child`. */
	| {
			readonly type: 'link';
			readonly line: number;
			readonly parent: number;
			readonly side: Side;
			readonly child: number;
	  }
	/** Overwrites `to`'s key with `from`'s. */
	| { readonly type: 'copy'; readonly line: number; readonly from: number; readonly to: number }
	/** Rotates the subtree rooted at `node`, which hangs off `parent`'s `side`. */
	| {
			readonly type: 'rotate';
			readonly line: number;
			readonly node: number;
			readonly dir: Side;
			readonly parent: number;
			readonly side: Side;
	  }
	| {
			readonly type: 'result';
			readonly line: number;
			readonly node: number;
			readonly outcome: Outcome;
	  };

/** What tree algorithms may read. They change the tree only by yielding events. */
export interface TreeView {
	readonly key: readonly number[];
	readonly left: readonly number[];
	readonly right: readonly number[];
	readonly root: number;
}

/** Nodes are indices into parallel arrays; -1 is "no node". Unlinked nodes are simply unreachable. */
export interface TreeState extends TreeView {
	key: number[];
	left: number[];
	right: number[];
	root: number;
	op: TreeOp | null;
	/** How many operations have begun, so the UI can label "operation 3 of 12". */
	opCount: number;
	cursor: number;
	/** Node the operation's key was last compared against, while it is still travelling down. */
	probe: number;
	result: number;
	outcome: Outcome | null;
}

export type TreeCounter = 'comparisons' | 'rotations';
export type TreeProgram = Program<TreeEvent, number>;
export type TreeFrame = Frame<TreeState, TreeEvent, TreeCounter>;

export function emptyTree(): TreeState {
	return {
		key: [],
		left: [],
		right: [],
		root: -1,
		op: null,
		opCount: 0,
		cursor: -1,
		probe: -1,
		result: -1,
		outcome: null
	};
}

export function child(tree: TreeView, node: number, side: Side): number {
	return (side === 'left' ? tree.left[node] : tree.right[node]) ?? -1;
}

/** Which side of `parent` holds `node`. Meaningless (but harmless) when parent is -1. */
export function sideOf(tree: TreeView, parent: number, node: number): Side {
	return parent !== -1 && tree.left[parent] === node ? 'left' : 'right';
}

/** Nodes reachable from the root. Unlinked nodes stay in the arrays but are no longer part of the tree. */
export function reachableNodes(tree: TreeView): number[] {
	const nodes: number[] = [];
	const stack = tree.root === -1 ? [] : [tree.root];
	while (stack.length > 0) {
		const node = stack.pop() as number;
		nodes.push(node);
		for (const next of [child(tree, node, 'left'), child(tree, node, 'right')]) {
			if (next !== -1) stack.push(next);
		}
	}
	return nodes;
}

export function height(tree: TreeView, node: number): number {
	if (node === -1) return 0;
	return (
		1 + Math.max(height(tree, child(tree, node, 'left')), height(tree, child(tree, node, 'right')))
	);
}

export function balance(tree: TreeView, node: number): number {
	if (node === -1) return 0;
	return height(tree, child(tree, node, 'left')) - height(tree, child(tree, node, 'right'));
}

function setChild(tree: TreeState, parent: number, side: Side, node: number): void {
	if (parent === -1) tree.root = node;
	else if (side === 'left') tree.left[parent] = node;
	else tree.right[parent] = node;
}

function keyOf(tree: TreeState, node: number): number {
	const key = tree.key[node];
	if (key === undefined) throw new RangeError(`node ${node} does not exist`);
	return key;
}

export const treeModel: Model<TreeState, TreeEvent, TreeCounter, number> = {
	counters: ['comparisons', 'rotations'],

	clone(tree) {
		return {
			key: tree.key.slice(),
			left: tree.left.slice(),
			right: tree.right.slice(),
			root: tree.root,
			op: tree.op,
			opCount: tree.opCount,
			cursor: tree.cursor,
			probe: tree.probe,
			result: tree.result,
			outcome: tree.outcome
		};
	},

	apply(tree, event) {
		if (event.type !== 'compare' && event.type !== 'visit' && event.type !== 'line')
			tree.probe = -1;
		switch (event.type) {
			case 'begin':
				tree.op = event.op;
				tree.opCount += 1;
				tree.cursor = -1;
				tree.result = -1;
				tree.outcome = null;
				return 0;
			case 'visit':
				tree.cursor = event.node;
				return 0;
			case 'compare': {
				if (!tree.op) throw new Error('compare outside an operation');
				tree.cursor = event.node;
				tree.probe = event.node;
				return Math.sign(tree.op.key - keyOf(tree, event.node));
			}
			case 'attach':
				if (event.node !== tree.key.length) {
					throw new Error(`attach must create node ${tree.key.length}, got ${event.node}`);
				}
				tree.key.push(event.key);
				tree.left.push(-1);
				tree.right.push(-1);
				setChild(tree, event.parent, event.side, event.node);
				tree.cursor = event.node;
				return 0;
			case 'link':
				setChild(tree, event.parent, event.side, event.child);
				return 0;
			case 'copy':
				tree.key[event.to] = keyOf(tree, event.from);
				return 0;
			case 'rotate': {
				const x = event.node;
				const opposite: Side = event.dir === 'left' ? 'right' : 'left';
				const y = child(tree, x, opposite);
				if (y === -1) throw new Error(`cannot rotate ${event.dir} at ${x}: no ${opposite} child`);
				// Rotating left at x: y = x.right becomes the subtree root and x takes y's old left subtree.
				if (event.dir === 'left') {
					tree.right[x] = child(tree, y, 'left');
					tree.left[y] = x;
				} else {
					tree.left[x] = child(tree, y, 'right');
					tree.right[y] = x;
				}
				setChild(tree, event.parent, event.side, y);
				return 0;
			}
			case 'result':
				tree.result = event.node;
				tree.outcome = event.outcome;
				tree.cursor = -1;
				return 0;
			case 'line':
				return 0;
		}
	},

	tally(event, counts) {
		if (event.type === 'compare') counts.comparisons += 1;
		else if (event.type === 'rotate') counts.rotations += 1;
	}
};
