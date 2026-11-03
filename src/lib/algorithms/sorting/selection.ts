import type { SortAlgorithm } from './algorithm.ts';

export const selection: SortAlgorithm = {
	id: 'selection',
	name: 'Selection sort',
	summary:
		'Scans the unsorted suffix for its minimum and swaps it into place. Always n(n - 1)/2 comparisons regardless of input, but never more than n - 1 swaps.',
	complexity: { best: 'n²', average: 'n²', worst: 'n²', space: '1' },
	stable: false,
	markRole: 'the smallest so far',
	usesBuffer: false,
	code: [
		'for i = 0 to n - 2',
		'  min = i',
		'  for j = i + 1 to n - 1',
		'    if a[j] < a[min]',
		'      min = j',
		'  if min != i: swap(a[i], a[min])',
		'  // a[i] is in place'
	],
	*run(n) {
		for (let i = 0; i < n - 1; i++) {
			yield { type: 'focus', lo: i, hi: n - 1, line: 1 };
			let min = i;
			yield { type: 'mark', i: min, line: 2 };
			yield { type: 'line', line: 3 };
			for (let j = i + 1; j < n; j++) {
				if ((yield { type: 'compare', i: j, j: min, line: 4 }) < 0) {
					min = j;
					yield { type: 'mark', i: min, line: 5 };
				}
			}
			if (min !== i) yield { type: 'swap', i, j: min, line: 6 };
			else yield { type: 'line', line: 6 };
			yield { type: 'sorted', lo: i, hi: i, line: 7 };
		}
	}
};
