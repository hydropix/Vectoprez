import { get } from 'svelte/store';
import { elements } from '../stores/elements';
import { appState } from '../stores/appState';
import type { ExcalidrawFile } from './export';

const STORAGE_KEY = 'excalidraw-autosave';
const AUTOSAVE_INTERVAL = 5000; // 5 secondes

export function setupAutoSave() {
  setInterval(() => {
    const currentElements = get(elements);
    const currentAppState = get(appState);
    const data: ExcalidrawFile = {
      type: 'excalidraw',
      version: 1,
      elements: currentElements,
      appState: currentAppState,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      console.log('[AutoSave] Saved successfully');
    } catch (error) {
      console.error('[AutoSave] Failed to save:', error);
    }
  }, AUTOSAVE_INTERVAL);
}

export function loadFromStorage(): ExcalidrawFile | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  try {
    const data: ExcalidrawFile = JSON.parse(saved);
    console.log('[Storage] Loaded successfully');
    return data;
  } catch (error) {
    console.error('[Storage] Failed to load:', error);
    return null;
  }
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('[Storage] Cleared successfully');
}
