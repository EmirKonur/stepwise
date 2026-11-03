import { afterNavigate, goto } from '$app/navigation';

/**
 * Mirrors the page state into the address bar, so the URL is always a link
 * to what is on screen. Writes wait until playback pauses and settle for
 * 250ms: Safari throttles history updates to about 100 per 30 seconds and
 * throws past that.
 */
export function syncUrl(query: () => string, paused: () => boolean): void {
	$effect(() => {
		const next = query();
		if (!paused()) return;
		const timer = setTimeout(() => {
			if (location.search.slice(1) === next) return;
			// Shallow: rewrite the entry in place without rerunning the page or moving focus.
			// location.pathname already carries the base path, so resolve() would add it twice.
			// eslint-disable-next-line svelte/no-navigation-without-resolve
			void goto(`${location.pathname}?${next}`, { shallow: true, replace: true });
		}, 250);
		return () => clearTimeout(timer);
	});
}

/**
 * Runs `apply` when the URL changes underneath a mounted page: the nav link
 * to the same route, or back and forward. Our own shallow writes are ignored.
 */
export function onExternalNavigation(apply: () => void): void {
	afterNavigate(({ type, shallow }) => {
		if (type !== 'enter' && !shallow) apply();
	});
}

/** Absolute link to the current route with the given query. */
export function shareLink(query: string): string {
	return `${location.origin}${location.pathname}?${query}`;
}
