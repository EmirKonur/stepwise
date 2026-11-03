<script lang="ts">
	let {
		lines,
		active,
		caption,
		announce
	}: {
		lines: readonly string[];
		/** 1-based line to highlight, 0 for none. */
		active: number;
		/** Plain-language description of the current event. */
		caption: string;
		/** Read the caption to screen readers; off while playing, or it would never stop talking. */
		announce: boolean;
	} = $props();

	const KEYWORDS = new Set([
		'for',
		'while',
		'if',
		'elif',
		'else',
		'return',
		'break',
		'continue',
		'stop',
		'in',
		'to',
		'down',
		'and',
		'or',
		'not',
		'is',
		'each',
		'of'
	]);

	type Token = { text: string; kind: 'keyword' | 'comment' | 'plain' };

	function tokenize(line: string): Token[] {
		const comment = line.indexOf('//');
		const code = comment === -1 ? line : line.slice(0, comment);
		const tokens: Token[] = code
			.split(/(\b[a-z]+\b)/)
			.filter((text) => text !== '')
			.map((text) => ({ text, kind: KEYWORDS.has(text) ? 'keyword' : 'plain' }));
		if (comment !== -1) tokens.push({ text: line.slice(comment), kind: 'comment' });
		return tokens;
	}

	const tokenized = $derived(lines.map(tokenize));
	let list: HTMLOListElement | undefined = $state();

	// Keep the active line visible without scrolling the page itself.
	$effect(() => {
		const row = list?.querySelector<HTMLElement>(`[data-line="${active}"]`);
		if (!list || !row) return;
		const top = row.offsetTop - list.offsetTop;
		if (top < list.scrollTop) list.scrollTop = top;
		else if (top + row.offsetHeight > list.scrollTop + list.clientHeight) {
			list.scrollTop = top + row.offsetHeight - list.clientHeight;
		}
	});
</script>

<section class="panel" aria-labelledby="code-title">
	<h2 id="code-title" class="label">Code</h2>
	<ol bind:this={list}>
		{#each tokenized as tokens, index (index)}
			<li
				data-line={index + 1}
				class:active={index + 1 === active}
				aria-current={index + 1 === active ? 'step' : undefined}
			>
				<span class="number" aria-hidden="true">{index + 1}</span>
				<code
					>{#each tokens as token, t (t)}<span class={token.kind}>{token.text}</span>{/each}</code
				>
			</li>
		{/each}
	</ol>
	<p class="caption" aria-live={announce ? 'polite' : 'off'} data-testid="caption">
		<span class="now">Now</span>
		{caption}
	</p>
</section>

<style>
	.panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
		height: 100%;
	}

	.label {
		padding: var(--space-3) var(--space-4);
		border-bottom: var(--rule) solid var(--ink);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	ol {
		flex: 1;
		min-height: 0;
		margin: 0;
		padding: var(--space-2) 0;
		overflow: auto;
		list-style: none;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		line-height: 1.75;
	}

	li {
		display: grid;
		grid-template-columns: 2.5rem 1fr;
		padding-right: var(--space-3);
		white-space: pre;
	}

	li.active {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	.number {
		padding-right: var(--space-3);
		text-align: right;
		color: var(--ink-soft);
		user-select: none;
	}

	li.active .number {
		color: inherit;
		font-weight: 600;
	}

	.keyword {
		font-weight: 600;
	}

	.comment {
		color: var(--ink-soft);
		font-style: italic;
	}

	li.active .comment {
		color: inherit;
	}

	.caption {
		display: flex;
		gap: var(--space-3);
		align-items: baseline;
		min-height: 4.5rem;
		padding: var(--space-3) var(--space-4);
		border-top: var(--rule) solid var(--ink);
		font-weight: 600;
		line-height: 1.35;
	}

	.now {
		flex: none;
		padding: 1px 6px;
		background: var(--ink);
		color: var(--paper);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}
</style>
