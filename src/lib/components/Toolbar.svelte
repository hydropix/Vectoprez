<script lang="ts">
  import { get } from 'svelte/store';
  import { appState, setTool, setZoom, setTheme } from '../stores/appState';
  import { elements } from '../stores/elements';
  import { exportToPNG, exportToSVG, exportToJSON, downloadBlob, importFromJSON } from '../utils/export';
  import { applyTheme } from '$lib/utils/theme';

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

  function handleExportSVG() {
    try {
      const svg = exportToSVG(get(elements));
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      downloadBlob(blob, 'drawing.svg');
    } catch (error) {
      console.error('Export SVG failed:', error);
      alert('Export SVG failed. Make sure you have elements to export.');
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
  <button on:click={() => setTool('selection')}>Selection (V)</button>
  <button on:click={() => setTool('rectangle')}>Rectangle (R)</button>
  <button on:click={() => setTool('ellipse')}>Ellipse (O)</button>
  <button on:click={() => setTool('diamond')}>Diamond (D)</button>
  <button on:click={() => setTool('arrow')}>Arrow (A)</button>
  <button on:click={() => setTool('text')}>Text (T)</button>
  <button on:click={() => setTool('hand')}>Hand (H)</button>

  <div class="separator"></div>

  <button on:click={() => setZoom($appState.zoom * 1.2)}>Zoom +</button>
  <button on:click={() => setZoom($appState.zoom * 0.8)}>Zoom -</button>
  <button on:click={() => setZoom(1)}>100%</button>

  <div class="separator"></div>

  <button on:click={toggleGrid} class:active={$appState.gridSize !== null}>
    Grid {$appState.gridSize !== null ? '✓' : ''}
  </button>

  <div class="separator"></div>

  <button on:click={toggleTheme}>
    {$appState.theme === 'light' ? '🌙' : '☀️'}
  </button>

  <div class="separator"></div>

  <button on:click={toggleLibrary} class:active={$appState.isLibraryOpen}>
    Library {$appState.isLibraryOpen ? '✓' : ''}
  </button>

  <div class="separator"></div>

  <button on:click={handleExportPNG}>Export PNG</button>
  <button on:click={handleExportSVG}>Export SVG</button>
  <button on:click={handleExportJSON}>Save JSON</button>
  <button on:click={handleImportJSON}>Load JSON</button>
</div>

<style>
  .toolbar {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 8px;
    padding: 8px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    z-index: 10;
  }

  button {
    padding: 8px 12px;
    cursor: pointer;
    background: var(--color-background);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 2px;
    transition: background-color 0.2s;
  }

  button:hover {
    background: var(--color-button-hover);
  }

  button.active {
    background: var(--color-button-active);
    border-color: #4dabf7;
  }

  .separator {
    width: 1px;
    background: var(--color-border);
  }
</style>
