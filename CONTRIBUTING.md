# Contributing

## Setup

Node 22.17 or newer (`.nvmrc` pins the CI version, Node 26) and pnpm 9.

```sh
pnpm install
pnpm dev          # http://localhost:4310
```

## Scripts

| Command         | What it does                                                             |
| --------------- | ------------------------------------------------------------------------ |
| `pnpm dev`      | Dev server on port 4310                                                  |
| `pnpm test`     | Vitest unit and property tests                                           |
| `pnpm test:e2e` | Builds, serves on 4312 and runs Playwright (Chromium)                    |
| `pnpm lint`     | Prettier check and ESLint                                                |
| `pnpm check`    | `svelte-check` with warnings treated as errors                           |
| `pnpm build`    | Static site in `build/`; set `BASE_PATH=/stepwise` to match GitHub Pages |
| `pnpm bench`    | Timeline storage benchmark (`scripts/bench-timeline.ts`)                 |
| `pnpm format`   | Prettier write                                                           |

`@playwright/test` is pinned to an exact version so its Chromium build matches the one CI installs. Bump it on purpose, not through Dependabot.

## Conventions

- `src/lib/engine`, `src/lib/algorithms`, `src/lib/render` and `src/lib/url` must not import Svelte or SvelteKit. They run under plain Node in tests and benchmarks.
- Relative imports carry their `.ts` extension, and app code imports library modules through `#lib/...`.
- Algorithms change state only by yielding events. A sort learns the order of two elements only from a `compare` reply.
- Event `line` numbers are 1-based indices into the algorithm's own `code` listing. Keep them in step when editing a listing; the tests catch out-of-range lines, not wrong ones.
- Anything that feeds the URL must be deterministic: seeded randomness only, explicit tie-breaking in priority queues.
- Comments explain why, not what.

## Adding an algorithm

1. Write the generator, its listing and its metadata in one file next to the others in its domain.
2. Add it to the domain's registry array (`SORTS`, `SEARCHES` or `TREES`).
3. Run `pnpm test`. The property tests iterate over the registries, so the new algorithm is checked without new test code. Add tests for anything specific to it, such as an exact comparison count.
