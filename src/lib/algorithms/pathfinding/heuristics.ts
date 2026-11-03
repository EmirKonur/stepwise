import { coords, type Grid } from './grid.ts';

export interface Heuristic {
	readonly id: string;
	readonly name: string;
	/** True when the estimate never exceeds the real remaining cost, which keeps A* optimal. */
	readonly admissible: boolean;
	readonly note: string;
	estimate(grid: Grid, cell: number): number;
}

function delta(grid: Grid, cell: number): { dx: number; dy: number } {
	const a = coords(grid, cell);
	const b = coords(grid, grid.goal);
	return { dx: Math.abs(a.col - b.col), dy: Math.abs(a.row - b.row) };
}

/** Every move costs at least 1, so any distance measured in moves is a lower bound. */
export const HEURISTICS: readonly Heuristic[] = [
	{
		id: 'manhattan',
		name: 'Manhattan',
		admissible: true,
		note: 'Exact move count on an empty 4-way grid. The tightest admissible choice here.',
		estimate(grid, cell) {
			const { dx, dy } = delta(grid, cell);
			return dx + dy;
		}
	},
	{
		id: 'euclidean',
		name: 'Euclidean',
		admissible: true,
		note: 'Straight-line distance. Admissible but loose, so A* explores more.',
		estimate(grid, cell) {
			const { dx, dy } = delta(grid, cell);
			return Math.hypot(dx, dy);
		}
	},
	{
		id: 'chebyshev',
		name: 'Chebyshev',
		admissible: true,
		note: 'Max of the axis distances. Looser still on a grid without diagonal moves.',
		estimate(grid, cell) {
			const { dx, dy } = delta(grid, cell);
			return Math.max(dx, dy);
		}
	},
	{
		id: 'greedy',
		name: 'Manhattan x 3',
		admissible: false,
		note: 'Inadmissible. Rushes toward the goal and can return a costlier path.',
		estimate(grid, cell) {
			const { dx, dy } = delta(grid, cell);
			return 3 * (dx + dy);
		}
	}
];

export function findHeuristic(id: string | null): Heuristic | undefined {
	return HEURISTICS.find((heuristic) => heuristic.id === id);
}
