# 0005. A client-rendered static site on GitHub Pages

Status: accepted

## Context

Stepwise has no backend: every computation runs in the browser, and the deploy target is GitHub Pages under `/stepwise`. The interesting state lives in the query string, which does not exist when pages are built.

## Decision

SvelteKit 3 with `adapter-static`, `prerender = true` and `ssr = false` on the root layout. Each route is emitted as a static HTML shell (`sort.html`, `path.html`, and so on) and renders in the browser from the URL. The adapter writes `404.html` as a fallback so unknown paths still boot the app and show the designed error page. `static/.nojekyll` stops Pages from running Jekyll, which would drop the `_app` directory. The base path comes from `BASE_PATH`, empty locally and `/<repository name>` in the deploy workflow, and every internal link goes through `resolve()`.

`app.html` contains a three-bar loading mark that disappears once the app mounts, and a `<noscript>` message.

## Rejected alternatives

- **Server-side prerendering with default state.** The first paint would show the default algorithm and step 0, then jump to whatever the link asked for. For a tool whose links point at specific moments, that flash is worse than a blank frame for a few milliseconds.
- **Hash routing.** Works on any static host without the 404 trick, but turns every link into `/#/sort?...`, which reads worse and gains nothing on Pages.
- **adapter-node or a serverless host.** Adds a server to a project that never needs one.

## Consequences

- Without JavaScript there is only the noscript message. That is acceptable for an interactive visualizer and stated plainly.
- The engine and algorithms do not depend on SvelteKit at all. Imports use explicit `.ts` extensions (which Kit 3 recommends), so `scripts/bench-timeline.ts` runs them under plain Node with type stripping and no build step.
