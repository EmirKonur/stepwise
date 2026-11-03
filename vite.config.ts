import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

/**
 * GitHub Pages serves project sites from /<repo>, so the deploy workflow sets
 * BASE_PATH=/stepwise. Local dev and preview run from the root.
 */
function basePath(): '' | `/${string}` {
	const raw = process.env.BASE_PATH ?? '';
	if (raw === '') return '';
	if (!/^\/[\w-]+(\/[\w-]+)*$/.test(raw)) {
		throw new Error(`BASE_PATH must look like "/stepwise" (got "${raw}")`);
	}
	return raw as `/${string}`;
}

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: '404.html' }),
			paths: { base: basePath() },
			version: { pollInterval: 0 }
		})
	],
	server: { port: 4310, strictPort: true },
	preview: { port: 4311, strictPort: true },
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		expect: { requireAssertions: true }
	}
});
