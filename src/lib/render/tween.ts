export interface Point {
	readonly x: number;
	readonly y: number;
}

/** Decelerates into place with no overshoot, matching the CSS `--ease` curve's feel. */
export function easeOut(t: number): number {
	return 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;
}

/**
 * Positions part way from `from` to `to`. Ids missing from `from` (new nodes)
 * start at their destination; ids missing from `to` (removed nodes) are dropped.
 */
export function between(
	from: ReadonlyMap<number, Point>,
	to: ReadonlyMap<number, Point>,
	t: number
): Map<number, Point> {
	const k = easeOut(t);
	const result = new Map<number, Point>();
	for (const [id, end] of to) {
		const start = from.get(id) ?? end;
		result.set(id, { x: start.x + (end.x - start.x) * k, y: start.y + (end.y - start.y) * k });
	}
	return result;
}

export function positions(nodes: readonly (Point & { readonly id: number })[]): Map<number, Point> {
	return new Map(nodes.map((node) => [node.id, { x: node.x, y: node.y }]));
}
