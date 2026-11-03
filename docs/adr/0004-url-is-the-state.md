# 0004. The URL is the shareable state

Status: accepted

## Context

"Every state is a shareable URL" means a link must reopen the same algorithm, the same input and the same step, in any browser, with nothing stored on a server. Inputs are often random, and tree pages accumulate history.

## Decision

Each page has a small, tested codec (`src/lib/url/`) between its state and the query string:

- Random inputs are stored as a short seed (`seed=1919`), not as values. Generation uses a seeded mulberry32 PRNG, which behaves identically in every JavaScript engine.
- Custom inputs are stored literally, with readable commas: `values=5,2,4,1,3`.
- A hand-edited grid is packed at two bits per cell and base64url encoded: 408 characters for the largest grid. Until the grid is edited the link carries only the layout name and seed.
- A tree is stored as its operation history (`ops=i50,i30,d30`) and rebuilt by replaying it, so a link also reproduces how the tree got its shape.
- The step is stored as an index into the recorded timeline and clamped on load.

The address bar is rewritten in place (a shallow, replacing navigation), only while playback is paused, and only after the state has been still for 250 ms. Playing never touches history.

Invalid or hostile parameters fall back to defaults field by field, so a mangled link still opens something sensible instead of an error.

## Rejected alternatives

- **A JSON blob in the hash.** One codec instead of four, but links become opaque and long, and partial corruption loses everything.
- **Pushing a history entry per step.** Back would mean "one step back" through thousands of entries, and Safari throws after about 100 history updates in 30 seconds.
- **localStorage.** Remembers state, but cannot be shared, which was the point.

## Consequences

- Determinism is a hard requirement on everything upstream of the URL: generators, PRNG, priority-queue tie breaking. The test suite checks each one.
- Round-trip property tests (`url.test.ts`) generate arbitrary valid states, format them and parse them back.
