<script lang="ts">
	import { shortcutAllowed } from '../keyboard.ts';
	import { SPEEDS, type Player } from '../player.svelte.ts';
	import { adjacentMarker, type Marker } from '../render/markers.ts';
	import Icon from './Icon.svelte';
	import Scrubber from './Scrubber.svelte';

	let {
		player,
		markers,
		unit = 'Step',
		shareUrl,
		onshuffle
	}: {
		player: Player;
		markers: readonly Marker[];
		/** What one position on the timeline is called: a step, or a race tick. */
		unit?: string;
		/** Builds the link for the moment on screen. */
		shareUrl: () => string;
		onshuffle?: () => void;
	} = $props();

	let copied = $state<'idle' | 'copied' | 'failed'>('idle');
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;

	const digits = $derived(String(player.last).length);
	const padded = $derived(String(player.step).padStart(digits, '0'));

	function jumpMarker(direction: -1 | 1) {
		const target = adjacentMarker(markers, player.step, direction);
		player.pause();
		player.seek(target ?? (direction > 0 ? player.last : 0));
	}

	async function share() {
		player.pause();
		try {
			await navigator.clipboard.writeText(shareUrl());
			copied = 'copied';
		} catch {
			copied = 'failed';
		}
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = 'idle'), 1800);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.defaultPrevented || !shortcutAllowed(event)) return;
		const { key } = event;
		let handled = true;
		if (key === ' ') player.toggle();
		else if (key === 'ArrowRight' && event.shiftKey) jumpMarker(1);
		else if (key === 'ArrowLeft' && event.shiftKey) jumpMarker(-1);
		else if (key === 'ArrowRight') player.stepBy(1);
		else if (key === 'ArrowLeft') player.stepBy(-1);
		else if (key === 'Home') player.reset(0);
		else if (key === 'End') player.reset(player.last);
		else if (/^[1-9]$/.test(key)) player.setSpeed(Number(key));
		else if ((key === 'r' || key === 'R') && onshuffle) onshuffle();
		else handled = false;
		if (handled) event.preventDefault();
	}
</script>

<svelte:window {onkeydown} />

<div class="transport">
	<div class="buttons" role="group" aria-label="Playback">
		<button
			type="button"
			onclick={() => player.reset(0)}
			aria-label="Jump to start"
			data-tip="Start (Home)"
		>
			<Icon name="start" />
		</button>
		<button
			type="button"
			onclick={() => player.stepBy(-1)}
			aria-label="Step back"
			data-tip="Back (←)"
		>
			<Icon name="back" />
		</button>
		<button
			type="button"
			class="play"
			onclick={() => player.toggle()}
			aria-label={player.playing ? 'Pause' : 'Play'}
			data-tip={player.playing ? 'Pause (Space)' : 'Play (Space)'}
		>
			<Icon name={player.playing ? 'pause' : 'play'} size={24} />
		</button>
		<button
			type="button"
			onclick={() => player.stepBy(1)}
			aria-label="Step forward"
			data-tip="Forward (→)"
		>
			<Icon name="forward" />
		</button>
		<button
			type="button"
			onclick={() => player.reset(player.last)}
			aria-label="Jump to end"
			data-tip="End (End)"
		>
			<Icon name="end" />
		</button>
	</div>

	<div class="counter" aria-live="off">
		<span class="unit">{unit}</span>
		<span class="value" data-testid="step">{padded}</span>
		<span class="of">/ {player.last}</span>
	</div>

	<div class="scrub">
		<Scrubber
			value={player.step}
			last={player.last}
			{markers}
			label={unit}
			onseek={(step) => {
				player.pause();
				player.seek(step);
			}}
		/>
	</div>

	<label class="speed">
		<span class="unit">Speed</span>
		<input
			type="range"
			min="1"
			max={SPEEDS.length}
			value={player.speed}
			oninput={(event) => player.setSpeed(Number(event.currentTarget.value))}
			aria-valuetext={`${player.stepsPerSecond} steps per second`}
		/>
		<output>{player.stepsPerSecond}/s</output>
	</label>

	<button
		type="button"
		class="share"
		onclick={share}
		data-tip="Link to this exact moment"
		data-tip-end
	>
		<Icon name="link" />
		<span aria-live="polite">
			{copied === 'copied' ? 'Copied' : copied === 'failed' ? 'Copy failed' : 'Copy link'}
		</span>
	</button>
</div>

<style>
	.transport {
		display: grid;
		grid-template-columns: auto auto minmax(160px, 1fr) auto auto;
		align-items: stretch;
		gap: var(--rule);
		background: var(--ink);
		border-top: var(--rule) solid var(--ink);
	}

	.transport > * {
		background: var(--paper);
	}

	.buttons {
		display: flex;
		gap: var(--rule);
		background: var(--ink);
	}

	.buttons button {
		display: grid;
		place-items: center;
		width: 52px;
		min-height: 60px;
		border: 0;
		background: var(--paper);
	}

	.buttons button:hover {
		background: var(--tint);
	}

	.buttons .play {
		width: 72px;
		background: var(--red);
		color: var(--on-red);
	}

	.buttons .play:hover {
		background: var(--ink);
		color: var(--paper);
	}

	.counter {
		display: flex;
		align-items: baseline;
		gap: var(--space-2);
		padding: var(--space-3) var(--space-4);
		align-self: stretch;
	}

	.unit {
		font-family: var(--font-mono);
		font-size: var(--text-xs);
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.value {
		font-size: var(--text-xl);
		font-weight: 900;
		line-height: 1.4;
		letter-spacing: -0.01em;
	}

	.of {
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		color: var(--ink-soft);
	}

	.scrub {
		padding: 0 var(--space-4);
		min-width: 0;
	}

	.speed {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-4);
	}

	.speed input {
		width: 96px;
		accent-color: var(--ink);
	}

	output {
		min-width: 4ch;
		font-family: var(--font-mono);
		font-size: var(--text-sm);
		font-weight: 600;
	}

	.share {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 0 var(--space-4);
		border: 0;
		font-weight: 700;
	}

	.share:hover {
		background: var(--yellow);
		color: var(--on-yellow);
	}

	@media (max-width: 1100px) {
		.transport {
			grid-template-columns: auto 1fr auto;
		}

		.scrub {
			grid-column: 1 / -1;
			order: -1;
		}

		.speed {
			display: none;
		}
	}

	@media (max-width: 560px) {
		.transport {
			grid-template-columns: minmax(0, 1fr) auto auto;
		}

		.buttons button {
			flex: 1;
			width: auto;
			min-width: 40px;
			min-height: 52px;
		}

		.buttons .play {
			width: auto;
			flex: 1.4;
		}

		.counter {
			flex-direction: column;
			justify-content: center;
			gap: 0;
			padding: var(--space-1) var(--space-3);
		}

		.value {
			font-size: var(--text-lg);
			line-height: 1.1;
		}

		.unit,
		.of {
			font-size: 0.6875rem;
		}

		.share {
			padding: 0 var(--space-3);
		}

		.share span {
			display: none;
		}
	}
</style>
