<script lang="ts">
	import { appState } from '../stores/appState';
	import { elements, updateElement } from '../stores/elements';
	import type { ExcalidrawElement, FillStyle, Roughness } from '../engine/elements/types';

	$: selectedIds = Array.from($appState.selectedElementIds);
	$: selectedElements = $elements.filter((el) => selectedIds.includes(el.id));
	$: hasSelection = selectedElements.length > 0;

	function updateProperty<K extends keyof ExcalidrawElement>(
		key: K,
		value: ExcalidrawElement[K]
	) {
		for (const id of selectedIds) {
			updateElement(id, { [key]: value } as any);
		}
	}

	function handleStrokeWidthChange(e: Event) {
		const val = Number((e.currentTarget as HTMLSelectElement).value);
		updateProperty('strokeWidth', val as 1 | 2 | 4);
	}

	function handleFillStyleChange(e: Event) {
		const val = (e.currentTarget as HTMLSelectElement).value as FillStyle;
		updateProperty('fillStyle', val);
	}

	function handleRoughnessChange(e: Event) {
		const val = Number((e.currentTarget as HTMLSelectElement).value) as Roughness;
		updateProperty('roughness', val);
	}
</script>

{#if hasSelection}
	<div class="properties-panel">
		<h4>Properties ({selectedElements.length} selected)</h4>

		<div class="property">
			<label>Stroke Color</label>
			<input
				type="color"
				value={selectedElements[0].strokeColor}
				on:input={(e) => updateProperty('strokeColor', e.currentTarget.value)}
			/>
		</div>

		<div class="property">
			<label>Background</label>
			<div class="color-group">
				<input
					type="color"
					value={selectedElements[0].backgroundColor === 'transparent'
						? '#ffffff'
						: selectedElements[0].backgroundColor}
					on:input={(e) => updateProperty('backgroundColor', e.currentTarget.value)}
				/>
				<button on:click={() => updateProperty('backgroundColor', 'transparent')}>
					Transparent
				</button>
			</div>
		</div>

		<div class="property">
			<label>Stroke Width</label>
			<select value={selectedElements[0].strokeWidth} on:change={handleStrokeWidthChange}>
				<option value={1}>Thin (1px)</option>
				<option value={2}>Bold (2px)</option>
				<option value={4}>Extra Bold (4px)</option>
			</select>
		</div>

		<div class="property">
			<label>Fill Style</label>
			<select value={selectedElements[0].fillStyle} on:change={handleFillStyleChange}>
				<option value="hachure">Hachure</option>
				<option value="cross-hatch">Cross-hatch</option>
				<option value="solid">Solid</option>
			</select>
		</div>

		<div class="property">
			<label>Roughness</label>
			<select value={selectedElements[0].roughness} on:change={handleRoughnessChange}>
				<option value={0}>Architect (0)</option>
				<option value={1}>Artist (1)</option>
				<option value={2}>Cartoonist (2)</option>
			</select>
		</div>

		<div class="property">
			<label>Opacity</label>
			<div class="slider-group">
				<input
					type="range"
					min="0"
					max="100"
					value={selectedElements[0].opacity}
					on:input={(e) => updateProperty('opacity', Number(e.currentTarget.value))}
				/>
				<span class="slider-value">{selectedElements[0].opacity}%</span>
			</div>
		</div>

		<div class="property">
			<label>Position & Size</label>
			<div class="position-grid">
				<div class="position-item">
					<span class="position-label">X:</span>
					<input
						type="number"
						value={Math.round(selectedElements[0].x)}
						on:input={(e) => updateProperty('x', Number(e.currentTarget.value))}
					/>
				</div>
				<div class="position-item">
					<span class="position-label">Y:</span>
					<input
						type="number"
						value={Math.round(selectedElements[0].y)}
						on:input={(e) => updateProperty('y', Number(e.currentTarget.value))}
					/>
				</div>
				<div class="position-item">
					<span class="position-label">W:</span>
					<input
						type="number"
						value={Math.round(selectedElements[0].width)}
						on:input={(e) => updateProperty('width', Number(e.currentTarget.value))}
					/>
				</div>
				<div class="position-item">
					<span class="position-label">H:</span>
					<input
						type="number"
						value={Math.round(selectedElements[0].height)}
						on:input={(e) => updateProperty('height', Number(e.currentTarget.value))}
					/>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.properties-panel {
		position: absolute;
		left: 10px;
		top: 70px;
		width: 250px;
		padding: 12px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		z-index: 20;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		max-height: calc(100vh - 90px);
		overflow-y: auto;
	}

	.properties-panel h4 {
		margin: 0 0 16px 0;
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.property {
		margin-bottom: 14px;
	}

	.property label {
		display: block;
		margin-bottom: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-secondary);
	}

	.property input[type='color'] {
		width: 100%;
		height: 36px;
		padding: 2px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		cursor: pointer;
	}

	.property input[type='number'] {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--color-input-border);
		background: var(--color-input-background);
		color: var(--color-text);
		border-radius: 4px;
		font-size: 12px;
	}

	.property select {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid var(--color-input-border);
		background: var(--color-input-background);
		color: var(--color-text);
		border-radius: 4px;
		font-size: 12px;
		cursor: pointer;
	}

	.color-group {
		display: flex;
		gap: 6px;
	}

	.color-group input {
		flex: 1;
	}

	.color-group button {
		padding: 6px 12px;
		font-size: 11px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-background);
		color: var(--color-text);
		cursor: pointer;
		white-space: nowrap;
	}

	.color-group button:hover {
		background: var(--color-button-hover);
	}

	.slider-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.slider-group input[type='range'] {
		flex: 1;
		cursor: pointer;
	}

	.slider-value {
		font-size: 12px;
		color: var(--color-text-secondary);
		min-width: 40px;
		text-align: right;
	}

	.position-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.position-item {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.position-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--color-text-secondary);
		min-width: 16px;
	}

	.position-item input {
		width: 100%;
		padding: 4px 6px;
		border: 1px solid var(--color-input-border);
		background: var(--color-input-background);
		color: var(--color-text);
		border-radius: 3px;
		font-size: 11px;
	}
</style>
