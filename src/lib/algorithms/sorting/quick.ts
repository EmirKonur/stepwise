import type { SortAlgorithm } from './algorithm.ts';
import type { SortProgram } from './model.ts';

/**
 * Lomuto partition with the last element as pivot. Hoare's scheme does fewer
 * swaps, but Lomuto's single left-to-right scan is far easier to follow on
 * screen, and its weak spots (sorted and few-unique input) are worth seeing.
 */
export const quick: SortAlgorithm = {
	id: 'quick',
	name: 'Quicksort',
	summary:
		'Lomuto partition: the last element is the pivot, smaller values are swapped to the left, then each side is sorted recursively. Sorted or few-unique input degrades this scheme to n².',
	complexity: { best: 'n log n', average: 'n log n', worst: 'n²', space: 'log n' },
	stable: false,
	markRole: 'the pivot',
	usesBuffer: false,
	code: [
		'sort(lo, hi):',
		'  if lo >= hi: return',
		'  pivot = a[hi]',
		'  i = lo',
		'  for j = lo to hi - 1',
		'    if a[j] < pivot',
		'      swap(a[i], a[j]); i = i + 1',
		'  swap(a[i], a[hi])',
		'  // a[i] is in place',
		'  sort(lo, i - 1); sort(i + 1, hi)'
	],
	run(n) {
		return sort(0, n - 1);
	}
};

function* sort(lo: number, hi: number): SortProgram {
	yield { type: 'focus', lo, hi, line: 1 };
	if (lo >= hi) {
		if (lo === hi) yield { type: 'sorted', lo, hi, line: 2 };
		else yield { type: 'line', line: 2 };
		return;
	}
	yield { type: 'mark', i: hi, line: 3 };
	yield { type: 'line', line: 4 };
	let i = lo;
	for (let j = lo; j < hi; j++) {
		if ((yield { type: 'compare', i: j, j: hi, line: 6 }) < 0) {
			yield { type: 'swap', i, j, line: 7 };
			i += 1;
		}
	}
	yield { type: 'swap', i, j: hi, line: 8 };
	yield { type: 'mark', i: -1, line: 8 };
	yield { type: 'sorted', lo: i, hi: i, line: 9 };
	yield { type: 'line', line: 10 };
	yield* sort(lo, i - 1);
	yield* sort(i + 1, hi);
}
