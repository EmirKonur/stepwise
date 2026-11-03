<script lang="ts" module>
	/**
	 * One family: solid geometric glyphs on a 20px grid, no strokes thinner
	 * than 2.5px, so they hold up next to heavy type.
	 */
	const PATHS = {
		play: 'M5 3 17 10 5 17Z',
		pause: 'M4 3h4.5v14H4zM11.5 3H16v14h-4.5z',
		start: 'M2 3h2.5v14H2zM11 3 4.5 10 11 17zM18 3l-6.5 7 6.5 7z',
		end: 'M15.5 3H18v14h-2.5zM9 3l6.5 7L9 17zM2 3l6.5 7L2 17z',
		back: 'M14.5 3H17v14h-2.5zM13 3 4 10l9 7z',
		forward: 'M3 3h2.5v14H3zM7 3l9 7-9 7z',
		shuffle:
			'M2 5h5l7 10h2v-3l4 4-4 4v-3h-3.4L5.6 7H2zM13 5h3V2l4 4-4 4V7h-2l-1.6 2.3-1.3-1.8zM2 13h3.6l1.6-2.3 1.3 1.8L7 15H2z',
		link: 'M8.5 6.5 11 4a4 4 0 0 1 5.7 5.7l-2.5 2.5-1.8-1.8 2.5-2.5a1.5 1.5 0 0 0-2.1-2.1l-2.5 2.5zM11.5 13.5 9 16a4 4 0 0 1-5.7-5.7l2.5-2.5 1.8 1.8-2.5 2.5a1.5 1.5 0 0 0 2.1 2.1l2.5-2.5zM6.9 11.3l4.4-4.4 1.8 1.8-4.4 4.4z',
		theme: 'M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2.5v11a5.5 5.5 0 0 0 0-11z',
		wall: 'M3 3h14v14H3z',
		weight: 'M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14z',
		erase: 'M3 3h14v14H3zm2.5 2.5v9h9v-9z',
		plus: 'M8.75 3h2.5v5.75H17v2.5h-5.75V17h-2.5v-5.75H3v-2.5h5.75z',
		search:
			'M8.5 2a6.5 6.5 0 0 1 5.3 10.3l4.2 4.2-1.8 1.8-4.2-4.2A6.5 6.5 0 1 1 8.5 2zm0 2.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
		minus: 'M3 8.75h14v2.5H3z'
	} as const;

	export type IconName = keyof typeof PATHS;
</script>

<script lang="ts">
	let { name, size = 20 }: { name: IconName; size?: number } = $props();
</script>

<svg
	class="icon"
	width={size}
	height={size}
	viewBox="0 0 20 20"
	aria-hidden="true"
	focusable="false"
	fill-rule="evenodd"
>
	<path d={PATHS[name]} fill="currentColor" />
</svg>

<style>
	.icon {
		display: block;
		flex: none;
	}
</style>
