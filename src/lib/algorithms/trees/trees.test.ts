import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { replay } from '../../../test/replay.ts';
import {
	MAX_KEY,
	TREES,
	balance,
	emptyTree,
	height,
	recordTree,
	starterOps,
	treeModel,
	type TreeOp,
	type TreeState
} from './index.ts';

/** Keys from a small range so inserts collide and deletes usually hit. */
const opArb: fc.Arbitrary<TreeOp> = fc.record({
	kind: fc.constantFrom('insert', 'insert', 'search', 'delete'),
	key: fc.integer({ min: 1, max: 24 })
});
const opsArb = fc.array(opArb, { maxLength: 60 });

/** In-order keys of the reachable tree; throws on cycles or shared nodes. */
function inOrder(tree: TreeState): number[] {
	const keys: number[] = [];
	const seen = new Set<number>();
	const walk = (node: number) => {
		if (node === -1) return;
		if (seen.has(node)) throw new Error(`node ${node} is reachable twice`);
		seen.add(node);
		walk(tree.left[node] ?? -1);
		keys.push(tree.key[node] as number);
		walk(tree.right[node] ?? -1);
	};
	walk(tree.root);
	return keys;
}

function reachable(tree: TreeState): number[] {
	const nodes: number[] = [];
	const stack = tree.root === -1 ? [] : [tree.root];
	while (stack.length > 0) {
		const node = stack.pop() as number;
		nodes.push(node);
		for (const next of [tree.left[node] ?? -1, tree.right[node] ?? -1])
			if (next !== -1) stack.push(next);
	}
	return nodes;
}

/** State at the end of each operation, paired with the reference set at that moment. */
function checkpoints(algorithmIndex: number, ops: readonly TreeOp[]) {
	const timeline = recordTree(TREES[algorithmIndex]!, ops);
	const begins = timeline.stepsWhere((event) => event.type === 'begin');
	const ends = [...begins.slice(1).map((step) => step - 1), timeline.last];
	const reference = new Set<number>();
	return ops.map((op, index) => {
		const before = new Set(reference);
		if (op.kind === 'insert') reference.add(op.key);
		if (op.kind === 'delete') reference.delete(op.key);
		return { op, before, after: new Set(reference), state: timeline.seek(ends[index] ?? 0).state };
	});
}

describe.each(TREES.map((tree, index) => [tree.name, index] as const))('%s', (_, index) => {
	it('stays a search tree holding exactly the reference set after every operation', () => {
		fc.assert(
			fc.property(opsArb, (ops) => {
				for (const { after, state } of checkpoints(index, ops)) {
					const keys = inOrder(state);
					expect(keys).toEqual([...after].sort((a, b) => a - b));
				}
			})
		);
	});

	it('reports search, insert and delete outcomes that agree with the reference set', () => {
		fc.assert(
			fc.property(opsArb, (ops) => {
				for (const { op, before, state } of checkpoints(index, ops)) {
					const present = before.has(op.key);
					const expected = {
						search: present ? 'found' : 'missing',
						insert: present ? 'duplicate' : 'inserted',
						delete: present ? 'deleted' : 'missing'
					}[op.kind];
					expect(state.outcome).toBe(expected);
					if (state.outcome === 'found' || state.outcome === 'inserted') {
						expect(state.key[state.result]).toBe(op.key);
					}
				}
			})
		);
	});

	it('records identical events every run, and replay reproduces any frame', () => {
		fc.assert(
			fc.property(opsArb, fc.double({ min: 0, max: 1, noNaN: true }), (ops, at) => {
				const timeline = recordTree(TREES[index]!, ops, { checkpointEvery: 8 });
				expect(recordTree(TREES[index]!, ops).events).toEqual(timeline.events);
				const step = Math.round(at * timeline.last);
				expect(timeline.seek(step).state).toEqual(
					replay(treeModel, emptyTree(), timeline.events, step).state
				);
			})
		);
	});

	it('only references lines in the listing of the operation it belongs to', () => {
		const ops = [
			...starterOps('lines'),
			{ kind: 'delete', key: 50 },
			{ kind: 'search', key: 7 }
		] as const;
		const algorithm = TREES[index]!;
		const timeline = recordTree(algorithm, ops);
		let kind: TreeOp['kind'] = 'insert';
		for (const event of timeline.events) {
			if (event.type === 'begin') kind = event.op.kind;
			expect(event.line).toBeGreaterThan(0);
			expect(event.line).toBeLessThanOrEqual(algorithm.code[kind].length);
		}
	});
});

describe('AVL balance', () => {
	const avlIndex = TREES.findIndex((tree) => tree.id === 'avl');

	it('keeps every node balanced to within one after every operation', () => {
		fc.assert(
			fc.property(opsArb, (ops) => {
				for (const { state } of checkpoints(avlIndex, ops)) {
					for (const node of reachable(state)) {
						expect(Math.abs(balance(state, node))).toBeLessThanOrEqual(1);
					}
				}
			})
		);
	});

	it('stays logarithmic where a plain BST degenerates into a list', () => {
		const ascending: TreeOp[] = Array.from({ length: 31 }, (_, i) => ({
			kind: 'insert',
			key: i + 1
		}));
		const heightAfter = (treeIndex: number) => {
			const timeline = recordTree(TREES[treeIndex]!, ascending);
			const { state } = timeline.seek(timeline.last);
			return height(state, state.root);
		};
		expect(heightAfter(TREES.findIndex((tree) => tree.id === 'bst'))).toBe(31);
		expect(heightAfter(avlIndex)).toBe(5);
	});
});

describe('starterOps', () => {
	it('inserts distinct keys in range, deterministically', () => {
		const ops = starterOps('seed');
		expect(starterOps('seed')).toEqual(ops);
		expect(new Set(ops.map((op) => op.key)).size).toBe(ops.length);
		for (const op of ops) {
			expect(op.kind).toBe('insert');
			expect(op.key).toBeGreaterThanOrEqual(1);
			expect(op.key).toBeLessThanOrEqual(MAX_KEY);
		}
	});
});
