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
		const state = get(appState);
		const centerX = -state.scrollX / state.zoom;
		const centerY = -state.scrollY / state.zoom;

		const bounds = getItemBounds(item.elements);
		const offsetX = centerX - bounds.x - bounds.width / 2;
		const offsetY = centerY - bounds.y - bounds.height / 2;

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
		right: 24px;
		top: 24px;
		width: 320px;
		max-height: 85vh;
		background: rgba(255, 255, 255, 0.98);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-xl);
		display: flex;
		flex-direction: column;
		z-index: 20;
		box-shadow: var(--shadow-xl);
		backdrop-filter: blur(12px) saturate(1.2);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.library-panel:hover {
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.2);
	}

	[data-theme='dark'] .library-panel {
		background: rgba(45, 55, 72, 0.98);
	}

	.library-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--spacing-lg);
		border-bottom: 2px solid var(--color-border);
	}

	.library-header h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.3px;
	}

	.library-header button {
		background: var(--color-surface);
		color: var(--color-text);
		border: 2px solid var(--color-border);
		padding: 6px 16px;
		border-radius: var(--radius-full);
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.library-header button:hover {
		background: var(--color-button-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.save-button {
		margin: var(--spacing-lg);
		padding: 12px;
		background: var(--color-accent);
		color: white;
		border: none;
		border-radius: var(--radius-lg);
		cursor: pointer;
		font-weight: 600;
		font-size: 14px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
		letter-spacing: 0.2px;
	}

	.save-button:hover {
		background: var(--color-accent-hover);
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.save-button:active {
		transform: translateY(0);
	}

	.library-items {
		flex: 1;
		overflow-y: auto;
		padding: var(--spacing-md);
	}

	.library-item {
		margin-bottom: var(--spacing-md);
		padding: var(--spacing-md);
		border: 2px solid var(--color-border);
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: var(--shadow-sm);
	}

	.library-item:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
		border-color: var(--color-accent);
	}

	.preview-placeholder {
		height: 90px;
		background: var(--color-background);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--spacing-md);
		border-radius: var(--radius-md);
		border: 2px dashed var(--color-border);
		color: var(--color-text-secondary);
		font-size: 12px;
		font-weight: 600;
		transition: all 0.2s ease;
	}

	.library-item:hover .preview-placeholder {
		border-color: var(--color-accent);
		background: var(--color-button-active);
	}

	.item-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.item-name {
		font-weight: 600;
		font-size: 14px;
		color: var(--color-text);
	}

	.item-actions {
		display: flex;
		gap: var(--spacing-xs);
	}

	.item-actions button {
		padding: 6px 12px;
		font-size: 12px;
		cursor: pointer;
		border: 2px solid var(--color-border);
		border-radius: var(--radius-full);
		background: var(--color-surface);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		font-weight: 600;
		box-shadow: var(--shadow-sm);
	}

	.item-actions button:hover {
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}

	.item-actions button:active {
		transform: translateY(0);
	}

	.item-actions button:first-child {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.item-actions button:first-child:hover {
		background: var(--color-button-active);
	}

	.item-actions button:last-child {
		color: var(--color-danger);
		border-color: var(--color-danger);
	}

	.item-actions button:last-child:hover {
		background: var(--color-danger-bg);
	}

	.empty-state {
		text-align: center;
		color: var(--color-text-secondary);
		padding: 60px 20px;
		font-size: 14px;
		line-height: 1.6;
		font-weight: 500;
	}

	.library-items::-webkit-scrollbar {
		width: 10px;
	}

	.library-items::-webkit-scrollbar-track {
		background: transparent;
		margin: var(--spacing-md) 0;
	}

	.library-items::-webkit-scrollbar-thumb {
		background: var(--color-border);
		border-radius: var(--radius-full);
		border: 2px solid transparent;
		background-clip: padding-box;
		transition: all 0.2s ease;
	}

	.library-items::-webkit-scrollbar-thumb:hover {
		background: var(--color-accent);
		background-clip: padding-box;
	}
</style>
