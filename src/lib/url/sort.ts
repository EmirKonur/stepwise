import { SORTS } from '../algorithms/sorting/index.ts';
import { inputEntries, parseInput, type InputParams } from './input.ts';
import { MAX_STEP, query, type QueryParams, readChoice, readInt } from './params.ts';

export interface SortParams extends InputParams {
	readonly algo: string;
	readonly step: number;
}

const ids = SORTS.map((algorithm) => algorithm.id);

export function parseSort(params: QueryParams): SortParams {
	return {
		algo: readChoice(params, 'algo', ids, 'quick'),
		...parseInput(params, 32),
		step: readInt(params, 'step', 0, MAX_STEP, 0)
	};
}

export function formatSort(params: SortParams): string {
	return query({ algo: params.algo, ...inputEntries(params), step: params.step });
}
