<script lang="ts">
	export let selectedColor: string;
	export let onColorSelect: (color: string) => void;
	export let showTransparent = false;
	export let layout: 'grid' | 'horizontal' = 'grid';

	// Palette de couleurs inspirée du screenshot
	const colors = [
		'#6b7280', // Gris
		'#ef4444', // Rouge
		'#10b981', // Vert
		'#3b82f6', // Bleu
		'#f97316', // Orange
		'#ffffff'  // Blanc
	];

	function handleColorClick(color: string) {
		onColorSelect(color);
	}
</script>

<div class="color-palette" class:horizontal={layout === 'horizontal'}>
	{#each colors as color}
		<button
			class="color-swatch"
			class:selected={selectedColor.toLowerCase() === color.toLowerCase()}
			class:white={color === '#ffffff'}
			style="background-color: {color};"
			on:click={() => handleColorClick(color)}
			title={color}
		>
			{#if selectedColor.toLowerCase() === color.toLowerCase()}
				<span class="selection-ring"></span>
			{/if}
		</button>
	{/each}

	{#if showTransparent}
		<button
			class="color-swatch transparent"
			class:selected={selectedColor === 'transparent'}
			on:click={() => handleColorClick('transparent')}
			title="Transparent"
		>
			{#if selectedColor === 'transparent'}
				<span class="selection-ring"></span>
			{/if}
		</button>
	{/if}
</div>

<style>
	.color-palette {
		display: flex;
		gap: 8px;
		padding: 0;
	}

	.color-palette.horizontal {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 32px;
		height: 32px;
		border: 2px solid transparent;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.15s ease;
		position: relative;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.color-swatch:hover {
		transform: scale(1.05);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
	}

	.color-swatch.white {
		border-color: var(--color-border);
	}

	.color-swatch.selected {
		box-shadow: 0 0 0 2px var(--color-background), 0 0 0 4px currentColor;
	}

	.selection-ring {
		position: absolute;
		inset: -4px;
		border: 2px solid var(--color-accent);
		border-radius: 8px;
		pointer-events: none;
	}

	.color-swatch.transparent {
		background:
			linear-gradient(45deg, #ccc 25%, transparent 25%),
			linear-gradient(-45deg, #ccc 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #ccc 75%),
			linear-gradient(-45deg, transparent 75%, #ccc 75%);
		background-size: 8px 8px;
		background-position: 0 0, 0 4px, 4px -4px, -4px 0;
		border: 2px solid var(--color-border);
	}
</style>
