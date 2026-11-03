<script lang="ts">
	let { open = $bindable(false) }: { open?: boolean } = $props();
	let dialog: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	/** Combos are written as they read: separators are `+`, `/` and `to`, everything else is a key. */
	const groups = [
		{
			title: 'Playback',
			keys: [
				['Space', 'Play or pause'],
				['← / →', 'Step back or forward'],
				['Shift + ← / →', 'Previous or next marker'],
				['Home / End', 'Jump to start or end'],
				['1 to 9', 'Speed, slowest to fastest']
			]
		},
		{
			title: 'Anywhere',
			keys: [
				['R', 'New random input'],
				['T', 'Toggle dark theme'],
				['?', 'Show this sheet'],
				['Esc', 'Close it again']
			]
		},
		{
			title: 'Path grid, when focused',
			keys: [
				['← ↑ → ↓', 'Move the cell cursor'],
				['Enter', 'Paint with the current brush'],
				['S / G', 'Put start or goal here']
			]
		}
	] as const;

	const SEPARATORS = new Set(['+', '/', 'to']);
</script>

<dialog
	bind:this={dialog}
	onclose={() => (open = false)}
	onclick={(event) => {
		if (event.target === dialog) open = false;
	}}
	aria-labelledby="cheatsheet-title"
>
	<div class="sheet">
		<header>
			<h2 id="cheatsheet-title">Keyboard</h2>
			<button type="button" class="close" onclick={() => (open = false)} aria-label="Close"
				>Esc</button
			>
		</header>
		<div class="groups">
			{#each groups as group (group.title)}
				<section>
					<h3>{group.title}</h3>
					<dl>
						{#each group.keys as [keys, action] (action)}
							<dt>
								{#each keys.split(' ') as token, index (index)}
									{#if SEPARATORS.has(token)}<span class="join">{token}</span>{:else}<kbd
											>{token}</kbd
										>{/if}
								{/each}
							</dt>
							<dd>{action}</dd>
						{/each}
					</dl>
				</section>
			{/each}
		</div>
	</div>
</dialog>

<style>
	dialog {
		width: min(720px, calc(100vw - 2rem));
		max-height: calc(100dvh - 2rem);
		padding: 0;
		border: var(--rule) solid var(--ink);
		background: var(--paper);
		color: var(--ink);
	}

	dialog::backdrop {
		background: color-mix(in srgb, var(--paper) 70%, transparent);
	}

	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-4) var(--space-5);
		background: var(--yellow);
		color: var(--on-yellow);
		border-bottom: var(--rule) solid var(--ink);
	}

	h2 {
		font-size: var(--text-2xl);
		font-weight: 900;
		font-stretch: 110%;
		line-height: 1;
		text-transform: uppercase;
	}

	.close {
		border: var(--rule) solid currentColor;
		background: none;
		padding: var(--space-1) var(--space-3);
		font-family: var(--font-mono);
		font-weight: 600;
	}

	.groups {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--rule);
		background: var(--ink);
	}

	section {
		padding: var(--space-4) var(--space-5) var(--space-5);
		background: var(--paper);
	}

	h3 {
		margin-bottom: var(--space-3);
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	dl {
		display: grid;
		gap: var(--space-2);
		margin: 0;
	}

	dt {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	dd {
		margin: 0 0 var(--space-2);
		font-size: var(--text-sm);
		color: var(--ink-soft);
	}

	.join {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
	}
</style>
