<script lang="ts">
  import { onMount } from 'svelte';
  import Canvas from '$lib/components/Canvas.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
  import Library from '$lib/components/Library.svelte';
  import { setupKeyboardShortcuts } from '$lib/utils/keyboard';
  import { setupAutoSave, loadFromStorage } from '$lib/utils/storage';
  import { elements } from '$lib/stores/elements';
  import { appState } from '$lib/stores/appState';
  import { applyTheme } from '$lib/utils/theme';
  import { get } from 'svelte/store';

  onMount(() => {
    setupKeyboardShortcuts();
    setupAutoSave();

    // Apply initial theme
    const initialTheme = get(appState).theme;
    applyTheme(initialTheme);

    // Charger sauvegarde si existe
    const saved = loadFromStorage();
    if (saved) {
      elements.set(saved.elements);
      appState.update(s => ({ ...s, ...saved.appState }));
      // Reapply theme if loaded from storage
      applyTheme(get(appState).theme);
      console.log('[App] Loaded auto-saved drawing');
    }
  });
</script>

<main>
  <Toolbar />
  <PropertiesPanel />
  <Library />
  <Canvas />
</main>

<style>
  main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
</style>
