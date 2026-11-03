import type { SortAlgorithm } from './algorithm.ts';

export const bubble: SortAlgorithm = {
	id: 'bubble',
	name: 'Bubble sort',
	summary:
		'Sweeps left to right swapping out-of-order neighbours. Each pass parks the largest remaining value at the end, and a pass without swaps ends the sort early.',
	complexity: { best: 'n', average: 'n²', worst: 'n²', space: '1' },
	stable: true,
	markRole: null,
	usesBuffer: false,
	code: [
		'for end = n - 1 down to 1',
		'  swapped = false',
		'  for i = 0 to end - 1',
		'    if a[i] > a[i + 1]',
		'      swap(a[i], a[i + 1])',
		'      swapped = true',
		'  // a[end] is in place',
		'  if not swapped: stop'
	],
	*run(n) {
		for (let end = n - 1; end > 0; end--) {
			yield { type: 'focus', lo: 0, hi: end, line: 1 };
			yield { type: 'line', line: 2 };
			yield { type: 'line', line: 3 };
			let swapped = false;
			for (let i = 0; i < end; i++) {
				if ((yield { type: 'compare', i, j: i + 1, line: 4 }) > 0) {
					yield { type: 'swap', i, j: i + 1, line: 5 };
					swapped = true;
				}
			}
			yield { type: 'sorted', lo: end, hi: end, line: 7 };
			if (!swapped) {
				yield { type: 'line', line: 8 };
				return;
			}
		}
	}
};
