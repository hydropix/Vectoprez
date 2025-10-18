<script lang="ts">
	import { library, addToLibrary, removeFromLibrary } from '../stores/library';
	import { elements, addElement } from '../stores/elements';
	import { appState } from '../stores/appState';
	import { get } from 'svelte/store';
	import type { LibraryItem } from '../stores/library';

	function handleSaveToLibrary() {
		const selectedIds = Array.from(get(appState).selectedElementIds);
		if (selectedIds.length === 0) {
			alert('Select elements to save to library');
			return;
		}

		const selectedElements = get(elements).filter((el) => selectedIds.includes(el.id));
		const name = prompt('Library item name:') || 'Untitled';
		addToLibrary(name, selectedElements);
	}

	function handleInsertFromLibrary(item: LibraryItem) {
		// Ins�rer les �l�ments au centre du viewport
		const state = get(appState);
		const centerX = -state.scrollX / state.zoom;
		const centerY = -state.scrollY / state.zoom;

		// Calculer offset pour centrer
		const bounds = getItemBounds(item.elements);
		const offsetX = centerX - bounds.x - bounds.width / 2;
		const offsetY = centerY - bounds.y - bounds.height / 2;

		// Dupliquer et d�caler �l�ments
		const newElements = item.elements.map((el) => ({
			...el,
			id: crypto.randomUUID(),
			x: el.x + offsetX,
			y: el.y + offsetY
		}));

		newElements.forEach(addElement);
	}

	function getItemBounds(elements: LibraryItem['elements']) {
		let minX = Infinity,
			minY = Infinity,
			maxX = -Infinity,
			maxY = -Infinity;
		for (const el of elements) {
			minX = Math.min(minX, el.x);
			minY = Math.min(minY, el.y);
			maxX = Math.max(maxX, el.x + el.width);
			maxY = Math.max(maxY, el.y + el.height);
		}
		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}
</script>

{#if $appState.isLibraryOpen}
	<div class="library-panel">
		<div class="library-header">
			<h3>Library</h3>
			<button on:click={() => appState.update((s) => ({ ...s, isLibraryOpen: false }))}>
				Close
			</button>
		</div>

		<button class="save-button" on:click={handleSaveToLibrary}>
			Save Selection to Library
		</button>

		<div class="library-items">
			{#each $library as item (item.id)}
				<div class="library-item">
					<div class="item-preview">
						<!-- Miniature simplifi�e -->
						<div class="preview-placeholder">{item.elements.length} elements</div>
					</div>
					<div class="item-info">
						<span class="item-name">{item.name}</span>
						<div class="item-actions">
							<button on:click={() => handleInsertFromLibrary(item)}>Insert</button>
							<button on:click={() => removeFromLibrary(item.id)}>Delete</button>
						</div>
					</div>
				</div>
			{/each}

			{#if $library.length === 0}
				<p class="empty-state">No items in library. Select elements and save them!</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.library-panel {
		position: absolute;
		right: 10px;
		top: 10px;
		width: 300px;
		max-height: 80vh;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 4px;
		display: flex;
		flex-direction: column;
		z-index: 20;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.library-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px;
		border-bottom: 1px solid var(--color-border);
	}

	.library-header h3 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}

	.library-header button {
		background: transparent;
		color: var(--color-text);
		border: 1px solid var(--color-border);
		padding: 4px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 12px;
	}

	.library-header button:hover {
		background: var(--color-button-hover);
	}

	.save-button {
		margin: 12px;
		padding: 10px;
		background: #4dabf7;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-weight: 500;
		transition: background 0.2s;
	}

	.save-button:hover {
		background: #339af0;
	}

	.library-items {
		flex: 1;
		overflow-y: auto;
		padding: 12px;
	}

	.library-item {
		margin-bottom: 12px;
		padding: 8px;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		background: var(--color-button-hover);
	}

	.preview-placeholder {
		height: 80px;
		background: var(--color-background);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 8px;
		border-radius: 4px;
		border: 1px dashed var(--color-border);
		color: var(--color-text-secondary);
		font-size: 12px;
	}

	.item-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-name {
		font-weight: 500;
		font-size: 14px;
		color: var(--color-text);
	}

	.item-actions {
		display: flex;
		gap: 4px;
	}

	.item-actions button {
		padding: 4px 8px;
		font-size: 12px;
		cursor: pointer;
		border: 1px solid var(--color-border);
		border-radius: 3px;
		background: var(--color-background);
		transition: all 0.2s;
	}

	.item-actions button:hover {
		background: var(--color-button-hover);
	}

	.item-actions button:first-child {
		color: #4dabf7;
		border-color: #4dabf7;
	}

	.item-actions button:first-child:hover {
		background: #e7f5ff;
	}

	.item-actions button:last-child {
		color: #fa5252;
		border-color: #fa5252;
	}

	.item-actions button:last-child:hover {
		background: #fff5f5;
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 40px 20px;
		font-size: 14px;
		line-height: 1.5;
	}
</style>
