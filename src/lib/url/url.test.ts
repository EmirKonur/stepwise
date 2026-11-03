import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { GRID_SIZES, OPEN, WALL, WEIGHT, type GridSize } from '../algorithms/pathfinding/index.ts';
import { INPUT_KINDS, MAX_SIZE, MIN_SIZE, SORTS } from '../algorithms/sorting/index.ts';
import { TREES, starterOps } from '../algorithms/trees/index.ts';
import { DEFAULT_SEED, inputValues } from './input.ts';
import { MAX_STEP, query } from './params.ts';
import { formatPath, parsePath, pathGrid, type PathParams } from './path.ts';
import { formatRace, parseRace } from './race.ts';
import { formatSort, parseSort, type SortParams } from './sort.ts';
import { formatTree, parseOps, parseTree } from './tree.ts';

const roundTrip = <T>(
	format: (value: T) => string,
	parse: (params: URLSearchParams) => T,
	value: T
) => parse(new URLSearchParams(format(value)));

const stepArb = fc.nat({ max: MAX_STEP });
const seedArb = fc.stringMatching(/^[a-z0-9]{1,12}$/);
const inputArb = fc.oneof(
	fc.record({
		input: fc.constantFrom(...INPUT_KINDS.filter((kind) => kind !== 'custom')),
		size: fc.integer({ min: MIN_SIZE, max: MAX_SIZE }),
		seed: seedArb,
		values: fc.constant(null)
	}),
	fc
		.array(fc.integer({ min: 0, max: 999 }), { minLength: 2, maxLength: MAX_SIZE })
		.map((values) => ({
			input: 'custom' as const,
			size: values.length,
			seed: DEFAULT_SEED,
			values
		}))
);
const sortIdArb = fc.constantFrom(...SORTS.map((algorithm) => algorithm.id));

describe('sort and race URLs', () => {
	it('round-trip every valid sort state', () => {
		fc.assert(
			fc.property(sortIdArb, inputArb, stepArb, (algo, input, step) => {
				const state: SortParams = { algo, ...input, step };
				expect(roundTrip(formatSort, parseSort, state)).toEqual(state);
			})
		);
	});

	it('round-trip every valid race state', () => {
		fc.assert(
			fc.property(sortIdArb, sortIdArb, inputArb, stepArb, (a, b, input, tick) => {
				const state = { a, b, ...input, tick };
				expect(roundTrip(formatRace, parseRace, state)).toEqual(state);
			})
		);
	});

	it('keeps custom values readable in the link', () => {
		expect(
			formatSort({
				algo: 'merge',
				input: 'custom',
				size: 3,
				seed: '1919',
				values: [5, 3, 8],
				step: 4
			})
		).toBe('algo=merge&input=custom&values=5,3,8&step=4');
	});

	it('falls back to defaults for junk instead of failing', () => {
		const state = parseSort(
			new URLSearchParams('algo=bogo&input=custom&values=1,x&n=9000&seed=NOPE!&step=-3')
		);
		expect(state).toEqual({
			algo: 'quick',
			input: 'random',
			size: 32,
			seed: DEFAULT_SEED,
			values: null,
			step: 0
		});
		expect(inputValues(state)).toHaveLength(32);
	});
});

describe('path URLs', () => {
	const sizes = Object.keys(GRID_SIZES) as GridSize[];
	const customArb = fc.constantFrom(...sizes).chain((size) => {
		const { cols, rows } = GRID_SIZES[size];
		const count = cols * rows;
		return fc
			.record({
				kinds: fc.array(fc.constantFrom(OPEN, WALL, WEIGHT), {
					minLength: count,
					maxLength: count
				}),
				start: fc.nat(count - 1),
				goal: fc.nat(count - 1)
			})
			.filter(({ start, goal }) => start !== goal)
			.map(({ kinds, start, goal }) => {
				const cells = Uint8Array.from(kinds);
				cells[start] = OPEN;
				cells[goal] = OPEN;
				return { size, grid: { cols, rows, cells, start, goal } };
			});
	});

	it('round-trips hand-edited grids', () => {
		fc.assert(
			fc.property(customArb, stepArb, ({ size, grid }, step) => {
				const state: PathParams = {
					algo: 'astar',
					heuristic: 'euclidean',
					size,
					layout: 'scatter',
					seed: DEFAULT_SEED,
					custom: grid,
					step
				};
				expect(roundTrip(formatPath, parsePath, state)).toEqual(state);
			}),
			{ numRuns: 50 }
		);
	});

	it('uses layout and seed until the grid is edited', () => {
		const state = parsePath(new URLSearchParams('algo=bfs&size=s&layout=maze&seed=abc'));
		expect(state.custom).toBeNull();
		expect(pathGrid(state).cols).toBe(GRID_SIZES.s.cols);
		expect(formatPath(state)).toBe('algo=bfs&size=s&layout=maze&seed=abc&step=0');
	});

	it('ignores a custom grid whose endpoints sit on walls', () => {
		const base = parsePath(new URLSearchParams(''));
		const grid = pathGrid(base);
		const cells = grid.cells.slice();
		cells[grid.start] = WALL;
		const link = formatPath({ ...base, custom: { ...grid, cells } });
		expect(parsePath(new URLSearchParams(link)).custom).toBeNull();
	});
});

describe('tree URLs', () => {
	const opArb = fc.record({
		kind: fc.constantFrom('insert' as const, 'search' as const, 'delete' as const),
		key: fc.integer({ min: 1, max: 99 })
	});

	it('round-trips any history, including an empty one', () => {
		fc.assert(
			fc.property(
				fc.constantFrom(...TREES.map((tree) => tree.id)),
				fc.array(opArb, { maxLength: 40 }),
				fc.option(stepArb, { nil: null }),
				(algo, ops, step) => {
					const state = { algo, ops, step };
					expect(roundTrip(formatTree, parseTree, state)).toEqual(state);
				}
			)
		);
	});

	it('opens on the starter tree at its last step when nothing is specified', () => {
		expect(parseTree(new URLSearchParams(''))).toEqual({
			algo: 'avl',
			ops: starterOps(DEFAULT_SEED),
			step: null
		});
	});

	it('drops malformed operations but keeps the rest', () => {
		expect(parseOps('i5,x9,d100,s0,d7,i')).toEqual([
			{ kind: 'insert', key: 5 },
			{ kind: 'delete', key: 7 }
		]);
	});
});

describe('query', () => {
	it('skips empty values and escapes everything except commas', () => {
		expect(query({ a: 'x y', b: null, c: '', d: 0, e: '1,2' })).toBe('a=x%20y&d=0&e=1,2');
	});
});
