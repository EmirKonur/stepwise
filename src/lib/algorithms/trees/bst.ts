import {
	child,
	sideOf,
	type Outcome,
	type Side,
	type TreeEvent,
	type TreeOp,
	type TreeOpKind,
	type TreeProgram,
	type TreeView
} from './model.ts';

/** What a BST walk did, so a balancing variant can follow up before reporting. */
export interface WalkResult {
	readonly outcome: Outcome;
	readonly node: number;
	/** Listing line the outcome belongs to. */
	readonly line: number;
	/** Root-first nodes whose subtree height may have changed. */
	readonly ancestors: readonly number[];
}

export type Walk = Generator<TreeEvent, WalkResult, number>;

export const BST_CODE: Readonly<Record<TreeOpKind, readonly string[]>> = {
	insert: [
		'insert(key):',
		'  if root is empty: root = Node(key); return',
		'  node = root',
		'  while node is not empty',
		'    if key == node.key: return  // already there',
		'    parent = node',
		'    node = key < node.key ? node.left : node.right',
		'  hang Node(key) under parent'
	],
	search: [
		'search(key):',
		'  node = root',
		'  while node is not empty',
		'    if key == node.key: return node',
		'    node = key < node.key ? node.left : node.right',
		'  return not found'
	],
	delete: [
		'delete(key):',
		'  find node with node.key == key',
		'  if not found: return',
		'  if no left child: replace node with node.right',
		'  elif no right child: replace node with node.left',
		'  else',
		'    s = leftmost node of node.right  // successor',
		'    node.key = s.key',
		'    replace s with s.right'
	]
};

function* insertWalk(view: TreeView, key: number): Walk {
	if (view.root === -1) {
		const node = view.key.length;
		yield { type: 'attach', node, key, parent: -1, side: 'left', line: 2 };
		return { outcome: 'inserted', node, line: 2, ancestors: [] };
	}
	yield { type: 'line', line: 3 };
	const ancestors: number[] = [];
	let node = view.root;
	let side: Side = 'left';
	while (node !== -1) {
		yield { type: 'visit', node, line: 4 };
		const order = yield { type: 'compare', node, line: 5 };
		if (order === 0) return { outcome: 'duplicate', node, line: 5, ancestors: [] };
		ancestors.push(node);
		side = order < 0 ? 'left' : 'right';
		node = child(view, node, side);
		yield { type: 'line', line: 7 };
	}
	const created = view.key.length;
	yield { type: 'attach', node: created, key, parent: ancestors.at(-1) ?? -1, side, line: 8 };
	return { outcome: 'inserted', node: created, line: 8, ancestors };
}

/** The key arrives through the model: `compare` replies against the operation's key. */
function* searchWalk(view: TreeView, _key: number): Walk {
	yield { type: 'line', line: 2 };
	let node = view.root;
	while (node !== -1) {
		yield { type: 'visit', node, line: 3 };
		const order = yield { type: 'compare', node, line: 4 };
		if (order === 0) return { outcome: 'found', node, line: 4, ancestors: [] };
		node = child(view, node, order < 0 ? 'left' : 'right');
		yield { type: 'line', line: 5 };
	}
	return { outcome: 'missing', node: -1, line: 6, ancestors: [] };
}

/**
 * Hibbard deletion. A node with two children takes its successor's key and the
 * successor (which has no left child) is spliced out instead, so the tree is
 * valid after every single event.
 */
function* deleteWalk(view: TreeView, _key: number): Walk {
	const ancestors: number[] = [];
	let parent = -1;
	let node = view.root;
	while (node !== -1) {
		yield { type: 'visit', node, line: 2 };
		const order = yield { type: 'compare', node, line: 2 };
		if (order === 0) break;
		ancestors.push(node);
		parent = node;
		node = child(view, node, order < 0 ? 'left' : 'right');
	}
	if (node === -1) return { outcome: 'missing', node: -1, line: 3, ancestors: [] };

	const side = sideOf(view, parent, node);
	const left = child(view, node, 'left');
	const right = child(view, node, 'right');
	if (left === -1) {
		yield { type: 'link', parent, side, child: right, line: 4 };
		return { outcome: 'deleted', node: -1, line: 4, ancestors };
	}
	if (right === -1) {
		yield { type: 'link', parent, side, child: left, line: 5 };
		return { outcome: 'deleted', node: -1, line: 5, ancestors };
	}

	yield { type: 'line', line: 6 };
	ancestors.push(node);
	let successorParent = node;
	let successor = right;
	yield { type: 'visit', node: successor, line: 7 };
	while (child(view, successor, 'left') !== -1) {
		ancestors.push(successor);
		successorParent = successor;
		successor = child(view, successor, 'left');
		yield { type: 'visit', node: successor, line: 7 };
	}
	yield { type: 'copy', from: successor, to: node, line: 8 };
	yield {
		type: 'link',
		parent: successorParent,
		side: sideOf(view, successorParent, successor),
		child: child(view, successor, 'right'),
		line: 9
	};
	return { outcome: 'deleted', node: -1, line: 9, ancestors };
}

export const WALKS: Readonly<Record<TreeOpKind, (view: TreeView, key: number) => Walk>> = {
	insert: insertWalk,
	search: searchWalk,
	delete: deleteWalk
};

export const bst = {
	id: 'bst',
	name: 'Binary search tree',
	summary:
		'Smaller keys go left, larger keys go right. Operations cost the height of the tree, which is log n on random input and n when keys arrive in order.',
	code: BST_CODE,
	*run(view: TreeView, op: TreeOp): TreeProgram {
		yield { type: 'begin', op, line: 1 };
		const walk = yield* WALKS[op.kind](view, op.key);
		yield { type: 'result', node: walk.node, outcome: walk.outcome, line: walk.line };
	}
} as const;
