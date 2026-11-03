import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { SEED_PATTERN, freshSeed, integer, seeded, shuffle } from './random.ts';

describe('seeded', () => {
	it('produces the same sequence for the same seed', () => {
		const a = seeded('k3x9');
		const b = seeded('k3x9');
		const draws = Array.from({ length: 8 }, () => [a(), b()]);
		for (const [x, y] of draws) expect(x).toBe(y);
	});

	it('produces different sequences for different seeds', () => {
		expect(seeded('a')()).not.toBe(seeded('b')());
	});

	it('stays inside [0, 1)', () => {
		fc.assert(
			fc.property(fc.string(), (seed) => {
				const next = seeded(seed);
				for (let i = 0; i < 50; i++) {
					const value = next();
					expect(value).toBeGreaterThanOrEqual(0);
					expect(value).toBeLessThan(1);
				}
			})
		);
	});
});

describe('integer and shuffle', () => {
	it('draws integers within inclusive bounds', () => {
		const next = seeded('bounds');
		const seen = new Set<number>();
		for (let i = 0; i < 500; i++) seen.add(integer(next, 3, 6));
		expect([...seen].sort()).toEqual([3, 4, 5, 6]);
	});

	it('shuffles into a permutation of the input', () => {
		fc.assert(
			fc.property(fc.array(fc.integer()), fc.string(), (items, seed) => {
				const shuffled = shuffle([...items], seeded(seed));
				expect(shuffled.toSorted((a, b) => a - b)).toEqual(items.toSorted((a, b) => a - b));
			})
		);
	});
});

describe('freshSeed', () => {
	it('matches the URL seed pattern', () => {
		for (let i = 0; i < 20; i++) expect(freshSeed()).toMatch(SEED_PATTERN);
	});
});
