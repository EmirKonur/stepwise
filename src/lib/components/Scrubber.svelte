<script lang="ts">
	import type { Marker } from '../render/markers.ts';

	let {
		value,
		last,
		markers,
		label,
		onseek
	}: {
		value: number;
		last: number;
		markers: readonly Marker[];
		label: string;
		onseek: (step: number) => void;
	} = $props();

	const position = (step: number) => (last > 0 ? (step / last) * 1000 : 0);
</script>

<div class="scrubber" style:--progress={`${last > 0 ? (value / last) * 100 : 0}%`}>
	<svg class="ticks" viewBox="0 0 1000 10" preserveAspectRatio="none" aria-hidden="true">
		{#each markers as marker (marker.step)}
			<line
				class={marker.tone}
				x1={position(marker.step)}
				x2={position(marker.step)}
				y1="0"
				y2="10"
				vector-effect="non-scaling-stroke"
			/>
		{/each}
	</svg>
	<div class="track" aria-hidden="true"><div class="fill"></div></div>
	<input
		type="range"
		min="0"
		max={last}
		{value}
		aria-label={label}
		aria-valuetext={`${label} ${value} of ${last}`}
		data-shortcuts
		oninput={(event) => onseek(Number(event.currentTarget.value))}
	/>
</div>

<style>
	.scrubber {
		position: relative;
		display: grid;
		align-content: center;
		min-width: 0;
		height: 44px;
	}

	.ticks {
		position: absolute;
		left: 0;
		right: 0;
		top: 2px;
		width: 100%;
		height: 12px;
		overflow: visible;
	}

	line {
		stroke-width: 2px;
		stroke: var(--ink);
	}

	line.red {
		stroke: var(--red);
	}

	line.blue {
		stroke: var(--blue);
	}

	/* The visible track is plain boxes; the native input on top only supplies the thumb. */
	.track {
		position: absolute;
		left: 0;
		right: 0;
		top: 25px;
		height: 10px;
		border: var(--rule) solid var(--ink);
		background: var(--tint);
	}

	.fill {
		width: var(--progress);
		height: 100%;
		background: var(--ink);
	}

	input {
		position: relative;
		width: 100%;
		height: 28px;
		margin: 16px 0 0;
		background: none;
		appearance: none;
		cursor: pointer;
	}

	input::-webkit-slider-runnable-track {
		height: 10px;
		background: none;
	}

	input::-moz-range-track {
		height: 10px;
		background: none;
	}

	input::-webkit-slider-thumb {
		width: 14px;
		height: 26px;
		margin-top: -8px;
		border: var(--rule) solid var(--ink);
		border-radius: 0;
		background: var(--red);
		appearance: none;
	}

	input::-moz-range-thumb {
		width: 10px;
		height: 22px;
		border: var(--rule) solid var(--ink);
		border-radius: 0;
		background: var(--red);
	}

	input:focus-visible {
		outline-offset: 4px;
	}
</style>
