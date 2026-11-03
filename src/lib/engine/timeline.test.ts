import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { replay } from '../../test/replay.ts';
import { record } from './timeline.ts';
import type { Model, Program } from './trace.ts';

type AddEvent = { readonly type: 'add'; readonly line: number; readonly amount: number };
interface Tally {
	total: number;
	history: number[];
}

/** Minimal model: a running total whose `apply` reply is the new total. */
const tallyModel: Model<Tally, AddEvent, 'adds', number> = {
	counters: ['adds'],
	clone: (state) => ({ total: state.total, history: [...state.history] }),
	apply(state, event) {
		state.total += event.amount;
		state.history.push(event.amount);
		return state.total;
	},
	tally(_event, counts) {
		counts.adds += 1;
	}
};

function* adding(amounts: readonly number[]): Program<AddEvent, number> {
	for (const [index, amount] of amounts.entries()) {
		yield { type: 'add', amount, line: (index % 3) + 1 };
	}
}

const initial = (): Tally => ({ total: 0, history: [] });

describe('record', () => {
	it('sends each apply result back into the generator', () => {
		const replies: number[] = [];
		function* echo(): Program<AddEvent, number> {
			for (const amount of [5, -2, 10]) {
				replies.push(yield { type: 'add', amount, line: 1 });
			}
		}
		record(tallyModel, initial(), echo);
		expect(replies).toEqual([5, 3, 13]);
	});

	it('does not mutate the initial state it was given', () => {
		const start = initial();
		record(tallyModel, start, () => adding([1, 2, 3]));
		expect(start).toEqual({ total: 0, history: [] });
	});

	it('stops at maxEvents and marks the timeline truncated', () => {
		function* forever(): Program<AddEvent, number> {
			for (;;) yield { type: 'add', amount: 1, line: 1 };
		}
		const timeline = record(tallyModel, initial(), forever, { maxEvents: 500 });
		expect(timeline.truncated).toBe(true);
		expect(timeline.last).toBe(500);
		expect(timeline.seek(timeline.last).state.total).toBe(500);
	});

	it('rejects a checkpoint interval that is not a positive integer', () => {
		expect(() => record(tallyModel, initial(), () => adding([1]), { checkpointEvery: 0 })).toThrow(
			RangeError
		);
	});
});

describe('Timeline.seek', () => {
	const amounts = fc.array(fc.integer({ min: -50, max: 50 }), { maxLength: 300 });

	it('equals stepwise replay for any sequence of seeks and any checkpoint interval', () => {
		fc.assert(
			fc.property(
				amounts,
				fc.integer({ min: 1, max: 40 }),
				fc.array(fc.nat(), { minLength: 1, maxLength: 30 }),
				(values, interval, seeks) => {
					const timeline = record(tallyModel, initial(), () => adding(values), {
						checkpointEvery: interval
					});
					for (const raw of seeks) {
						const step = raw % (timeline.last + 1);
						const frame = timeline.seek(step);
						const expected = replay(tallyModel, initial(), timeline.events, step);
						expect(frame.step).toBe(step);
						expect(frame.state).toEqual(expected.state);
						expect(frame.counts).toEqual(expected.counts);
						expect(frame.event).toBe(timeline.events[step - 1]);
						expect(frame.line).toBe(timeline.events[step - 1]?.line ?? 0);
					}
				}
			)
		);
	});

	it('clamps out-of-range and non-finite steps', () => {
		const timeline = record(tallyModel, initial(), () => adding([1, 2, 3]));
		expect(timeline.seek(-4).step).toBe(0);
		expect(timeline.seek(99).step).toBe(3);
		expect(timeline.seek(Number.NaN).step).toBe(0);
		expect(timeline.seek(1.9).step).toBe(1);
	});

	it('returns frames that are isolated from the timeline', () => {
		const timeline = record(tallyModel, initial(), () => adding([1, 2, 3, 4]), {
			checkpointEvery: 2
		});
		const frame = timeline.seek(2);
		frame.state.history.push(1000);
		frame.state.total = -1;
		expect(timeline.seek(3).state).toEqual({ total: 6, history: [1, 2, 3] });
		expect(timeline.seek(2).state).toEqual({ total: 3, history: [1, 2] });
	});

	it('lists marker steps with 1-based frame indices', () => {
		const timeline = record(tallyModel, initial(), () => adding([0, 5, 0, 7]));
		expect(timeline.stepsWhere((event) => event.amount > 0)).toEqual([2, 4]);
	});
});
