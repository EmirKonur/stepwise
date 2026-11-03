import type { Frame, Model, Program } from '../../engine/index.ts';

export type SearchEvent =
	| { readonly type: 'line'; readonly line: number }
	/** BFS and DFS: `cell` joins the frontier, reached from `from` after `cost` moves. */
	| {
			readonly type: 'enqueue';
			readonly line: number;
			readonly cell: number;
			readonly from: number;
			readonly cost: number;
	  }
	/** Dijkstra and A*: a cheaper route to `cell` was found, and it is (re)pushed. */
	| {
			readonly type: 'relax';
			readonly line: number;
			readonly cell: number;
			readonly from: number;
			readonly cost: number;
	  }
	/** `cell` leaves the frontier and is expanded. */
	| { readonly type: 'visit'; readonly line: number; readonly cell: number }
	/** One cell of the answer, walked from the goal back to the start. */
	| { readonly type: 'path'; readonly line: number; readonly cell: number }
	| {
			readonly type: 'done';
			readonly line: number;
			readonly found: boolean;
			readonly cost: number;
	  };

export const UNSEEN = 0;
export const FRONTIER = 1;
export const VISITED = 2;

export interface SearchState {
	/** Per cell: UNSEEN, FRONTIER or VISITED. */
	status: Uint8Array;
	/** Best known cost per cell, -1 until reached. */
	cost: Int32Array;
	parent: Int32Array;
	/** Goal first, start last. */
	path: number[];
	current: number;
	frontier: number;
	outcome: 'searching' | 'found' | 'unreachable';
	/** Weighted cost of the final path, once `outcome` is `found`. */
	pathCost: number;
}

export type SearchCounter = 'visited' | 'pushes';
export type SearchProgram = Program<SearchEvent, void>;
export type SearchFrame = Frame<SearchState, SearchEvent, SearchCounter>;

export function searchState(cellCount: number): SearchState {
	return {
		status: new Uint8Array(cellCount),
		cost: new Int32Array(cellCount).fill(-1),
		parent: new Int32Array(cellCount).fill(-1),
		path: [],
		current: -1,
		frontier: 0,
		outcome: 'searching',
		pathCost: 0
	};
}

export const searchModel: Model<SearchState, SearchEvent, SearchCounter> = {
	counters: ['visited', 'pushes'],

	clone(state) {
		return {
			status: state.status.slice(),
			cost: state.cost.slice(),
			parent: state.parent.slice(),
			path: state.path.slice(),
			current: state.current,
			frontier: state.frontier,
			outcome: state.outcome,
			pathCost: state.pathCost
		};
	},

	apply(state, event) {
		switch (event.type) {
			case 'enqueue':
			case 'relax':
				if (state.status[event.cell] === UNSEEN) {
					state.status[event.cell] = FRONTIER;
					state.frontier += 1;
				}
				state.cost[event.cell] = event.cost;
				state.parent[event.cell] = event.from;
				break;
			case 'visit':
				if (state.status[event.cell] === FRONTIER) state.frontier -= 1;
				state.status[event.cell] = VISITED;
				state.current = event.cell;
				break;
			case 'path':
				state.path.push(event.cell);
				break;
			case 'done':
				state.outcome = event.found ? 'found' : 'unreachable';
				state.pathCost = event.cost;
				state.current = -1;
				break;
			case 'line':
				break;
		}
	},

	tally(event, counts) {
		if (event.type === 'visit') counts.visited += 1;
		else if (event.type === 'enqueue' || event.type === 'relax') counts.pushes += 1;
	}
};
