<script lang="ts">
	import { appState } from '../stores/appState';
	import { elements, updateElement } from '../stores/elements';
	import type { ExcalidrawElement } from '../engine/elements/types';
	import ColorPalette from './ColorPalette.svelte';
	import IconButton from './IconButton.svelte';

	$: selectedIds = Array.from($appState.selectedElementIds);
	$: selectedElements = $elements.filter((el) => selectedIds.includes(el.id));
	$: hasSelection = selectedElements.length > 0;
	$: showPanel = hasSelection && $appState.isPropertiesPanelOpen;

	function updateProperty<K extends keyof ExcalidrawElement>(
		key: K,
		value: ExcalidrawElement[K]
	) {
		for (const id of selectedIds) {
			updateElement(id, { [key]: value } as any);
		}
	}

	function handleStrokeColorSelect(color: string) {
		updateProperty('strokeColor', color);
	}

	function handleBackgroundColorSelect(color: string) {
		updateProperty('backgroundColor', color);
	}

	function handleDuplicate() {
		// TODO: Implement duplicate functionality
		console.log('Duplicate selected elements');
	}

	function handleDelete() {
		for (const id of selectedIds) {
			elements.update(els => els.filter(el => el.id !== id));
		}
		appState.update(s => ({ ...s, selectedElementIds: new Set() }));
	}

	function bringToFront() {
		// TODO: Implement bring to front
		console.log('Bring to front');
	}

	function sendToBack() {
		// TODO: Implement send to back
		console.log('Send to back');
	}
</script>

{#if showPanel}
	<div class="properties-panel">
		<div class="panel-header">
			<h4>Stroke</h4>
		</div>
		<div class="section">
			<ColorPalette
				selectedColor={selectedElements[0].strokeColor}
				onColorSelect={handleStrokeColorSelect}
				layout="horizontal"
			/>
		</div>

		<div class="panel-header">
			<h4>Background</h4>
		</div>
		<div class="section">
			<ColorPalette
				selectedColor={selectedElements[0].backgroundColor}
				onColorSelect={handleBackgroundColorSelect}
				showTransparent={true}
				layout="horizontal"
			/>
		</div>

		<div class="panel-header">
			<h4>Stroke</h4>
		</div>
		<div class="section button-row">
			<IconButton
				icon="strokeThin"
				title="Thin (1px)"
				active={selectedElements[0].strokeWidth === 1}
				size="small"
				on:click={() => updateProperty('strokeWidth', 1)}
			/>
			<IconButton
				icon="strokeBold"
				title="Bold (2px)"
				active={selectedElements[0].strokeWidth === 2}
				size="small"
				on:click={() => updateProperty('strokeWidth', 2)}
			/>
			<IconButton
				icon="strokeExtraBold"
				title="Extra Bold (4px)"
				active={selectedElements[0].strokeWidth === 4}
				size="small"
				on:click={() => updateProperty('strokeWidth', 4)}
			/>
		</div>

		<div class="panel-header">
			<h4>Fill</h4>
		</div>
		<div class="section button-row">
			<IconButton
				icon="fillHachure"
				title="Hachure"
				active={selectedElements[0].fillStyle === 'hachure'}
				size="small"
				on:click={() => updateProperty('fillStyle', 'hachure')}
			/>
			<IconButton
				icon="fillCrossHatch"
				title="Cross Hatch"
				active={selectedElements[0].fillStyle === 'cross-hatch'}
				size="small"
				on:click={() => updateProperty('fillStyle', 'cross-hatch')}
			/>
			<IconButton
				icon="fillSolid"
				title="Solid"
				active={selectedElements[0].fillStyle === 'solid'}
				size="small"
				on:click={() => updateProperty('fillStyle', 'solid')}
			/>
		</div>

		<div class="panel-header">
			<h4>Opacity</h4>
		</div>
		<div class="section">
			<div class="opacity-control">
				<input
					type="range"
					min="0"
					max="100"
					value={selectedElements[0].opacity}
					on:input={(e) => updateProperty('opacity', Number(e.currentTarget.value))}
				/>
				<div class="opacity-values">
					<span>0</span>
					<span class="current">{selectedElements[0].opacity}</span>
					<span>100</span>
				</div>
			</div>
		</div>

		<div class="panel-header">
			<h4>Layers</h4>
		</div>
		<div class="section button-row">
			<IconButton
				icon="bringToFront"
				title="Bring to Front"
				size="small"
				on:click={bringToFront}
			/>
			<IconButton
				icon="bringForward"
				title="Bring Forward"
				size="small"
				on:click={bringToFront}
			/>
			<IconButton
				icon="sendBackward"
				title="Send Backward"
				size="small"
				on:click={sendToBack}
			/>
			<IconButton
				icon="sendToBack"
				title="Send to Back"
				size="small"
				on:click={sendToBack}
			/>
		</div>

		<div class="panel-header">
			<h4>Actions</h4>
		</div>
		<div class="section button-row">
			<IconButton
				icon="duplicate"
				title="Duplicate"
				size="small"
				on:click={handleDuplicate}
			/>
			<IconButton
				icon="trash"
				title="Delete"
				variant="danger"
				size="small"
				on:click={handleDelete}
			/>
			<IconButton
				icon="link"
				title="Create Link"
				size="small"
				on:click={() => console.log('Create link')}
			/>
		</div>
	</div>
{/if}

<style>
	.properties-panel {
		position: fixed;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		width: 240px;
		padding: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		z-index: 50;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
		max-height: 80vh;
		overflow-y: auto;
	}

	.panel-header {
		padding: 12px 16px 8px;
		border-bottom: 1px solid var(--color-border);
	}

	.panel-header h4 {
		margin: 0;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.section {
		padding: 12px 16px;
		border-bottom: 1px solid var(--color-border);
	}

	.section:last-child {
		border-bottom: none;
	}

	.button-row {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}

	.opacity-control {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.opacity-control input[type='range'] {
		width: 100%;
		cursor: pointer;
		height: 4px;
		border-radius: 2px;
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		background: var(--color-border);
	}

	.opacity-control input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-accent);
		cursor: pointer;
		border: 2px solid var(--color-background);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.opacity-control input[type='range']::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-accent);
		cursor: pointer;
		border: 2px solid var(--color-background);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.opacity-values {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		color: var(--color-text-secondary);
	}

	.opacity-values .current {
		font-weight: 600;
		color: var(--color-text);
		font-size: 13px;
	}

	/* Custom scrollbar */
	.properties-panel::-webkit-scrollbar {
		width: 8px;
	}

	.properties-panel::-webkit-scrollbar-track {
		background: transparent;
	}

	.properties-panel::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: 4px;
	}

	.properties-panel::-webkit-scrollbar-thumb:hover {
		background: var(--color-text-secondary);
	}
</style>
