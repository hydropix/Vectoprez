<script lang="ts">
  import { get } from 'svelte/store';
  import { appState, setTool, setTheme } from '../stores/appState';
  import { elements } from '../stores/elements';
  import { exportToPNG, exportToJSON, downloadBlob, importFromJSON } from '../utils/export';
  import { applyTheme } from '$lib/utils/theme';
  import ConfirmModal from './ConfirmModal.svelte';
  import IconButton from './IconButton.svelte';

  let showClearModal = false;

  async function handleExportPNG() {
    try {
      const blob = await exportToPNG(get(elements), {
        backgroundColor: get(appState).viewBackgroundColor,
      });
      downloadBlob(blob, 'drawing.png');
    } catch (error) {
      console.error('Export PNG failed:', error);
      alert('Export PNG failed. Make sure you have elements to export.');
    }
  }

  function handleExportJSON() {
    try {
      const json = exportToJSON(get(elements), get(appState));
      const blob = new Blob([json], { type: 'application/json' });
      downloadBlob(blob, 'drawing.excalidraw');
    } catch (error) {
      console.error('Export JSON failed:', error);
      alert('Export JSON failed.');
    }
  }

  function handleImportJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.excalidraw,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = importFromJSON(text);

        if (confirm('Load this file? Current drawing will be replaced.')) {
          elements.set(data.elements);
          appState.update(s => ({ ...s, ...data.appState }));
        }
      } catch (error) {
        console.error('Import failed:', error);
        alert('Import failed. Invalid file format.');
      }
    };
    input.click();
  }

  function handleClearClick() {
    showClearModal = true;
  }

  function handleClearConfirm() {
    elements.set([]);
    appState.update(s => ({ ...s, selectedElementIds: new Set() }));
    showClearModal = false;
  }

  function handleClearCancel() {
    showClearModal = false;
  }

  function toggleGrid() {
    appState.update(s => ({
      ...s,
      gridSize: s.gridSize === null ? 20 : null,
    }));
  }

  function toggleLibrary() {
    appState.update(s => ({ ...s, isLibraryOpen: !s.isLibraryOpen }));
  }

  function toggleTheme() {
    const newTheme = $appState.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
  }
</script>

<div class="toolbar">
  <!-- Lock/Unlock toggle (removed - not in current AppState) -->

  <!-- Tools -->
  <div class="tool-group">
    <IconButton
      icon="hand"
      title="Hand Tool (H) - Pan around"
      active={$appState.activeTool === 'hand'}
      on:click={() => setTool('hand')}
    />
    <IconButton
      icon="selection"
      title="Selection (V)"
      active={$appState.activeTool === 'selection'}
      on:click={() => setTool('selection')}
    />
  </div>

  <div class="separator"></div>

  <!-- Shapes -->
  <div class="tool-group">
    <IconButton
      icon="rectangle"
      title="Rectangle (R)"
      active={$appState.activeTool === 'rectangle'}
      on:click={() => setTool('rectangle')}
    />
    <IconButton
      icon="ellipse"
      title="Ellipse (O)"
      active={$appState.activeTool === 'ellipse'}
      on:click={() => setTool('ellipse')}
    />
    <IconButton
      icon="arrow"
      title="Arrow (A)"
      active={$appState.activeTool === 'arrow'}
      on:click={() => setTool('arrow')}
    />
    <IconButton
      icon="text"
      title="Text (T)"
      active={$appState.activeTool === 'text'}
      on:click={() => setTool('text')}
    />
  </div>

  <div class="separator"></div>

  <!-- View options -->
  <IconButton
    icon="grid"
    title="Toggle Grid"
    active={$appState.gridSize !== null}
    on:click={toggleGrid}
  />

  <div class="separator"></div>

  <!-- Library -->
  <IconButton
    icon="library"
    title="Library"
    active={$appState.isLibraryOpen}
    on:click={toggleLibrary}
  />

  <div class="separator"></div>

  <!-- Theme -->
  <IconButton
    icon={$appState.theme === 'light' ? 'moon' : 'sun'}
    title="Toggle Theme"
    on:click={toggleTheme}
  />

  <div class="separator"></div>

  <!-- Actions -->
  <div class="actions-group">
    <IconButton
      icon="trash"
      title="Clear Canvas"
      variant="danger"
      on:click={handleClearClick}
    />
    <IconButton
      icon="download"
      title="Export PNG"
      on:click={handleExportPNG}
    />
    <IconButton
      icon="save"
      title="Save JSON"
      on:click={handleExportJSON}
    />
    <IconButton
      icon="upload"
      title="Load JSON"
      on:click={handleImportJSON}
    />
  </div>
</div>

<ConfirmModal
  bind:isOpen={showClearModal}
  title="Clear Canvas?"
  message="This will delete all elements from your canvas. This action cannot be undone."
  confirmText="Clear"
  cancelText="Cancel"
  onConfirm={handleClearConfirm}
  onCancel={handleClearCancel}
/>

<style>
  .toolbar {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
    z-index: 100;
  }

  .separator {
    width: 1px;
    height: 28px;
    background: var(--color-border);
    margin: 0 4px;
  }

  .tool-group,
  .actions-group {
    display: flex;
    gap: 4px;
  }
</style>
