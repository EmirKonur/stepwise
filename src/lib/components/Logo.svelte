<script lang="ts">
	let { size = 32 }: { size?: number } = $props();
</script>

<!-- Three bars mid-sort on the Stepwise grid; same drawing as static/favicon.svg. -->
<svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
	<rect width="32" height="32" fill="var(--ink)" />
	<rect x="4" y="16" width="6" height="12" fill="var(--yellow)" />
	<rect x="13" y="4" width="6" height="24" fill="var(--red)" />
	<rect x="22" y="10" width="6" height="18" fill="var(--paper)" />
</svg>
