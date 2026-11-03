/**
 * Every trace event carries the code-panel line it belongs to (1-based).
 * Line 0 means "between lines", which the code panel renders as idle.
 */
export interface TraceEvent {
	readonly type: string;
	readonly line: number;
}

/**
 * An algorithm run. The value sent back into each `yield` is whatever the
 * model's `apply` returned for that event, which is how a comparison sort
 * learns the outcome of a `compare` without ever holding the array itself.
 */
export type Program<E extends TraceEvent, R> = Generator<E, void, R>;

/**
 * The domain half of the engine: how one kind of state reacts to its events.
 *
 * `apply` mutates in place. The timeline only ever hands it states it owns
 * exclusively, so in-place updates are safe and keep replay allocation-free.
 * It must be deterministic: same state and event in, same state and result out.
 */
export interface Model<S, E extends TraceEvent, K extends string, R = void> {
	/** Counter names, in display order. */
	readonly counters: readonly K[];
	clone(state: S): S;
	apply(state: S, event: E): R;
	/** Advances whichever counters this event costs. */
	tally(event: E, counts: Record<K, number>): void;
}

/** One materialized moment of a run. Frames are fresh copies; mutating one cannot corrupt the timeline. */
export interface Frame<S, E extends TraceEvent, K extends string> {
	/** 0 is the input before any event; step n is the state after event n. */
	readonly step: number;
	/** The event that produced this frame, `undefined` for step 0. */
	readonly event: E | undefined;
	readonly line: number;
	readonly counts: Readonly<Record<K, number>>;
	readonly state: S;
}
