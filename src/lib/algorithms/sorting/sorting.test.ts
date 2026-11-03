import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { replay } from '../../../test/replay.ts';
import { SORTS, arrayModel, arrayState, recordSort, type ArrayState } from './index.ts';

const anyArray = fc.array(fc.integer(), { maxLength: 48 });
/** Small value range so duplicates are common, which is where stability and partition bugs live. */
const tiedArray = fc.array(fc.integer({ min: 0, max: 5 }), { maxLength: 40 });
const ascending = (a: number, b: number) => a - b;

function inversions(values: readonly number[]): number {
	let count = 0;
	for (let i = 0; i < values.length; i++) {
		for (let j = i + 1; j < values.length; j++) if ((values[i] ?? 0) > (values[j] ?? 0)) count++;
	}
	return count;
}

/** Every element lives in exactly one place: an array slot or a buffer slot. */
function elementsConserved(state: ArrayState, input: readonly number[]): boolean {
	const held: number[] = [];
	const ids: number[] = [];
	state.ids.forEach((id, slot) => {
		if (id >= 0) {
			ids.push(id);
			held.push(state.values[slot] as number);
		}
	});
	state.bufferIds.forEach((id, slot) => {
		if (id >= 0) {
			ids.push(id);
			held.push(state.buffer[slot] as number);
		}
	});
	const sameIds = ids.toSorted(ascending).every((id, index) => id === index);
	return (
		ids.length === input.length &&
		sameIds &&
		held.toSorted(ascending).join() === input.toSorted(ascending).join()
	);
}

describe.each(SORTS.map((algorithm) => [algorithm.name, algorithm] as const))(
	'%s',
	(_, algorithm) => {
		it('ends with the input sorted, for arbitrary arrays', () => {
			fc.assert(
				fc.property(fc.oneof(anyArray, tiedArray), (input) => {
					const timeline = recordSort(algorithm, input);
					const final = timeline.seek(timeline.last);
					expect(Array.from(final.state.values)).toEqual(input.toSorted(ascending));
					expect(final.state.sorted.every((flag) => flag === 1)).toBe(true);
					expect(timeline.truncated).toBe(false);
				})
			);
		});

		it('records identical events on every run, and replay reproduces every frame', () => {
			fc.assert(
				fc.property(fc.oneof(anyArray, tiedArray), (input) => {
					const first = recordSort(algorithm, input, { checkpointEvery: 16 });
					const second = recordSort(algorithm, input, { checkpointEvery: 16 });
					expect(second.events).toEqual(first.events);
					for (let step = 0; step <= first.last; step++) {
						const expected = replay(arrayModel, arrayState(input), first.events, step);
						const frame = first.seek(step);
						expect(frame.state).toEqual(expected.state);
						expect(frame.counts).toEqual(expected.counts);
					}
				}),
				{ numRuns: 40 }
			);
		});

		it('never loses or duplicates an element mid-run', () => {
			fc.assert(
				fc.property(tiedArray, (input) => {
					const timeline = recordSort(algorithm, input);
					for (let step = 0; step <= timeline.last; step++) {
						expect(elementsConserved(timeline.seek(step).state, input)).toBe(true);
					}
				}),
				{ numRuns: 30 }
			);
		});

		it('only references lines that exist in its listing', () => {
			const timeline = recordSort(algorithm, [5, 1, 4, 2, 8, 2, 9, 0, 3, 7]);
			for (const event of timeline.events) {
				expect(event.line).toBeGreaterThanOrEqual(0);
				expect(event.line).toBeLessThanOrEqual(algorithm.code.length);
				if (event.line > 0) expect(algorithm.code[event.line - 1]?.trim()).not.toBe('');
			}
		});

		if (algorithm.stable) {
			it('keeps equal values in their original order', () => {
				fc.assert(
					fc.property(tiedArray, (input) => {
						const { state } = recordSort(algorithm, input).seek(Number.POSITIVE_INFINITY);
						for (let slot = 1; slot < state.values.length; slot++) {
							if (state.values[slot] === state.values[slot - 1]) {
								expect(state.ids[slot]).toBeGreaterThan(state.ids[slot - 1] as number);
							}
						}
					})
				);
			});
		}
	}
);

describe('operation counts', () => {
	const byId = (id: string) => {
		const algorithm = SORTS.find((candidate) => candidate.id === id);
		if (!algorithm) throw new Error(`no algorithm ${id}`);
		return algorithm;
	};
	const finalCounts = (id: string, input: readonly number[]) => {
		const timeline = recordSort(byId(id), input);
		return timeline.seek(timeline.last).counts;
	};

	it('bubble and insertion sort swap exactly once per inversion', () => {
		fc.assert(
			fc.property(tiedArray, (input) => {
				expect(finalCounts('bubble', input).swaps).toBe(inversions(input));
				expect(finalCounts('insertion', input).swaps).toBe(inversions(input));
			})
		);
	});

	it('selection sort always compares n(n - 1)/2 times and swaps at most n - 1 times', () => {
		fc.assert(
			fc.property(anyArray, (input) => {
				const n = input.length;
				const counts = finalCounts('selection', input);
				expect(counts.comparisons).toBe((n * Math.max(0, n - 1)) / 2);
				expect(counts.swaps).toBeLessThanOrEqual(Math.max(0, n - 1));
			})
		);
	});

	it('merge sort stays within n ceil(log2 n) comparisons and writes each element twice per level', () => {
		fc.assert(
			fc.property(anyArray, (input) => {
				const n = input.length;
				const levels = n > 1 ? Math.ceil(Math.log2(n)) : 0;
				const counts = finalCounts('merge', input);
				expect(counts.comparisons).toBeLessThanOrEqual(n * levels);
				expect(counts.writes).toBeLessThanOrEqual(2 * n * levels);
				expect(counts.swaps).toBe(0);
			})
		);
	});

	it('Lomuto quicksort degrades to n(n - 1)/2 comparisons on sorted input', () => {
		const sorted = Array.from({ length: 30 }, (_, index) => index);
		expect(finalCounts('quick', sorted).comparisons).toBe((30 * 29) / 2);
	});
});
