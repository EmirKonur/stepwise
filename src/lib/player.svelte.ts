import { prefersReducedMotion } from 'svelte/motion';

/** Steps per second for speed levels 1 to 9, which are also the number keys. */
export const SPEEDS = [1, 2, 4, 8, 15, 30, 60, 150, 400] as const;
const DEFAULT_SPEED = 5;

/**
 * Playback position over a timeline of `last + 1` frames. Advances on
 * requestAnimationFrame with a fractional carry, so 400 steps per second at
 * 60 fps moves 6 or 7 steps per frame rather than drifting.
 */
export class Player {
	step = $state(0);
	playing = $state(false);
	speed = $state(DEFAULT_SPEED);
	readonly #last: () => number;
	#raf = 0;
	#previous = 0;
	#carry = 0;

	constructor(last: () => number, start = 0) {
		this.#last = last;
		this.step = Math.max(0, Math.min(start, last()));
	}

	get last(): number {
		return this.#last();
	}

	get stepsPerSecond(): number {
		return SPEEDS[this.speed - 1] ?? 15;
	}

	/** How long a move should animate at this speed: most of a step, never longer than 220ms. */
	get transitionMs(): number {
		if (prefersReducedMotion.current) return 0;
		const perStep = 1000 / this.stepsPerSecond;
		return perStep < 20 ? 0 : Math.min(220, Math.round(perStep * 0.85));
	}

	play(): void {
		if (this.playing) return;
		if (this.step >= this.last) this.step = 0;
		this.playing = true;
		this.#previous = performance.now();
		this.#carry = 0;
		this.#raf = requestAnimationFrame(this.#tick);
	}

	pause(): void {
		this.playing = false;
		cancelAnimationFrame(this.#raf);
	}

	toggle(): void {
		if (this.playing) this.pause();
		else this.play();
	}

	seek(step: number): void {
		this.step = Math.max(0, Math.min(this.last, Math.round(step)));
	}

	stepBy(delta: number): void {
		this.pause();
		this.seek(this.step + delta);
	}

	/** Stops and rewinds, for when the timeline underneath is replaced. */
	reset(step = 0): void {
		this.pause();
		this.seek(step);
	}

	setSpeed(level: number): void {
		this.speed = Math.max(1, Math.min(SPEEDS.length, Math.round(level)));
	}

	destroy(): void {
		this.pause();
	}

	#tick = (now: number) => {
		if (!this.playing) return;
		// A backgrounded tab can deliver one huge delta; cap it so playback does not leap.
		const elapsed = Math.min(250, now - this.#previous);
		this.#previous = now;
		this.#carry += (elapsed / 1000) * this.stepsPerSecond;
		const whole = Math.floor(this.#carry);
		if (whole > 0) {
			this.#carry -= whole;
			this.step = Math.min(this.last, this.step + whole);
		}
		if (this.step >= this.last) {
			this.pause();
			return;
		}
		this.#raf = requestAnimationFrame(this.#tick);
	};
}
