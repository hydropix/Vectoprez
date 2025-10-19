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

	function handleStrokeColorSelect(index: number) {
		updateProperty('strokeColorIndex', index);
	}

	function handleBackgroundColorSelect(index: number) {
		updateProperty('backgroundColorIndex', index);
	}

	function handleDuplicate() {
	}

	function handleDelete() {
		for (const id of selectedIds) {
			elements.update(els => els.filter(el => el.id !== id));
		}
		appState.update(s => ({ ...s, selectedElementIds: new Set() }));
	}

	function bringToFront() {
	}

	function sendToBack() {
	}
</script>

{#if showPanel}
	<div class="properties-panel">
		<div class="panel-header">
			<h4>Stroke</h4>
		</div>
		<div class="section">
			<ColorPalette
				selectedColorIndex={selectedElements[0].strokeColorIndex}
				onColorSelect={handleStrokeColorSelect}
				showNoStroke={true}
				layout="horizontal"
			/>
		</div>

		<div class="panel-header">
			<h4>Background</h4>
		</div>
		<div class="section">
			<ColorPalette
				selectedColorIndex={selectedElements[0].backgroundColorIndex}
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

	{#if selectedElements[0].type === 'rectangle' || selectedElements[0].type === 'ellipse'}
		<div class="panel-header">
			<h4>Shadow</h4>
		</div>
		<div class="section">
			<label class="checkbox-control">
				<input
					type="checkbox"
					checked={selectedElements[0].shadowEnabled}
					on:change={(e) => updateProperty('shadowEnabled', e.currentTarget.checked)}
				/>
				<span>Enable Shadow</span>
			</label>

			{#if selectedElements[0].shadowEnabled}
				<div class="shadow-controls">
					<div class="control-group">
						<label>Blur</label>
						<input
							type="range"
							min="0"
							max="50"
							value={selectedElements[0].shadowBlur}
							on:input={(e) => updateProperty('shadowBlur', Number(e.currentTarget.value))}
						/>
						<span class="value">{selectedElements[0].shadowBlur}px</span>
					</div>

					<div class="control-group">
						<label>Offset X</label>
						<input
							type="range"
							min="-50"
							max="50"
							value={selectedElements[0].shadowOffsetX}
							on:input={(e) => updateProperty('shadowOffsetX', Number(e.currentTarget.value))}
						/>
						<span class="value">{selectedElements[0].shadowOffsetX}px</span>
					</div>

					<div class="control-group">
						<label>Offset Y</label>
						<input
							type="range"
							min="-50"
							max="50"
							value={selectedElements[0].shadowOffsetY}
							on:input={(e) => updateProperty('shadowOffsetY', Number(e.currentTarget.value))}
						/>
						<span class="value">{selectedElements[0].shadowOffsetY}px</span>
					</div>

					<div class="control-group">
						<label>Opacity</label>
						<input
							type="range"
							min="0"
							max="100"
							value={selectedElements[0].shadowOpacity}
							on:input={(e) => updateProperty('shadowOpacity', Number(e.currentTarget.value))}
						/>
						<span class="value">{selectedElements[0].shadowOpacity}%</span>
					</div>
				</div>
			{/if}
		</div>
	{/if}

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
				on:click={() => {}}
			/>
		</div>
	</div>
{/if}

<style>
	.properties-panel {
		position: fixed;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		width: 220px;
		padding: 0;
		background: rgba(255, 255, 255, 0.98);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		z-index: 50;
		box-shadow: var(--shadow-xl);
		max-height: 85vh;
		overflow-y: auto;
		backdrop-filter: blur(12px) saturate(1.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.properties-panel:hover {
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
	}

	.panel-header {
		padding: var(--spacing-md) var(--spacing-md) var(--spacing-sm);
		border-bottom: 2px solid var(--color-border);
	}

	.panel-header h4 {
		margin: 0;
		font-size: 10px;
		font-weight: 700;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.8px;
	}

	.section {
		padding: var(--spacing-md);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section:last-child {
		border-bottom: none;
	}

	.button-row {
		display: flex;
		gap: var(--spacing-sm);
		flex-wrap: wrap;
	}

	[data-theme='dark'] .properties-panel {
		background: rgba(45, 55, 72, 0.98);
	}

	[data-theme='dark'] .section {
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}

	.opacity-control {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.opacity-control input[type='range'] {
		width: 100%;
		cursor: pointer;
		height: 6px;
		border-radius: var(--radius-full);
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		background: var(--color-border);
		transition: all 0.2s ease;
	}

	.opacity-control input[type='range']:hover {
		height: 8px;
	}

	.opacity-control input[type='range']::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-accent);
		cursor: pointer;
		border: 3px solid var(--color-surface);
		box-shadow: var(--shadow-md);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.opacity-control input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.2);
		box-shadow: var(--shadow-lg);
	}

	.opacity-control input[type='range']::-moz-range-thumb {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-accent);
		cursor: pointer;
		border: 3px solid var(--color-surface);
		box-shadow: var(--shadow-md);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.opacity-control input[type='range']::-moz-range-thumb:hover {
		transform: scale(1.2);
		box-shadow: var(--shadow-lg);
	}

	.opacity-values {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.opacity-values .current {
		font-weight: 700;
		color: var(--color-accent);
		font-size: 14px;
		background: var(--color-button-active);
		padding: 2px 8px;
		border-radius: var(--radius-sm);
	}

	.properties-panel::-webkit-scrollbar {
		width: 10px;
	}

	.properties-panel::-webkit-scrollbar-track {
		background: transparent;
		margin: var(--spacing-md) 0;
	}

	.properties-panel::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-full);
		border: 2px solid transparent;
		background-clip: padding-box;
		transition: all 0.2s ease;
	}

	.properties-panel::-webkit-scrollbar-thumb:hover {
		background: var(--color-accent);
		background-clip: padding-box;
		transform: scaleY(1.1);
	}


	.checkbox-control {
		display: flex;
		align-items: center;
		gap: var(--spacing-sm);
		cursor: pointer;
		margin-bottom: var(--spacing-sm);
	}

	.checkbox-control input[type='checkbox'] {
		cursor: pointer;
		width: 18px;
		height: 18px;
		accent-color: var(--color-accent);
	}

	.checkbox-control span {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}

	.shadow-controls {
		margin-top: var(--spacing-md);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm);
	}

	.control-group {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-xs);
	}

	.control-group label {
		font-size: 10px;
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.control-group input[type='range'] {
		width: 100%;
		cursor: pointer;
		height: 6px;
		border-radius: var(--radius-full);
		outline: none;
		appearance: none;
		-webkit-appearance: none;
		background: var(--color-border);
	}

	.control-group input[type='range']::-webkit-slider-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: var(--color-accent);
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
		border: 2px solid var(--color-surface);
		box-shadow: var(--shadow-md);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.control-group input[type='range']::-webkit-slider-thumb:hover {
		transform: scale(1.15);
		box-shadow: var(--shadow-lg);
	}

	.control-group .value {
		font-size: 12px;
		font-weight: 600;
		color: var(--color-accent);
		align-self: flex-end;
		min-width: 45px;
		text-align: right;
	}

</style>
