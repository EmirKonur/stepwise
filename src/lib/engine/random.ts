/** A source of floats in [0, 1). */
export type Random = () => number;

/** Seeds appear in URLs, so they are short lowercase base-36 strings. */
export const SEED_PATTERN = /^[a-z0-9]{1,12}$/;

/**
 * mulberry32 seeded from an FNV-1a hash of the seed string. Small, fast, and
 * identical in every JS engine, which is what makes shared links reproducible.
 * Not suitable for anything security related.
 */
export function seeded(seed: string): Random {
	let state = fnv1a(seed);
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
	};
}

/** Uniform integer in [lo, hi], both inclusive. */
export function integer(random: Random, lo: number, hi: number): number {
	return lo + Math.floor(random() * (hi - lo + 1));
}

/** Fisher-Yates, in place. Returns the same array for chaining. */
export function shuffle<T>(items: T[], random: Random): T[] {
	for (let i = items.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		const held = items[i] as T;
		items[i] = items[j] as T;
		items[j] = held;
	}
	return items;
}

/** A new random seed for the "shuffle" buttons. */
export function freshSeed(): string {
	const [value = 0] = crypto.getRandomValues(new Uint32Array(1));
	return value.toString(36);
}

function fnv1a(text: string): number {
	let hash = 0x811c9dc5;
	for (let i = 0; i < text.length; i++) {
		hash ^= text.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return hash >>> 0;
}
