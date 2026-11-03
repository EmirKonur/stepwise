/**
 * Measures the two ways to store a recorded run (docs/adr/0002):
 *   full:  every frame cloned and kept, seek is an array lookup
 *   cp=K:  event log plus a snapshot every K events, seek replays up to K-1 events
 *
 * Run with `pnpm bench` (node --expose-gc, plain type stripping, no build step).
 */
import {
	findSearch,
	generateGrid,
	findHeuristic,
	recordSearch,
	searchModel,
	searchState
} from '../src/lib/algorithms/pathfinding/index.ts';
import {
	arrayModel,
	arrayState,
	findSort,
	generateInput,
	recordSort
} from '../src/lib/algorithms/sorting/index.ts';
import {
	TREES,
	emptyTree,
	recordTree,
	treeModel,
	type TreeOp
} from '../src/lib/algorithms/trees/index.ts';
import {
	seeded,
	integer,
	type Model,
	type Timeline,
	type TraceEvent
} from '../src/lib/engine/index.ts';

const gc = (globalThis as { gc?: () => void }).gc;
if (!gc) throw new Error('run with node --expose-gc');

interface Workload {
	name: string;
	record: (checkpointEvery: number) => Timeline<unknown, TraceEvent, string, unknown>;
	fullFrames: () => unknown[];
}

/** Median retained heap over three isolated builds; single readings jitter with GC timing. */
function retained(build: () => unknown): number {
	const readings: number[] = [];
	for (let run = 0; run < 3; run++) {
		gc!();
		gc!();
		const before = process.memoryUsage().heapUsed;
		const value = build();
		gc!();
		readings.push(process.memoryUsage().heapUsed - before);
		// Read the value after measuring so it cannot be collected before the reading.
		if (value === undefined) throw new Error('build returned nothing');
	}
	return readings.sort((a, b) => a - b)[1] as number;
}

/** The rejected design: keep a clone of every frame. */
function allFrames<S, E extends TraceEvent, K extends string, R>(
	model: Model<S, E, K, R>,
	initial: S,
	events: readonly E[]
): S[] {
	const state = model.clone(initial);
	const frames = [model.clone(state)];
	for (const event of events) {
		model.apply(state, event);
		frames.push(model.clone(state));
	}
	return frames;
}

function microsPer(count: number, run: () => void): number {
	const start = process.hrtime.bigint();
	run();
	return Number(process.hrtime.bigint() - start) / 1000 / count;
}

const sort = (id: string) => findSort(id)!;
const reversed = generateInput('reversed', 128, '1919');
const shuffled = generateInput('random', 128, '1919');
// Past the UI's 128 cap on purpose: shows how each design scales with n.
const reversed256 = Array.from({ length: 256 }, (_, index) => 256 - index);
const grid = generateGrid('scatter', 'l', '1919');
const astar = findSearch('astar')!;
const manhattan = findHeuristic('manhattan')!;
const random = seeded('bench');
const treeOps: TreeOp[] = Array.from({ length: 120 }, () => ({
	kind: random() < 0.65 ? 'insert' : 'delete',
	key: integer(random, 1, 60)
}));
const avl = TREES.find((tree) => tree.id === 'avl')!;

const workloads: Workload[] = [
	{
		name: 'Bubble sort, n=128 reversed',
		record: (k) => recordSort(sort('bubble'), reversed, { checkpointEvery: k }) as never,
		fullFrames: () =>
			allFrames(arrayModel, arrayState(reversed), recordSort(sort('bubble'), reversed).events)
	},
	{
		name: 'Bubble sort, n=256 reversed',
		record: (k) => recordSort(sort('bubble'), reversed256, { checkpointEvery: k }) as never,
		fullFrames: () =>
			allFrames(arrayModel, arrayState(reversed256), recordSort(sort('bubble'), reversed256).events)
	},
	{
		name: 'Merge sort, n=128 random',
		record: (k) => recordSort(sort('merge'), shuffled, { checkpointEvery: k }) as never,
		fullFrames: () =>
			allFrames(arrayModel, arrayState(shuffled), recordSort(sort('merge'), shuffled).events)
	},
	{
		name: 'A*, 45x27 scatter grid',
		record: (k) => recordSearch(astar, grid, manhattan, { checkpointEvery: k }) as never,
		fullFrames: () =>
			allFrames(
				searchModel,
				searchState(grid.cells.length),
				recordSearch(astar, grid, manhattan).events
			)
	},
	{
		name: 'AVL tree, 120 operations',
		record: (k) => recordTree(avl, treeOps, { checkpointEvery: k }) as never,
		fullFrames: () => allFrames(treeModel, emptyTree(), recordTree(avl, treeOps).events)
	}
];

const intervals = [16, 64, 256];
const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
const rows: string[] = [];

for (const workload of workloads) {
	const last = workload.record(64).last;
	const recordMs =
		microsPer(10, () => {
			for (let run = 0; run < 10; run++) workload.record(64);
		}) / 1000;
	const seeks = Array.from({ length: 2000 }, () => integer(random, 0, last));
	const lines: string[] = [];

	for (const k of intervals) {
		const bytes = retained(() => workload.record(k));
		const timeline = workload.record(k);
		const randomSeek = microsPer(seeks.length, () => {
			for (const step of seeks) timeline.seek(step);
		});
		timeline.seek(0);
		const count = Math.min(last, 5000);
		const stepping = microsPer(count, () => {
			for (let step = 1; step <= count; step++) timeline.seek(step);
		});
		lines.push(
			`| | | | cp=${k} | ${kb(bytes)} | ${randomSeek.toFixed(2)} | ${stepping.toFixed(2)} |`
		);
	}

	const fullBytes = retained(workload.fullFrames);
	const frames = workload.fullFrames();
	const fullSeek = microsPer(seeks.length, () => {
		for (const step of seeks) void frames[step];
	});
	rows.push(
		`| ${workload.name} | ${last.toLocaleString('en-US')} | ${recordMs.toFixed(2)} | full | ${kb(fullBytes)} | ${fullSeek.toFixed(2)} | - |`,
		...lines
	);
}

console.log(`node ${process.version}, ${process.platform} ${process.arch}`);
console.log(
	'| Workload | Events | Record, cp=64 (ms) | Storage | Retained heap | Random seek (us) | Step forward (us) |'
);
console.log('| --- | ---: | ---: | --- | ---: | ---: | ---: |');
for (const row of rows) console.log(row);
