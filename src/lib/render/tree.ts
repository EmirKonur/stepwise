import { balance, child, type TreeFrame } from '../algorithms/trees/index.ts';

export type NodeTone = 'idle' | 'cursor' | 'compare' | 'result' | 'rotate' | 'copy';

export interface NodeShape {
	readonly id: number;
	readonly key: number;
	readonly x: number;
	readonly y: number;
	readonly tone: NodeTone;
	readonly balance: number;
}

export interface TreeScene {
	readonly width: number;
	readonly height: number;
	readonly radius: number;
	readonly nodes: readonly NodeShape[];
	readonly edges: readonly { readonly parent: number; readonly child: number }[];
	/** The key being inserted, searched or deleted, parked beside the node it is compared with. */
	readonly probe: { readonly key: number; readonly node: number } | null;
	/** Successor key travelling to the node being deleted. */
	readonly copy: { readonly from: number; readonly to: number } | null;
}

export interface TreeLayout {
	readonly width: number;
	readonly height: number;
}

const PAD = 36;

/**
 * Pure layout: x is a node's in-order rank, y its depth. In-order rank is
 * what makes rotations read correctly on screen, since a rotation never
 * changes the left-to-right order of keys, only their depths.
 */
export function treeScene(frame: TreeFrame, layout: TreeLayout): TreeScene {
	const tree = frame.state;
	const order: { id: number; depth: number }[] = [];
	const edges: { parent: number; child: number }[] = [];
	const visit = (node: number, depth: number) => {
		if (node === -1) return;
		const left = child(tree, node, 'left');
		const right = child(tree, node, 'right');
		if (left !== -1) edges.push({ parent: node, child: left });
		if (right !== -1) edges.push({ parent: node, child: right });
		visit(left, depth + 1);
		order.push({ id: node, depth });
		visit(right, depth + 1);
	};
	visit(tree.root, 0);

	const n = Math.max(1, order.length);
	const maxDepth = order.reduce((deepest, entry) => Math.max(deepest, entry.depth), 0);
	const slot = (layout.width - 2 * PAD) / n;
	const radius = Math.max(11, Math.min(26, slot * 0.42));
	const rowHeight = Math.min(84, (layout.height - 2 * PAD) / Math.max(1, maxDepth));
	const tones = nodeTones(frame);

	const nodes = order.map(({ id, depth }, rank) => ({
		id,
		key: tree.key[id] as number,
		x: PAD + (rank + 0.5) * slot,
		y: PAD + depth * rowHeight,
		tone: tones.get(id) ?? 'idle',
		balance: balance(tree, id)
	}));

	return {
		width: layout.width,
		height: layout.height,
		radius,
		nodes,
		edges,
		probe: tree.probe !== -1 && tree.op ? { key: tree.op.key, node: tree.probe } : null,
		copy: frame.event?.type === 'copy' ? { from: frame.event.from, to: frame.event.to } : null
	};
}

function nodeTones(frame: TreeFrame): Map<number, NodeTone> {
	const tree = frame.state;
	const tones = new Map<number, NodeTone>();
	if (tree.result !== -1 && (tree.outcome === 'found' || tree.outcome === 'inserted')) {
		tones.set(tree.result, 'result');
	}
	if (tree.cursor !== -1) tones.set(tree.cursor, 'cursor');
	const event = frame.event;
	switch (event?.type) {
		case 'compare':
			tones.set(event.node, 'compare');
			break;
		case 'rotate': {
			tones.set(event.node, 'rotate');
			const raised = event.parent === -1 ? tree.root : child(tree, event.parent, event.side);
			tones.set(raised, 'rotate');
			break;
		}
		case 'copy':
			tones.set(event.from, 'copy');
			tones.set(event.to, 'copy');
			break;
	}
	return tones;
}
