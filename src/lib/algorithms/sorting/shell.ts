import type { SortAlgorithm } from './algorithm.ts';

/** Ciura's empirically tuned gaps, largest first. */
const GAPS = [701, 301, 132, 57, 23, 10, 4, 1];

export const shell: SortAlgorithm = {
	id: 'shell',
	name: 'Shell sort',
	summary:
		"Insertion sort over shrinking gaps (Ciura's sequence), so values far from home travel in long hops first and the final gap-1 pass has little left to do.",
	complexity: { best: 'n log n', average: 'gap dependent', worst: 'gap dependent', space: '1' },
	stable: false,
	markRole: 'the value being inserted',
	usesBuffer: false,
	code: [
		'for gap in [701, 301, 132, 57, 23, 10, 4, 1]',
		'  if gap >= n: continue',
		'  for i = gap to n - 1',
		'    j = i',
		'    while j >= gap and a[j - gap] > a[j]',
		'      swap(a[j - gap], a[j])',
		'      j = j - gap'
	],
	*run(n) {
		for (const gap of GAPS) {
			yield { type: 'line', line: 1 };
			if (gap >= n) {
				yield { type: 'line', line: 2 };
				continue;
			}
			for (let i = gap; i < n; i++) {
				yield { type: 'line', line: 3 };
				yield { type: 'mark', i, line: 4 };
				for (let j = i; j >= gap; j -= gap) {
					if ((yield { type: 'compare', i: j - gap, j, line: 5 }) <= 0) break;
					yield { type: 'swap', i: j - gap, j, line: 6 };
					yield { type: 'mark', i: j - gap, line: 7 };
				}
			}
		}
	}
};
