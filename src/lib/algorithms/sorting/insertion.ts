import type { SortAlgorithm } from './algorithm.ts';

export const insertion: SortAlgorithm = {
	id: 'insertion',
	name: 'Insertion sort',
	summary:
		'Grows a sorted prefix by sliding each new element left until it fits. Every swap removes exactly one inversion, so nearly sorted input finishes in close to linear time.',
	complexity: { best: 'n', average: 'n²', worst: 'n²', space: '1' },
	stable: true,
	markRole: 'the value being inserted',
	usesBuffer: false,
	code: [
		'for i = 1 to n - 1',
		'  j = i',
		'  while j > 0 and a[j - 1] > a[j]',
		'    swap(a[j - 1], a[j])',
		'    j = j - 1'
	],
	*run(n) {
		for (let i = 1; i < n; i++) {
			yield { type: 'focus', lo: 0, hi: i, line: 1 };
			yield { type: 'mark', i, line: 2 };
			for (let j = i; j > 0; j--) {
				if ((yield { type: 'compare', i: j - 1, j, line: 3 }) <= 0) break;
				yield { type: 'swap', i: j - 1, j, line: 4 };
				yield { type: 'mark', i: j - 1, line: 5 };
			}
		}
	}
};
