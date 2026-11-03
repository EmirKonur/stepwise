import type { Frame, Model, Program, TraceEvent } from './trace.ts';

export interface RecordOptions {
	/**
	 * Keep a full state snapshot every this many events. Seeking replays at most
	 * this many events from the nearest snapshot. See docs/adr/0002.
	 */
	readonly checkpointEvery?: number;
	/** Hard stop for runaway inputs. The timeline is marked `truncated` when hit. */
	readonly maxEvents?: number;
}

export const DEFAULT_CHECKPOINT_EVERY = 64;
export const DEFAULT_MAX_EVENTS = 250_000;

interface Snapshot<S, K extends string> {
	step: number;
	counts: Record<K, number>;
	state: S;
}

/**
 * A recorded run: the event log plus periodic snapshots. Any step can be
 * materialized on demand with {@link Timeline.seek}; nothing else is stored.
 */
export class Timeline<S, E extends TraceEvent, K extends string, R = void> {
	readonly events: readonly E[];
	readonly truncated: boolean;
	readonly interval: number;
	readonly #model: Model<S, E, K, R>;
	readonly #checkpoints: readonly Snapshot<S, K>[];
	#cursor: Snapshot<S, K>;

	constructor(
		model: Model<S, E, K, R>,
		events: readonly E[],
		checkpoints: readonly Snapshot<S, K>[],
		interval: number,
		truncated: boolean
	) {
		const first = checkpoints[0];
		if (!first) throw new Error('a timeline needs the initial snapshot');
		this.#model = model;
		this.events = events;
		this.#checkpoints = checkpoints;
		this.interval = interval;
		this.truncated = truncated;
		this.#cursor = copy(model, first);
	}

	/** Index of the final frame. Frames run from 0 to `last` inclusive. */
	get last(): number {
		return this.events.length;
	}

	get counters(): readonly K[] {
		return this.#model.counters;
	}

	/**
	 * Materializes the frame at `step` (clamped into range). Moving forward from
	 * the previous seek replays only the gap, so playback costs one event per
	 * step; any other jump restarts from the nearest checkpoint at or before it.
	 */
	seek(step: number): Frame<S, E, K> {
		const target = Number.isFinite(step) ? Math.max(0, Math.min(this.last, Math.trunc(step))) : 0;
		const nearest = Math.floor(target / this.interval);
		let cursor = this.#cursor;
		if (target < cursor.step || nearest * this.interval > cursor.step) {
			const checkpoint = this.#checkpoints[nearest];
			if (!checkpoint) throw new Error(`missing checkpoint ${nearest}`);
			cursor = copy(this.#model, checkpoint);
		}
		while (cursor.step < target) {
			advance(this.#model, cursor, this.events[cursor.step] as E);
		}
		this.#cursor = cursor;
		const event = this.events[target - 1];
		return {
			step: target,
			event,
			line: event?.line ?? 0,
			counts: { ...cursor.counts },
			state: this.#model.clone(cursor.state)
		};
	}

	/** Frame indices whose producing event passes `test`, for timeline markers. */
	stepsWhere(test: (event: E) => boolean): number[] {
		const steps: number[] = [];
		this.events.forEach((event, index) => {
			if (test(event)) steps.push(index + 1);
		});
		return steps;
	}
}

/**
 * Runs `program` to completion against a private copy of `initial` and returns
 * the timeline. The program receives that live state so algorithms that need
 * to read structure (tree pointers, for example) see every event applied before
 * they resume; they can only change it by yielding events.
 */
export function record<S, E extends TraceEvent, K extends string, R>(
	model: Model<S, E, K, R>,
	initial: S,
	program: (live: S) => Program<E, R>,
	options: RecordOptions = {}
): Timeline<S, E, K, R> {
	const interval = options.checkpointEvery ?? DEFAULT_CHECKPOINT_EVERY;
	const maxEvents = options.maxEvents ?? DEFAULT_MAX_EVENTS;
	if (!Number.isInteger(interval) || interval < 1) {
		throw new RangeError(`checkpointEvery must be a positive integer (got ${interval})`);
	}

	const live: Snapshot<S, K> = {
		step: 0,
		counts: zeroCounts(model.counters),
		state: model.clone(initial)
	};
	const checkpoints = [copy(model, live)];
	const events: E[] = [];
	const run = program(live.state);
	let truncated = false;
	// The first `next` argument is discarded by generators, so its value is irrelevant.
	let reply = undefined as R;

	for (;;) {
		const result = run.next(reply);
		if (result.done) break;
		if (events.length === maxEvents) {
			truncated = true;
			run.return();
			break;
		}
		events.push(result.value);
		reply = advance(model, live, result.value);
		if (live.step % interval === 0) checkpoints.push(copy(model, live));
	}

	return new Timeline(model, events, checkpoints, interval, truncated);
}

function advance<S, E extends TraceEvent, K extends string, R>(
	model: Model<S, E, K, R>,
	snapshot: Snapshot<S, K>,
	event: E
): R {
	const result = model.apply(snapshot.state, event);
	model.tally(event, snapshot.counts);
	snapshot.step += 1;
	return result;
}

function copy<S, E extends TraceEvent, K extends string, R>(
	model: Model<S, E, K, R>,
	snapshot: Snapshot<S, K>
): Snapshot<S, K> {
	return {
		step: snapshot.step,
		counts: { ...snapshot.counts },
		state: model.clone(snapshot.state)
	};
}

function zeroCounts<K extends string>(keys: readonly K[]): Record<K, number> {
	return Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
}
