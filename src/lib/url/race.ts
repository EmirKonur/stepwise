import { SORTS } from '../algorithms/sorting/index.ts';
import { inputEntries, parseInput, type InputParams } from './input.ts';
import { MAX_STEP, query, type QueryParams, readChoice, readInt } from './params.ts';

export interface RaceParams extends InputParams {
	readonly a: string;
	readonly b: string;
	/** Race clock: operations performed by each lane so far. */
	readonly tick: number;
}

const ids = SORTS.map((algorithm) => algorithm.id);

export function parseRace(params: QueryParams): RaceParams {
	return {
		a: readChoice(params, 'a', ids, 'quick'),
		b: readChoice(params, 'b', ids, 'merge'),
		...parseInput(params, 48),
		tick: readInt(params, 't', 0, MAX_STEP, 0)
	};
}

export function formatRace(params: RaceParams): string {
	return query({ a: params.a, b: params.b, ...inputEntries(params), t: params.tick });
}
