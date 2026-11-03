import type { SortAlgorithm } from './algorithm.ts';
import type { SortProgram } from './model.ts';

export const heap: SortAlgorithm = {
	id: 'heap',
	name: 'Heapsort',
	summary:
		'Arranges the array into a max-heap in place, then repeatedly swaps the root to the end and sifts the new root down. n log n in every case with no extra memory.',
	complexity: { best: 'n log n', average: 'n log n', worst: 'n log n', space: '1' },
	stable: false,
	markRole: 'the value sifting down',
	usesBuffer: false,
	code: [
		'for i = floor(n / 2) - 1 down to 0',
		'  siftDown(i, n)',
		'for end = n - 1 down to 1',
		'  swap(a[0], a[end])',
		'  // a[end] is in place',
		'  siftDown(0, end)',
		'',
		'siftDown(i, size):',
		'  while 2i + 1 < size',
		'    c = 2i + 1',
		'    if c + 1 < size and a[c + 1] > a[c]: c = c + 1',
		'    if a[c] <= a[i]: return',
		'    swap(a[i], a[c]); i = c'
	],
	*run(n) {
		yield { type: 'focus', lo: 0, hi: n - 1, line: 1 };
		for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
			yield { type: 'line', line: 2 };
			yield* siftDown(i, n);
		}
		for (let end = n - 1; end > 0; end--) {
			yield { type: 'focus', lo: 0, hi: end, line: 3 };
			yield { type: 'swap', i: 0, j: end, line: 4 };
			yield { type: 'sorted', lo: end, hi: end, line: 5 };
			yield { type: 'line', line: 6 };
			yield* siftDown(0, end);
		}
	}
};

function* siftDown(start: number, size: number): SortProgram {
	let i = start;
	yield { type: 'mark', i, line: 8 };
	while (2 * i + 1 < size) {
		yield { type: 'line', line: 9 };
		let child = 2 * i + 1;
		yield { type: 'line', line: 10 };
		if (child + 1 < size && (yield { type: 'compare', i: child + 1, j: child, line: 11 }) > 0) {
			child += 1;
		}
		if ((yield { type: 'compare', i: child, j: i, line: 12 }) <= 0) break;
		yield { type: 'swap', i, j: child, line: 13 };
		i = child;
		yield { type: 'mark', i, line: 13 };
	}
	yield { type: 'mark', i: -1, line: 12 };
}
