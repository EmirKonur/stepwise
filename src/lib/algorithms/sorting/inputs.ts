import { integer, seeded, shuffle } from '../../engine/index.ts';

export const INPUT_KINDS = ['random', 'nearly', 'reversed', 'few', 'custom'] as const;
export type InputKind = (typeof INPUT_KINDS)[number];
export type GeneratedKind = Exclude<InputKind, 'custom'>;

export const INPUT_LABELS: Record<InputKind, string> = {
	random: 'Random',
	nearly: 'Nearly sorted',
	reversed: 'Reversed',
	few: 'Few unique',
	custom: 'Custom'
};

export const MIN_SIZE = 4;
export const MAX_SIZE = 128;
export const MAX_VALUE = 999;

/**
 * Builds a deterministic input. Generated inputs are permutations (or, for
 * `few`, a small set of levels) of 1..n so the sorted result reads as a clean
 * staircase.
 */
export function generateInput(kind: GeneratedKind, size: number, seed: string): number[] {
	const n = Math.max(MIN_SIZE, Math.min(MAX_SIZE, Math.trunc(size)));
	const random = seeded(`${kind}:${seed}`);
	const ascending = Array.from({ length: n }, (_, index) => index + 1);
	switch (kind) {
		case 'random':
			return shuffle(ascending, random);
		case 'reversed':
			return ascending.reverse();
		case 'nearly': {
			// A few short-range swaps: every value stays within 3 slots of home.
			const swaps = Math.max(1, Math.round(n / 10));
			for (let s = 0; s < swaps; s++) {
				const i = integer(random, 0, n - 2);
				const j = Math.min(n - 1, i + integer(random, 1, 3));
				const held = ascending[i] as number;
				ascending[i] = ascending[j] as number;
				ascending[j] = held;
			}
			return ascending;
		}
		case 'few': {
			const levels = [0.25, 0.5, 0.75, 1].map((f) => Math.max(1, Math.round(f * n)));
			return Array.from(
				{ length: n },
				() => levels[integer(random, 0, levels.length - 1)] as number
			);
		}
	}
}

export type ParseResult =
	{ readonly ok: true; readonly values: number[] } | { readonly ok: false; readonly error: string };

/** Parses the custom-input field: whole numbers separated by commas or spaces. */
export function parseCustom(text: string): ParseResult {
	const tokens = text.split(/[\s,]+/).filter((token) => token !== '');
	if (tokens.length < 2) return { ok: false, error: 'Enter at least 2 numbers.' };
	if (tokens.length > MAX_SIZE) {
		return { ok: false, error: `At most ${MAX_SIZE} numbers (got ${tokens.length}).` };
	}
	const values: number[] = [];
	for (const token of tokens) {
		if (!/^\d+$/.test(token) || Number(token) > MAX_VALUE) {
			return { ok: false, error: `"${token}" is not a whole number from 0 to ${MAX_VALUE}.` };
		}
		values.push(Number(token));
	}
	return { ok: true, values };
}
