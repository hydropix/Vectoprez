<script lang="ts">
  import { get } from 'svelte/store';
  import { appState, setTool, setTheme } from '../stores/appState';
  import { elements } from '../stores/elements';
  import { exportToPNG, exportToJSON, downloadBlob, importFromJSON } from '../utils/export';
  import { applyTheme } from '$lib/utils/theme';
  import { history } from '$lib/engine/history/undoRedo';
  import ConfirmModal from './ConfirmModal.svelte';
  import IconButton from './IconButton.svelte';

  let showClearModal = false;

  function handleUndo() {
    const result = history.undo();
    if (result !== null) {
      elements.set(result);
    }
  }

  function handleRedo() {
    const result = history.redo();
    if (result !== null) {
      elements.set(result);
    }
  }

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
      icon="line"
      title="Line (L)"
      active={$appState.activeTool === 'line'}
      on:click={() => setTool('line')}
    />
    <IconButton
      icon="text"
      title="Text (T)"
      active={$appState.activeTool === 'text'}
      on:click={() => setTool('text')}
    />
  </div>

  <div class="separator"></div>

  <div class="tool-group">
    <IconButton
      icon="undo"
      title="Undo (Ctrl+Z)"
      disabled={!history.canUndo()}
      on:click={handleUndo}
    />
    <IconButton
      icon="redo"
      title="Redo (Ctrl+Y)"
      disabled={!history.canRedo()}
      on:click={handleRedo}
    />
  </div>

  <div class="separator"></div>

  <IconButton
    icon="grid"
    title="Toggle Grid"
    active={$appState.gridSize !== null}
    on:click={toggleGrid}
  />

  <div class="separator"></div>

  <IconButton
    icon="library"
    title="Library"
    active={$appState.isLibraryOpen}
    on:click={toggleLibrary}
  />

  <div class="separator"></div>

  <IconButton
    icon={$appState.theme === 'light' ? 'moon' : 'sun'}
    title="Toggle Theme"
    on:click={toggleTheme}
  />

  <div class="separator"></div>

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
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md) var(--spacing-lg);
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-lg);
    z-index: 100;
    backdrop-filter: blur(12px) saturate(1.2);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .toolbar:hover {
    box-shadow: var(--shadow-xl);
    transform: translateX(-50%) translateY(-2px);
  }

  .separator {
    width: 2px;
    height: 32px;
    background: var(--color-border);
    margin: 0 var(--spacing-xs);
    border-radius: var(--radius-full);
    opacity: 0.5;
  }

  .tool-group,
  .actions-group {
    display: flex;
    gap: var(--spacing-xs);
    align-items: center;
  }

  [data-theme='dark'] .toolbar {
    background: rgba(45, 55, 72, 0.95);
  }
</style>
