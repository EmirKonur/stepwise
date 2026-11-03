# 0001. Algorithms are generators that yield trace events

Status: accepted

## Context

Every visualizer in Stepwise needs the same things from an algorithm run: step forward and back, jump anywhere, highlight the executing line, count comparisons and writes, and describe the current moment in words. All of it has to be identical every time the run is replayed, because a shared link must reopen on the same frame.

We considered four ways to get that information out of an algorithm:

1. **Snapshots inside the algorithm.** The algorithm pushes a copy of its array after every interesting statement. Simple, but it couples algorithms to rendering, costs a full copy per step, and loses intent: a snapshot cannot say "this is the pivot" or "these two were compared".
2. **Instrumented data structures.** Hand the algorithm a proxied array that logs every read and write. Automatic, but it records reads nobody cares about, cannot express intent (focus ranges, "now in its final place"), and mapping a log entry to a source line needs stack inspection.
3. **A tracer object with callbacks** (`trace.compare(i, j)`). Workable, but the algorithm still owns the real array and must keep it in step with what it reports. Forgetting one call produces a visualization that silently disagrees with the code.
4. **Generator functions that yield typed events.** The algorithm is ordinary code; every observable action is a `yield` of a plain object such as `{ type: 'swap', i, j, line: 4 }`.

## Decision

Algorithms are generators yielding typed events, one discriminated union per domain (`SortEvent`, `SearchEvent`, `TreeEvent`). Every event carries the listing line it belongs to.

The value passed back into each `yield` is whatever the domain model's `apply` returned for that event. For sorting this is the sign of `a[i] - a[j]` for a `compare`, so a comparison sort is given only `n` and never holds the array at all:

```ts
const order = yield { type: 'compare', i: j - 1, j, line: 3 };
if (order <= 0) break;
yield { type: 'swap', i: j - 1, j, line: 4 };
```

Tree algorithms need to follow pointers, so they receive a read-only view of the live state, which the recorder updates before resuming the generator. They still change the tree only by yielding events. Pathfinding reads the static grid directly and keeps its own frontier, because the frontier's internal order is the algorithm, not the picture.

## Consequences

- An uncounted comparison is impossible for sorts: there is no other way to learn the order of two elements. The counters are correct by construction rather than by discipline.
- Algorithms stay short. Insertion sort is 30 lines including its listing and metadata; Shell sort, added last, is 42.
- The generator's reply type is one type per program (`number` for sorts and trees), so events that have no meaningful answer reply `0`. That is a small wart of TypeScript's `Generator<T, TReturn, TNext>`.
- Line numbers in events are written by hand. Tests check that every line is inside its listing and non-blank; they cannot check that it is the _right_ line, which is what the screenshots and the e2e test are for.
- The engine has no knowledge of any domain. Adding a fourth domain means a new event union, a `Model` and a renderer, with no changes to the recorder.
