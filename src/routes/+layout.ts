// Every route is a static shell rendered in the browser: visualizer state lives
// in the query string, which does not exist at build time.
export const prerender = true;
export const ssr = false;
