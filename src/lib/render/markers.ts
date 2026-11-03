import type { SearchTimeline } from '../algorithms/pathfinding/index.ts';
import type { SortTimeline } from '../algorithms/sorting/index.ts';
import type { TreeOpKind, TreeTimeline } from '../algorithms/trees/index.ts';

export type MarkerTone = 'ink' | 'red' | 'blue';

export interface Marker {
	readonly step: number;
	readonly tone: MarkerTone;
	readonly label: string;
}

/** Beyond this many ticks the scrubber turns into a grey smear, so keep an even sample. */
const MAX_MARKERS = 240;

function thin(markers: Marker[]): Marker[] {
	if (markers.length <= MAX_MARKERS) return markers;
	const every = Math.ceil(markers.length / MAX_MARKERS);
	return markers.filter((marker, index) => index % every === 0 || marker.tone === 'red');
}

/** Each pass, partition or merge starts a new focus range; those are the natural chapters. */
export function sortMarkers(timeline: SortTimeline): Marker[] {
	const markers: Marker[] = [];
	timeline.events.forEach((event, index) => {
		if (event.type === 'focus' && event.lo <= event.hi) {
			markers.push({ step: index + 1, tone: 'blue', label: `a[${event.lo}..${event.hi}]` });
		} else if (event.type === 'done') {
			markers.push({ step: index + 1, tone: 'red', label: 'Sorted' });
		}
	});
	return thin(markers);
}

export function searchMarkers(timeline: SearchTimeline): Marker[] {
	const markers: Marker[] = [];
	const reached = timeline.events.findIndex((event) => event.type === 'path');
	if (reached !== -1) markers.push({ step: reached + 1, tone: 'red', label: 'Goal reached' });
	const done = timeline.events.findIndex((event) => event.type === 'done');
	if (done !== -1 && reached === -1)
		markers.push({ step: done + 1, tone: 'red', label: 'No path' });
	return markers;
}

const VERBS: Record<TreeOpKind, string> = { insert: 'Insert', search: 'Search', delete: 'Delete' };

export function treeMarkers(timeline: TreeTimeline): Marker[] {
	const markers: Marker[] = [];
	timeline.events.forEach((event, index) => {
		if (event.type === 'begin') {
			markers.push({
				step: index + 1,
				tone: 'ink',
				label: `${VERBS[event.op.kind]} ${event.op.key}`
			});
		} else if (event.type === 'rotate') {
			markers.push({ step: index + 1, tone: 'red', label: `Rotate ${event.dir}` });
		}
	});
	return thin(markers);
}

/** Nearest marker strictly before or after `step`, for Shift+Arrow. */
export function adjacentMarker(
	markers: readonly Marker[],
	step: number,
	direction: -1 | 1
): number | null {
	if (direction > 0) return markers.find((marker) => marker.step > step)?.step ?? null;
	return markers.findLast((marker) => marker.step < step)?.step ?? null;
}
