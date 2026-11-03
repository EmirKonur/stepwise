import { SEED_PATTERN } from '../engine/index.ts';

type Value = string | number | null | undefined;

/** The read side of URLSearchParams; SvelteKit hands pages a read-only one. */
export type QueryParams = Pick<URLSearchParams, 'get' | 'has'>;

/** Reads an integer in [min, max]; anything else yields `fallback`. */
export function readInt(
	params: QueryParams,
	key: string,
	min: number,
	max: number,
	fallback: number
): number {
	const raw = params.get(key);
	if (raw === null || !/^-?\d+$/.test(raw)) return fallback;
	const value = Number(raw);
	return value >= min && value <= max ? value : fallback;
}

export function readChoice<T extends string>(
	params: QueryParams,
	key: string,
	choices: readonly T[],
	fallback: T
): T {
	const raw = params.get(key);
	return choices.find((choice) => choice === raw) ?? fallback;
}

export function readSeed(params: QueryParams, key: string, fallback: string): string {
	const raw = params.get(key);
	return raw !== null && SEED_PATTERN.test(raw) ? raw : fallback;
}

/**
 * Builds a query string, skipping empty values. Commas stay literal (they are
 * legal in a query) so lists like `values=5,3,8` remain readable when shared.
 */
export function query(entries: Record<string, Value>): string {
	return Object.entries(entries)
		.filter(
			(entry): entry is [string, string | number] =>
				entry[1] !== null && entry[1] !== undefined && entry[1] !== ''
		)
		.map(([key, value]) => `${key}=${encodeURIComponent(value).replaceAll('%2C', ',')}`)
		.join('&');
}

/** Steps beyond the timeline are clamped later; this only rejects garbage. */
export const MAX_STEP = 10_000_000;
