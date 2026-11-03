import type { SortFrame } from '../algorithms/sorting/index.ts';

export type BarTone = 'idle' | 'compare' | 'move' | 'mark';

export interface BarLayout {
	readonly width: number;
	readonly height: number;
	/** Reserve a lower band for the merge buffer. */
	readonly buffer: boolean;
}

export interface Rect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

/** `y` is the baseline of the bar's row; the bar extends `height` above it. */
export interface Bar extends Rect {
	/** Element identity, stable across frames, so moves animate. */
	readonly id: number;
	readonly value: number;
	readonly tone: BarTone;
	readonly inBuffer: boolean;
}

export interface BarScene {
	/** Indexed by element id, so keyed DOM nodes never reorder. */
	readonly bars: readonly Bar[];
	/** Array slots whose element is out in the buffer. */
	readonly holes: readonly Rect[];
	/** One square per element already in its final slot. */
	readonly settled: readonly Rect[];
	/** The active subarray, drawn as a tint plus a rule under the bars. */
	readonly focus: Rect | null;
	readonly baseline: number;
	readonly bufferBaseline: number | null;
	/** Value labels only when bars are wide enough to hold them. */
	readonly labels: boolean;
}

const SQUARE = 6;
const GAP = 6;
const LABEL_SPACE = 18;
const MIN_BAR = 3;

/**
 * Pure: the same frame and layout always give the same scene. Heights scale
 * to the largest value present so a bar keeps its height while it travels
 * between the array and the buffer.
 */
export function barScene(frame: SortFrame, layout: BarLayout): BarScene {
	const { values, ids, buffer, bufferIds, sorted, mark, focusLo, focusHi } = frame.state;
	const n = values.length;
	const slot = n > 0 ? layout.width / n : layout.width;
	const gap = slot >= 10 ? Math.max(2, slot * 0.18) : 1;
	const barWidth = Math.max(1, slot - gap);
	const labels = slot >= 22;

	const footer = GAP + SQUARE + GAP;
	const usable = layout.height - footer;
	const baseline = layout.buffer ? Math.round(usable * 0.6) : usable;
	const arrayBand = baseline - (labels ? LABEL_SPACE : 0);
	const bufferBaseline = layout.buffer ? layout.height - 2 : null;
	const bufferBand = bufferBaseline === null ? 0 : bufferBaseline - (baseline + footer + 2 * GAP);

	let max = 1;
	for (let i = 0; i < n; i++) {
		max = Math.max(max, values[i] as number);
		if ((bufferIds[i] as number) >= 0) max = Math.max(max, buffer[i] as number);
	}
	const heightFor = (value: number, band: number) =>
		Math.max(MIN_BAR, (Math.max(0, value) / max) * band);

	const event = frame.event;
	const toneAt = (index: number, inBuffer: boolean): BarTone => {
		switch (event?.type) {
			case 'compare':
				if (Boolean(event.buffer) === inBuffer && (event.i === index || event.j === index))
					return 'compare';
				break;
			case 'swap':
				if (!inBuffer && (event.i === index || event.j === index)) return 'move';
				break;
			case 'copy':
				if (inBuffer && event.i === index) return 'move';
				break;
			case 'write':
				if (!inBuffer && event.i === index) return 'move';
				break;
		}
		return !inBuffer && index === mark ? 'mark' : 'idle';
	};

	const bars: Bar[] = new Array<Bar>(n);
	const holes: Rect[] = [];
	const settled: Rect[] = [];
	for (let i = 0; i < n; i++) {
		const x = i * slot + gap / 2;
		const id = ids[i] as number;
		if (id >= 0) {
			const value = values[i] as number;
			const height = heightFor(value, arrayBand);
			bars[id] = {
				id,
				value,
				x,
				y: baseline,
				width: barWidth,
				height,
				tone: toneAt(i, false),
				inBuffer: false
			};
		} else {
			holes.push({ x, y: baseline - MIN_BAR, width: barWidth, height: MIN_BAR });
		}
		const bufferId = bufferIds[i] as number;
		if (bufferId >= 0 && bufferBaseline !== null) {
			const value = buffer[i] as number;
			const height = heightFor(value, bufferBand);
			bars[bufferId] = {
				id: bufferId,
				value,
				x,
				y: bufferBaseline,
				width: barWidth,
				height,
				tone: toneAt(i, true),
				inBuffer: true
			};
		}
		if (sorted[i]) {
			const size = Math.min(barWidth, SQUARE);
			settled.push({ x: x + (barWidth - size) / 2, y: baseline + GAP, width: size, height: size });
		}
	}

	const focus =
		focusLo <= focusHi && n > 0
			? { x: focusLo * slot, y: 0, width: (focusHi - focusLo + 1) * slot, height: baseline }
			: null;

	return { bars, holes, settled, focus, baseline, bufferBaseline, labels };
}
