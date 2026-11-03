# 0002. Store runs as an event log with periodic checkpoints

Status: accepted

## Context

Scrubbing and stepping backward must feel instant, so any frame has to be available on demand. The obvious design is to keep every frame: clone the state after each event and index into the array. Seeking is then a lookup.

The cost is memory proportional to events times state size. For quadratic sorts that is cubic in `n`, and race mode keeps two runs alive at once.

## Decision

A `Timeline` stores the event log plus a full snapshot of the state every 64 events. `seek(i)` restores the nearest snapshot at or before `i` and replays at most 63 events. A cursor remembers the last position, so moving forward from the previous seek (normal playback) replays only the gap. Every returned frame is a fresh clone, so callers cannot corrupt the timeline by mutating what they render.

The interval was chosen by measurement. `pnpm bench` (`scripts/bench-timeline.ts`, run with `node --expose-gc`, Node 23.11 on an Apple M2 Pro) records each workload, compares retained heap for every frame kept against checkpoints at three intervals, and times 2,000 random seeks and 5,000 sequential steps. Heap figures are the median of three isolated builds.

| Workload                    | Events | Storage     | Retained heap | Random seek | Step forward |
| --------------------------- | -----: | ----------- | ------------: | ----------: | -----------: |
| Bubble sort, n=128 reversed | 16,765 | every frame |     17,983 KB |     0.07 us |              |
|                             |        | every 16    |      2,322 KB |     2.84 us |      1.61 us |
|                             |        | every 64    |      1,388 KB |     2.50 us |      1.08 us |
|                             |        | every 256   |      1,169 KB |     3.73 us |      0.96 us |
| Bubble sort, n=256 reversed | 66,301 | every frame |     71,063 KB |     0.07 us |              |
|                             |        | every 64    |      5,431 KB |     3.02 us |      1.53 us |
| Merge sort, n=128 random    |  3,870 | every frame |      4,132 KB |     0.03 us |              |
|                             |        | every 64    |        303 KB |     2.76 us |      0.95 us |
| A*, 45 x 27 scatter grid    |  1,124 | every frame |        808 KB |     0.02 us |              |
|                             |        | every 64    |         78 KB |     4.44 us |      1.47 us |
| AVL tree, 120 operations    |  2,230 | every frame |      2,105 KB |     0.02 us |              |
|                             |        | every 64    |        161 KB |     1.73 us |      0.19 us |

Every 64 events keeps 7 to 10 percent of the full-frame memory, and a random seek stays under 5 microseconds, well inside a 16 ms frame. Going from 64 to 256 saves only a further 15 to 20 percent of heap, because the event log itself starts to dominate, while random seeks get slower. Going from 64 to 16 nearly doubles memory with no measurable seek benefit, since cloning the output frame costs more than replaying the events.

## Consequences

- The largest run the UI can produce (bubble sort, n=128, reversed) holds about 1.4 MB instead of 18 MB. Doubling `n` to 256 would cost 5.4 MB instead of 71 MB, so raising the size cap later is cheap.
- Recording is a single pass that applies every event once. The same benchmark measures 2.3 ms to record that worst-case sort and 0.3 ms for A* on the largest grid, which is why the path page can afford to re-record on every painted cell.
- Seeking has a side effect (the cursor), so `seek` is not a pure function even though its result is. It is safe because the cursor is private and only ever moved by `seek` itself.
- `Model.apply` must be deterministic and must only mutate the state it is given. The property tests replay every recorded run from frame 0 and compare each frame against `seek`.
