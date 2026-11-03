interface Entry {
	readonly cell: number;
	readonly priority: number;
	readonly tie: number;
	readonly order: number;
}

/**
 * Binary min-heap keyed by (priority, tie, insertion order). The explicit
 * insertion order makes equal-priority pops deterministic, which the
 * replay-equals-recording guarantee depends on.
 */
export class MinQueue {
	readonly #heap: Entry[] = [];
	#pushed = 0;

	get size(): number {
		return this.#heap.length;
	}

	push(cell: number, priority: number, tie = 0): void {
		this.#heap.push({ cell, priority, tie, order: this.#pushed++ });
		let i = this.#heap.length - 1;
		while (i > 0) {
			const up = (i - 1) >> 1;
			if (!this.#before(i, up)) break;
			this.#swap(i, up);
			i = up;
		}
	}

	/** Removes and returns the smallest cell, or -1 when empty. */
	pop(): number {
		const top = this.#heap[0];
		const tail = this.#heap.pop();
		if (!top || !tail) return -1;
		if (this.#heap.length > 0) {
			this.#heap[0] = tail;
			let i = 0;
			for (;;) {
				const left = 2 * i + 1;
				const right = left + 1;
				let best = i;
				if (left < this.#heap.length && this.#before(left, best)) best = left;
				if (right < this.#heap.length && this.#before(right, best)) best = right;
				if (best === i) break;
				this.#swap(i, best);
				i = best;
			}
		}
		return top.cell;
	}

	#before(a: number, b: number): boolean {
		const x = this.#heap[a] as Entry;
		const y = this.#heap[b] as Entry;
		if (x.priority !== y.priority) return x.priority < y.priority;
		if (x.tie !== y.tie) return x.tie < y.tie;
		return x.order < y.order;
	}

	#swap(a: number, b: number): void {
		const held = this.#heap[a] as Entry;
		this.#heap[a] = this.#heap[b] as Entry;
		this.#heap[b] = held;
	}
}
