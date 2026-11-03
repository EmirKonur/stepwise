# 0003. Render every stage as SVG

Status: accepted

## Context

There are three kinds of picture: up to 128 bars (plus a merge buffer row), a grid of up to 45 x 27 = 1,215 cells, and a tree of at most 31 nodes. Canvas is the usual answer for "many cells, redrawn often", so the grid was the case that needed checking.

## Decision

All three stages are SVG. Each renderer is a pure function, `barScene(frame, layout)`, `gridScene(frame, grid, size)` and `treeScene(frame, layout)`, that returns plain shapes; the Svelte components only draw them.

We measured the worst cases with playback at the top speed (400 steps per second, several steps per animation frame) for three seconds in headless Chromium from Playwright 1.64.1 on an Apple M2 Pro, timing the gaps between `requestAnimationFrame` callbacks:

| Stage                                | Frames | Median frame | p95 frame | Slowest frame |
| ------------------------------------ | -----: | -----------: | --------: | ------------: |
| Dijkstra, 45 x 27 grid (1,215 tiles) |    180 |      16.7 ms |   16.8 ms |       16.8 ms |
| Bubble sort, 128 bars                |    179 |      16.7 ms |   16.7 ms |       16.8 ms |
| AVL tree, 11 nodes                   |    179 |      16.7 ms |   16.7 ms |       16.8 ms |

No frame was dropped. A desktop browser is not a phone, but the margin is wide.

SVG also earns its keep beyond speed:

- Colors come from the same CSS custom properties as the rest of the UI, so the dark theme needs no renderer changes.
- Keyed elements (bars by element id, nodes by node id) give movement for free: a swap is two bars with new `transform` values and a CSS transition.
- The grid editor gets hit testing, focus and an accessible name from the DOM.
- Screenshots and tests can query real elements.

## Consequences

- Grid sizes are capped at 45 x 27. If larger grids are ever wanted, the tile layer is the part to move to Canvas; the scene function already produces a flat tone array that would map onto a canvas fill loop.
- Tree edges cannot use CSS transitions, because an edge must follow two moving endpoints. Node positions are tweened in JavaScript (`render/tween.ts`) and edges are drawn between the interpolated points.
