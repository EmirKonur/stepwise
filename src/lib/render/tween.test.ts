import { describe, expect, it } from 'vitest';
import { between, easeOut, positions } from './tween.ts';

describe('between', () => {
	const from = positions([
		{ id: 1, x: 0, y: 0 },
		{ id: 2, x: 10, y: 10 }
	]);
	const to = positions([
		{ id: 1, x: 100, y: 50 },
		{ id: 3, x: 7, y: 7 }
	]);

	it('starts at the old positions and ends at the new ones', () => {
		expect(between(from, to, 0).get(1)).toEqual({ x: 0, y: 0 });
		expect(between(from, to, 1).get(1)).toEqual({ x: 100, y: 50 });
	});

	it('places new ids at their destination and drops removed ones', () => {
		const halfway = between(from, to, 0.5);
		expect(halfway.get(3)).toEqual({ x: 7, y: 7 });
		expect(halfway.has(2)).toBe(false);
	});

	it('never overshoots', () => {
		for (let t = 0; t <= 1; t += 0.05) {
			expect(easeOut(t)).toBeGreaterThanOrEqual(0);
			expect(easeOut(t)).toBeLessThanOrEqual(1);
			if (t > 0) expect(easeOut(t)).toBeGreaterThanOrEqual(easeOut(t - 0.05));
		}
	});
});
