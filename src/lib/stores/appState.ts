import { writable } from 'svelte/store';
import type { AppState, Theme } from '../engine/elements/types';
import { getInitialTheme } from '$lib/utils/theme';

const getInitialThemeValue = () => (typeof window !== 'undefined' ? getInitialTheme() : 'light');
const initialTheme = getInitialThemeValue();

const initialState: AppState = {
  scrollX: 0,
  scrollY: 0,
  zoom: 1.0,
  activeTool: 'selection',
  currentStrokeColor: initialTheme === 'light' ? '#000000' : '#ffffff',
  currentBackgroundColor: 'transparent',
  currentFillStyle: 'hachure',
  currentStrokeWidth: 1,
  currentStrokeStyle: 'solid',
  currentRoughness: 1,
  currentOpacity: 100,
  selectedElementIds: new Set(),
  viewBackgroundColor: initialTheme === 'light' ? '#ffffff' : '#1a1a1a',
  gridSize: null,
  isLibraryOpen: false,
  isPropertiesPanelOpen: false,
  theme: initialTheme,
};

export const appState = writable<AppState>(initialState);

// Helpers pour zoom/pan
export function setZoom(zoom: number) {
  appState.update(state => ({
    ...state,
    zoom: Math.max(0.1, Math.min(3.0, zoom)),
  }));
}

export function pan(dx: number, dy: number) {
  appState.update(state => ({
    ...state,
    scrollX: state.scrollX + dx,
    scrollY: state.scrollY + dy,
  }));
}

export function setTool(tool: AppState['activeTool']) {
  appState.update(state => ({ ...state, activeTool: tool }));
}

export function setTheme(theme: Theme) {
  appState.update(state => {
    // Update default stroke color based on theme
    const defaultStrokeColor = theme === 'light' ? '#000000' : '#ffffff';

    return {
      ...state,
      theme,
      currentStrokeColor: defaultStrokeColor,
    };
  });
}
