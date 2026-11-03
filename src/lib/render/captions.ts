import { coords, type Grid, type SearchFrame } from '../algorithms/pathfinding/index.ts';
import type { SortAlgorithm, SortFrame } from '../algorithms/sorting/index.ts';
import type { TreeFrame } from '../algorithms/trees/index.ts';

/** Plain-language captions for the "Now" line under the code panel. */

function codeLine(code: readonly string[], line: number): string {
	return (code[line - 1] ?? '').trim();
}

export function sortCaption(frame: SortFrame, algorithm: SortAlgorithm): string {
	const { event, state } = frame;
	if (!event) return `Ready: ${state.values.length} values. Press play or step forward.`;
	const a = (i: number) => `a[${i}] = ${state.values[i]}`;
	switch (event.type) {
		case 'compare': {
			if (event.buffer) {
				return `Compare b[${event.i}] = ${state.buffer[event.i]} with b[${event.j}] = ${state.buffer[event.j]}.`;
			}
			const x = state.values[event.i] as number;
			const y = state.values[event.j] as number;
			const relation = x < y ? 'less than' : x > y ? 'greater than' : 'equal to';
			return `Compare ${a(event.i)} with ${a(event.j)}: ${relation}.`;
		}
		case 'swap':
			return event.i === event.j
				? `Swap a[${event.i}] with itself (the scheme always swaps).`
				: `Swap a[${event.i}] and a[${event.j}].`;
		case 'copy':
			return `Copy a[${event.i}] = ${state.buffer[event.i]} into the buffer.`;
		case 'write':
			return `Write b[${event.from}] back to a[${event.i}] = ${state.values[event.i]}.`;
		case 'mark':
			return event.i < 0
				? 'Release the marked value.'
				: `Hold ${a(event.i)} as ${algorithm.markRole ?? 'the marked value'}.`;
		case 'sorted':
			return event.lo === event.hi
				? `${a(event.lo)} is in its final place.`
				: `a[${event.lo}..${event.hi}] are in their final places.`;
		case 'focus':
			return event.lo > event.hi ? 'Nothing to do here.' : `Work on a[${event.lo}..${event.hi}].`;
		case 'done':
			return `Sorted. ${frame.counts.comparisons.toLocaleString('en-US')} comparisons in ${frame.step.toLocaleString('en-US')} steps.`;
		case 'line':
			return codeLine(algorithm.code, event.line);
	}
}

export function cellName(grid: Grid, cell: number): string {
	const { col, row } = coords(grid, cell);
	return `(${col}, ${row})`;
}

export function searchCaption(frame: SearchFrame, grid: Grid, code: readonly string[]): string {
	const { event, state } = frame;
	if (!event) return 'Ready. Draw walls and weights, drag the start or goal, then press play.';
	switch (event.type) {
		case 'enqueue':
			return event.from === -1
				? `Start at ${cellName(grid, event.cell)}.`
				: `Add ${cellName(grid, event.cell)} to the frontier, ${event.cost} moves from the start.`;
		case 'relax':
			return event.from === -1
				? `Start at ${cellName(grid, event.cell)} with cost 0.`
				: `Reach ${cellName(grid, event.cell)} for ${event.cost} via ${cellName(grid, event.from)}.`;
		case 'visit':
			return `Expand ${cellName(grid, event.cell)}. Frontier holds ${state.frontier}.`;
		case 'path':
			return `Walk back through ${cellName(grid, event.cell)}.`;
		case 'done':
			return event.found
				? `Path found: ${state.path.length - 1} moves, cost ${event.cost}.`
				: 'No path. The goal is walled off.';
		case 'line':
			return codeLine(code, event.line);
	}
}

export function treeCaption(frame: TreeFrame, code: readonly string[]): string {
	const { event, state } = frame;
	if (!event) return 'Empty tree. Add a key to begin.';
	const key = (node: number) => state.key[node];
	switch (event.type) {
		case 'begin': {
			const verb = { insert: 'Insert', search: 'Search for', delete: 'Delete' }[event.op.kind];
			return `${verb} ${event.op.key}.`;
		}
		case 'visit':
			return `At node ${key(event.node)}.`;
		case 'compare': {
			const probe = state.op?.key ?? 0;
			const here = key(event.node) as number;
			if (probe === here) return `${probe} equals ${here}.`;
			return probe < here ? `${probe} < ${here}: go left.` : `${probe} > ${here}: go right.`;
		}
		case 'attach':
			return event.parent === -1
				? `${event.key} becomes the root.`
				: `Hang ${event.key} as the ${event.side} child of ${key(event.parent)}.`;
		case 'link': {
			const what = event.child === -1 ? 'nothing' : String(key(event.child));
			return event.parent === -1
				? `The root is now ${what}.`
				: `${key(event.parent)}.${event.side} now points to ${what}.`;
		}
		case 'copy':
			return `Copy the successor ${key(event.from)} into the node being deleted.`;
		case 'rotate':
			return `Rotate ${event.dir} around ${key(event.node)}.`;
		case 'result': {
			const probe = state.op?.key;
			switch (event.outcome) {
				case 'inserted':
					return `Inserted ${probe}.`;
				case 'duplicate':
					return `${probe} is already in the tree. Nothing changes.`;
				case 'found':
					return `Found ${probe}.`;
				case 'missing':
					return `${probe} is not in the tree.`;
				case 'deleted':
					return `Deleted ${probe}.`;
			}
			break;
		}
		case 'line':
			return codeLine(code, event.line);
	}
	return '';
}
