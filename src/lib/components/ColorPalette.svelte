<script lang="ts">
	import { appState } from '$lib/stores/appState';
	import { getColorPaletteForTheme, getAllColorIndices, COLOR_INDICES, type ColorIndex } from '$lib/utils/colorPalette';

	export let selectedColorIndex: ColorIndex;
	export let onColorSelect: (index: ColorIndex) => void;
	export let showTransparent = false;
	export let layout: 'grid' | 'horizontal' = 'grid';

	$: paletteColors = getColorPaletteForTheme($appState.theme);
	$: colorIndices = getAllColorIndices();

	function handleColorClick(index: ColorIndex) {
		onColorSelect(index);
	}
</script>

<div class="color-palette" class:horizontal={layout === 'horizontal'}>
	{#each colorIndices as index, i}
		<button
			class="color-swatch"
			class:selected={selectedColorIndex === index}
			class:white={paletteColors[i] === '#ffffff'}
			style="background-color: {paletteColors[i]};"
			on:click={() => handleColorClick(index)}
			title={paletteColors[i]}
		>
			{#if selectedColorIndex === index}
				<span class="selection-ring"></span>
			{/if}
		</button>
	{/each}

	{#if showTransparent}
		<button
			class="color-swatch transparent"
			class:selected={selectedColorIndex === COLOR_INDICES.TRANSPARENT}
			on:click={() => handleColorClick(COLOR_INDICES.TRANSPARENT)}
			title="Transparent"
		>
			{#if selectedColorIndex === COLOR_INDICES.TRANSPARENT}
				<span class="selection-ring"></span>
			{/if}
		</button>
	{/if}
</div>

<style>
	.color-palette {
		display: flex;
		gap: var(--spacing-sm);
		padding: 0;
	}

	.color-palette.horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 36px;
		height: 36px;
		border: 3px solid transparent;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: var(--shadow-sm);
	}

	.color-swatch:hover {
		transform: translateY(-3px) scale(1.08);
		box-shadow: var(--shadow-md);
		border-color: rgba(255, 255, 255, 0.3);
	}

	.color-swatch:active {
		transform: translateY(-1px) scale(1.02);
	}

	.color-swatch.white {
		border-color: var(--color-border);
	}

	.color-swatch.selected {
		box-shadow: 0 0 0 3px var(--color-surface), 0 0 0 5px var(--color-accent), var(--shadow-md);
		transform: scale(1.05);
	}

	.color-swatch.selected:hover {
		transform: translateY(-3px) scale(1.12);
	}

	.selection-ring {
		position: absolute;
		inset: -6px;
		border: 3px solid var(--color-accent);
		border-radius: var(--radius-lg);
		pointer-events: none;
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.color-swatch.transparent {
		background:
			linear-gradient(45deg, #ccc 25%, transparent 25%),
			linear-gradient(-45deg, #ccc 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #ccc 75%),
			linear-gradient(-45deg, transparent 75%, #ccc 75%);
		background-size: 10px 10px;
		background-position: 0 0, 0 5px, 5px -5px, -5px 0;
		border: 3px solid var(--color-border);
	}
</style>
