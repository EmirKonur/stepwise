import {
	INPUT_KINDS,
	MAX_SIZE,
	MIN_SIZE,
	generateInput,
	parseCustom,
	type InputKind
} from '../algorithms/sorting/index.ts';
import { type QueryParams, readChoice, readInt, readSeed } from './params.ts';

/** The shared "shape the input" part of the sort and race pages. */
export interface InputParams {
	readonly input: InputKind;
	readonly size: number;
	readonly seed: string;
	/** Only set (and only used) when `input` is `custom`; `size` then equals its length. */
	readonly values: readonly number[] | null;
}

export const DEFAULT_SEED = '1919';

export function parseInput(params: QueryParams, defaultSize: number): InputParams {
	const input = readChoice(params, 'input', INPUT_KINDS, 'random');
	const size = readInt(params, 'n', MIN_SIZE, MAX_SIZE, defaultSize);
	const seed = readSeed(params, 'seed', DEFAULT_SEED);
	if (input !== 'custom') return { input, size, seed, values: null };
	const parsed = parseCustom(params.get('values') ?? '');
	return parsed.ok
		? { input, size: parsed.values.length, seed, values: parsed.values }
		: { input: 'random', size, seed, values: null };
}

export function inputEntries(params: InputParams): Record<string, string | number | null> {
	return params.input === 'custom' && params.values
		? { input: 'custom', values: params.values.join(',') }
		: { input: params.input, n: params.size, seed: params.seed };
}

export function inputValues(params: InputParams): number[] {
	if (params.input === 'custom' && params.values) return [...params.values];
	return generateInput(
		params.input === 'custom' ? 'random' : params.input,
		params.size,
		params.seed
	);
}
