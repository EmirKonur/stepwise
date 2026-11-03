import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { MAX_SIZE, MIN_SIZE, generateInput, parseCustom, type GeneratedKind } from './inputs.ts';

const kinds: GeneratedKind[] = ['random', 'nearly', 'reversed', 'few'];
const size = fc.integer({ min: MIN_SIZE, max: MAX_SIZE });
const seed = fc.stringMatching(/^[a-z0-9]{1,8}$/);

function inversions(values: readonly number[]): number {
	let count = 0;
	for (let i = 0; i < values.length; i++) {
		for (let j = i + 1; j < values.length; j++) if ((values[i] ?? 0) > (values[j] ?? 0)) count++;
	}
	return count;
}

describe('generateInput', () => {
	it.each(kinds)('%s is deterministic for a seed and has the requested size', (kind) => {
		fc.assert(
			fc.property(size, seed, (n, s) => {
				const values = generateInput(kind, n, s);
				expect(values).toHaveLength(n);
				expect(generateInput(kind, n, s)).toEqual(values);
			})
		);
	});

	it('random, nearly sorted and reversed are permutations of 1..n', () => {
		fc.assert(
			fc.property(size, seed, (n, s) => {
				const staircase = Array.from({ length: n }, (_, index) => index + 1);
				for (const kind of ['random', 'nearly', 'reversed'] as const) {
					expect(generateInput(kind, n, s).toSorted((a, b) => a - b)).toEqual(staircase);
				}
			})
		);
	});

	it('reversed is strictly decreasing', () => {
		const values = generateInput('reversed', 20, 'x');
		expect(values.every((value, index) => index === 0 || value < (values[index - 1] ?? 0))).toBe(
			true
		);
	});

	it('nearly sorted has far fewer inversions than a shuffle', () => {
		fc.assert(
			fc.property(fc.integer({ min: 20, max: MAX_SIZE }), seed, (n, s) => {
				expect(inversions(generateInput('nearly', n, s))).toBeLessThanOrEqual(n);
			})
		);
	});

	it('few unique uses at most four distinct values', () => {
		fc.assert(
			fc.property(size, seed, (n, s) => {
				expect(new Set(generateInput('few', n, s)).size).toBeLessThanOrEqual(4);
			})
		);
	});

	it('clamps the size into the supported range', () => {
		expect(generateInput('random', 1, 'a')).toHaveLength(MIN_SIZE);
		expect(generateInput('random', 10_000, 'a')).toHaveLength(MAX_SIZE);
	});
});

describe('parseCustom', () => {
	it('accepts commas, spaces and newlines as separators', () => {
		expect(parseCustom('5, 3 8\n1,,2')).toEqual({ ok: true, values: [5, 3, 8, 1, 2] });
	});

	it.each([
		['', 'Enter at least 2 numbers.'],
		['7', 'Enter at least 2 numbers.'],
		['3, -1', '"-1" is not a whole number from 0 to 999.'],
		['3, 2.5', '"2.5" is not a whole number from 0 to 999.'],
		['3, 1000', '"1000" is not a whole number from 0 to 999.'],
		['3, x', '"x" is not a whole number from 0 to 999.']
	])('rejects %j', (text, error) => {
		expect(parseCustom(text)).toEqual({ ok: false, error });
	});

	it('rejects more values than the visualizer can draw', () => {
		const result = parseCustom(Array.from({ length: MAX_SIZE + 1 }, () => '1').join(','));
		expect(result.ok).toBe(false);
	});

	it('round-trips any valid list', () => {
		fc.assert(
			fc.property(
				fc.array(fc.integer({ min: 0, max: 999 }), { minLength: 2, maxLength: MAX_SIZE }),
				(values) => {
					expect(parseCustom(values.join(', '))).toEqual({ ok: true, values });
				}
			)
		);
	});
});
