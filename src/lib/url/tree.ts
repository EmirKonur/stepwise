import {
	MAX_KEY,
	MAX_OPS,
	MIN_KEY,
	TREES,
	starterOps,
	type TreeOp,
	type TreeOpKind
} from '../algorithms/trees/index.ts';
import { DEFAULT_SEED } from './input.ts';
import { MAX_STEP, query, type QueryParams, readChoice, readInt } from './params.ts';

export interface TreeParams {
	readonly algo: string;
	/** The whole history, replayed from an empty tree. */
	readonly ops: readonly TreeOp[];
	/** `null` means "the end", which is where a fresh visit lands. */
	readonly step: number | null;
}

const LETTERS: Record<TreeOpKind, string> = { insert: 'i', search: 's', delete: 'd' };
const KINDS: Record<string, TreeOpKind> = { i: 'insert', s: 'search', d: 'delete' };

export function parseTree(params: QueryParams): TreeParams {
	const raw = params.get('ops');
	const ops = raw === null ? starterOps(DEFAULT_SEED) : parseOps(raw);
	return {
		algo: readChoice(
			params,
			'algo',
			TREES.map((tree) => tree.id),
			'avl'
		),
		ops,
		step: params.has('step') ? readInt(params, 'step', 0, MAX_STEP, 0) : null
	};
}

/** Drops malformed tokens rather than the whole history. */
export function parseOps(raw: string): TreeOp[] {
	const ops: TreeOp[] = [];
	for (const token of raw.split(',')) {
		const match = /^([isd])(\d{1,2})$/.exec(token);
		const kind = match ? KINDS[match[1] as string] : undefined;
		const key = Number(match?.[2]);
		if (kind && key >= MIN_KEY && key <= MAX_KEY) ops.push({ kind, key });
		if (ops.length === MAX_OPS) break;
	}
	return ops;
}

function formatOps(ops: readonly TreeOp[]): string {
	return ops.map((op) => `${LETTERS[op.kind]}${op.key}`).join(',');
}

export function formatTree(params: TreeParams): string {
	// An empty history still needs an `ops` key, or the link would reopen on the starter tree.
	const ops = params.ops.length > 0 ? formatOps(params.ops) : '-';
	return query({ algo: params.algo, ops, step: params.step });
}
