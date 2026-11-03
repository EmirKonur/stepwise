import type { SortAlgorithm } from './algorithm.ts';
import type { SortProgram } from './model.ts';

export const merge: SortAlgorithm = {
	id: 'merge',
	name: 'Merge sort',
	summary:
		'Sorts each half recursively, then merges the halves through a buffer. Guaranteed n log n comparisons at the cost of n extra slots; ties keep their order.',
	complexity: { best: 'n log n', average: 'n log n', worst: 'n log n', space: 'n' },
	stable: true,
	markRole: null,
	usesBuffer: true,
	code: [
		'sort(lo, hi):',
		'  if lo >= hi: return',
		'  mid = floor((lo + hi) / 2)',
		'  sort(lo, mid); sort(mid + 1, hi)',
		'  copy a[lo..hi] into b',
		'  i = lo; j = mid + 1',
		'  for k = lo to hi',
		'    if j > hi or (i <= mid and b[i] <= b[j])',
		'      a[k] = b[i]; i = i + 1',
		'    else',
		'      a[k] = b[j]; j = j + 1'
	],
	run(n) {
		return sort(0, n - 1);
	}
};

function* sort(lo: number, hi: number): SortProgram {
	yield { type: 'focus', lo, hi, line: 1 };
	if (lo >= hi) {
		yield { type: 'line', line: 2 };
		return;
	}
	const mid = Math.floor((lo + hi) / 2);
	yield { type: 'line', line: 3 };
	yield { type: 'line', line: 4 };
	yield* sort(lo, mid);
	yield* sort(mid + 1, hi);

	yield { type: 'focus', lo, hi, line: 5 };
	for (let k = lo; k <= hi; k++) yield { type: 'copy', i: k, line: 5 };
	yield { type: 'line', line: 6 };
	let i = lo;
	let j = mid + 1;
	for (let k = lo; k <= hi; k++) {
		const takeLeft =
			j > hi || (i <= mid && (yield { type: 'compare', i, j, buffer: true, line: 8 }) <= 0);
		if (takeLeft) {
			yield { type: 'write', i: k, from: i, line: 9 };
			i += 1;
		} else {
			yield { type: 'line', line: 10 };
			yield { type: 'write', i: k, from: j, line: 11 };
			j += 1;
		}
	}
}
