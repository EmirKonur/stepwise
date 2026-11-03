import type { Frame, Model, Program } from '../../engine/index.ts';

/**
 * Everything a sorting algorithm can do. Comparison sorts only ever learn about
 * values through `compare`, whose reply is the sign of `a[i] - a[j]`, so the
 * algorithms never hold the array and the counters cannot drift from the code.
 */
export type SortEvent =
	| { readonly type: 'line'; readonly line: number }
	/** Reply: -1, 0 or 1. `buffer` compares two merge-buffer slots instead of array slots. */
	| {
			readonly type: 'compare';
			readonly line: number;
			readonly i: number;
			readonly j: number;
			readonly buffer?: true;
	  }
	| { readonly type: 'swap'; readonly line: number; readonly i: number; readonly j: number }
	/** Moves a[i] into buffer slot i, leaving the array slot empty. */
	| { readonly type: 'copy'; readonly line: number; readonly i: number }
	/** Moves buffer slot `from` into a[i]. */
	| { readonly type: 'write'; readonly line: number; readonly i: number; readonly from: number }
	/** Highlights the element the algorithm is holding (pivot, running minimum, key). -1 clears. */
	| { readonly type: 'mark'; readonly line: number; readonly i: number }
	/** a[lo..hi] are in their final positions. */
	| { readonly type: 'sorted'; readonly line: number; readonly lo: number; readonly hi: number }
	/** The subarray currently being worked on. lo > hi clears it. */
	| { readonly type: 'focus'; readonly line: number; readonly lo: number; readonly hi: number }
	/** Appended by the recorder: everything is in place. */
	| { readonly type: 'done'; readonly line: number };

export interface ArrayState {
	values: Int32Array;
	/**
	 * Stable identity per element so the renderer can animate moves. An array
	 * slot holds -1 while its element sits in the merge buffer.
	 */
	ids: Int32Array;
	buffer: Int32Array;
	bufferIds: Int32Array;
	sorted: Uint8Array;
	mark: number;
	focusLo: number;
	focusHi: number;
}

export type SortCounter = 'comparisons' | 'swaps' | 'writes';
export type SortProgram = Program<SortEvent, number>;
export type SortFrame = Frame<ArrayState, SortEvent, SortCounter>;

export function arrayState(values: readonly number[]): ArrayState {
	const n = values.length;
	return {
		values: Int32Array.from(values),
		ids: Int32Array.from(values, (_, index) => index),
		buffer: new Int32Array(n),
		bufferIds: new Int32Array(n).fill(-1),
		sorted: new Uint8Array(n),
		mark: -1,
		focusLo: 0,
		focusHi: -1
	};
}

export const arrayModel: Model<ArrayState, SortEvent, SortCounter, number> = {
	counters: ['comparisons', 'swaps', 'writes'],

	clone(state) {
		return {
			values: state.values.slice(),
			ids: state.ids.slice(),
			buffer: state.buffer.slice(),
			bufferIds: state.bufferIds.slice(),
			sorted: state.sorted.slice(),
			mark: state.mark,
			focusLo: state.focusLo,
			focusHi: state.focusHi
		};
	},

	apply(state, event) {
		switch (event.type) {
			case 'compare': {
				const source = event.buffer ? state.buffer : state.values;
				return Math.sign(read(source, event.i) - read(source, event.j));
			}
			case 'swap': {
				exchange(state.values, event.i, event.j);
				exchange(state.ids, event.i, event.j);
				return 0;
			}
			case 'copy': {
				state.buffer[event.i] = read(state.values, event.i);
				state.bufferIds[event.i] = read(state.ids, event.i);
				state.ids[event.i] = -1;
				return 0;
			}
			case 'write': {
				state.values[event.i] = read(state.buffer, event.from);
				state.ids[event.i] = read(state.bufferIds, event.from);
				state.bufferIds[event.from] = -1;
				return 0;
			}
			case 'mark':
				state.mark = event.i;
				return 0;
			case 'sorted':
				state.sorted.fill(1, event.lo, event.hi + 1);
				return 0;
			case 'focus':
				state.focusLo = event.lo;
				state.focusHi = event.hi;
				return 0;
			case 'done':
				state.sorted.fill(1);
				state.mark = -1;
				state.focusLo = 0;
				state.focusHi = -1;
				return 0;
			case 'line':
				return 0;
		}
	},

	tally(event, counts) {
		if (event.type === 'compare') counts.comparisons += 1;
		else if (event.type === 'swap') counts.swaps += 1;
		else if (event.type === 'copy' || event.type === 'write') counts.writes += 1;
	}
};

/** Events that cost something. Race mode advances both lanes one of these per tick. */
export function isOperation(event: SortEvent): boolean {
	return (
		event.type === 'compare' ||
		event.type === 'swap' ||
		event.type === 'copy' ||
		event.type === 'write'
	);
}

function read(array: Int32Array, index: number): number {
	const value = array[index];
	if (value === undefined) {
		throw new RangeError(`index ${index} is outside an array of length ${array.length}`);
	}
	return value;
}

function exchange(array: Int32Array, i: number, j: number): void {
	const held = read(array, i);
	array[i] = read(array, j);
	array[j] = held;
}
