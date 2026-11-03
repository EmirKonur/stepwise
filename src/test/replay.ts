import type { Model, TraceEvent } from '../lib/engine/index.ts';

/**
 * The obviously-correct way to get frame `step`: start from the input and
 * apply events one by one. Tests compare the timeline's seek against this.
 */
export function replay<S, E extends TraceEvent, K extends string, R>(
	model: Model<S, E, K, R>,
	initial: S,
	events: readonly E[],
	step: number
): { state: S; counts: Record<K, number> } {
	const state = model.clone(initial);
	const counts = Object.fromEntries(model.counters.map((key) => [key, 0])) as Record<K, number>;
	for (const event of events.slice(0, step)) {
		model.apply(state, event);
		model.tally(event, counts);
	}
	return { state, counts };
}
