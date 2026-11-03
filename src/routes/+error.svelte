<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';

	const missing = $derived(page.status === 404);
	// One bar out of order: the page you asked for is not where it should be.
	const heights = [18, 30, 42, 92, 54, 66, 78];
</script>

<svelte:head>
	<title>{missing ? 'Not found' : 'Error'} · Stepwise</title>
</svelte:head>

<section class="error">
	<div class="figure" aria-hidden="true">
		<svg viewBox="0 0 140 100">
			{#each heights as height, index (index)}
				<rect class:odd={index === 3} x={index * 20 + 2} y={100 - height} width="16" {height} />
			{/each}
		</svg>
	</div>
	<div class="copy">
		<p class="status">{page.status}</p>
		<h1>{missing ? 'This step is out of range.' : 'Something went wrong.'}</h1>
		<p class="detail">
			{#if missing}
				Nothing lives at <code>{page.url.pathname}</code>. The four visualizers are below.
			{:else}
				{page.error?.message ?? 'An unexpected error stopped the page from rendering.'}
			{/if}
		</p>
		<nav aria-label="Visualizers">
			<a href={resolve('/sort')}>01 Sort</a>
			<a href={resolve('/race')}>02 Race</a>
			<a href={resolve('/path')}>03 Path</a>
			<a href={resolve('/tree')}>04 Tree</a>
		</nav>
	</div>
</section>

<style>
	.error {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
		gap: var(--rule);
		flex: 1;
		background: var(--ink);
	}

	.error > * {
		background: var(--paper);
	}

	.figure {
		display: grid;
		place-items: end center;
		padding: var(--space-7);
	}

	svg {
		width: min(100%, 420px);
	}

	rect {
		fill: var(--ink);
	}

	rect.odd {
		fill: var(--red);
	}

	.copy {
		display: grid;
		align-content: center;
		gap: var(--space-4);
		padding: var(--space-7);
	}

	.status {
		font-size: clamp(5rem, 14vw, 11rem);
		font-weight: 900;
		font-stretch: 112%;
		line-height: 0.8;
		letter-spacing: -0.05em;
	}

	h1 {
		font-size: var(--text-2xl);
		font-weight: 900;
		line-height: 1.05;
	}

	.detail {
		color: var(--ink-soft);
		font-size: var(--text-lg);
	}

	code {
		font-family: var(--font-mono);
		color: var(--ink);
		word-break: break-all;
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
	}

	nav a {
		padding: var(--space-2) var(--space-4);
		border: var(--rule) solid var(--ink);
		font-weight: 700;
		text-decoration: none;
	}

	nav a:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	@media (max-width: 760px) {
		.error {
			grid-template-columns: minmax(0, 1fr);
		}

		.figure,
		.copy {
			padding: var(--space-5) var(--space-4);
		}
	}
</style>
