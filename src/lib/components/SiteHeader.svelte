<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { theme } from '../theme.svelte.ts';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';

	let { onhelp }: { onhelp: () => void } = $props();

	const links = [
		{ href: resolve('/sort'), id: '/sort', number: '01', label: 'Sort' },
		{ href: resolve('/race'), id: '/race', number: '02', label: 'Race' },
		{ href: resolve('/path'), id: '/path', number: '03', label: 'Path' },
		{ href: resolve('/tree'), id: '/tree', number: '04', label: 'Tree' }
	];
</script>

<header class="header">
	<a class="brand" href={resolve('/')} aria-label="Stepwise home">
		<Logo size={28} />
		<span class="wordmark">Stepwise</span>
	</a>
	<nav aria-label="Visualizers">
		<ul>
			{#each links as link (link.id)}
				<li>
					<a href={link.href} aria-current={page.route.id === link.id ? 'page' : undefined}>
						<span class="number">{link.number}</span>
						<span class="label">{link.label}</span>
					</a>
				</li>
			{/each}
		</ul>
	</nav>
	<div class="tools">
		<button
			type="button"
			class="tool"
			onclick={onhelp}
			aria-label="Keyboard shortcuts"
			data-tip="Shortcuts (?)"
			data-tip-below
			data-tip-end
		>
			<span class="glyph" aria-hidden="true">?</span>
		</button>
		<button
			type="button"
			class="tool"
			onclick={() => theme.toggle()}
			aria-label={theme.current === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
			data-tip={theme.current === 'dark' ? 'Light theme (T)' : 'Dark theme (T)'}
			data-tip-below
			data-tip-end
		>
			<Icon name="theme" />
		</button>
	</div>
</header>

<style>
	.header {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: stretch;
		border-bottom: var(--rule) solid var(--ink);
		background: var(--paper);
		min-height: 56px;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		padding: 0 var(--space-4);
		border-right: var(--rule) solid var(--ink);
		text-decoration: none;
	}

	.wordmark {
		font-size: var(--text-lg);
		font-weight: 900;
		font-stretch: 112%;
		letter-spacing: -0.02em;
		text-transform: uppercase;
	}

	nav ul {
		display: flex;
		height: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	nav a {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		height: 100%;
		padding: var(--space-4) var(--space-5);
		border-right: var(--rule) solid var(--ink);
		text-decoration: none;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	nav a:hover {
		background: var(--tint);
	}

	nav a[aria-current='page'] {
		background: var(--ink);
		color: var(--paper);
	}

	.number {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
	}

	nav a[aria-current='page'] .number {
		color: var(--yellow);
	}

	.tools {
		display: flex;
		border-left: var(--rule) solid var(--ink);
	}

	.tool {
		display: grid;
		place-items: center;
		width: 56px;
		border: 0;
		border-left: var(--rule) solid var(--ink);
		background: none;
	}

	.tool:first-child {
		border-left: 0;
	}

	.tool:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.glyph {
		font-size: var(--text-lg);
		font-weight: 900;
		line-height: 1;
	}

	@media (max-width: 760px) {
		.wordmark {
			display: none;
		}

		nav a {
			flex-direction: column;
			gap: 0;
			padding: var(--space-2) var(--space-3);
			font-size: var(--text-sm);
		}

		.tool {
			width: 44px;
		}
	}

	@media (max-width: 400px) {
		.brand {
			padding: 0 var(--space-3);
		}

		nav a {
			padding: var(--space-2);
		}
	}
</style>
