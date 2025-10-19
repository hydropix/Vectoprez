import { writable } from 'svelte/store';
import type { AppState, Theme } from '../engine/elements/types';
import { getInitialTheme } from '$lib/utils/theme';
import { COLOR_INDICES } from '$lib/utils/colorPalette';

const getInitialThemeValue = () => (typeof window !== 'undefined' ? getInitialTheme() : 'light');
const initialTheme = getInitialThemeValue();

const initialState: AppState = {
  scrollX: 0,
  scrollY: 0,
  zoom: 1.0,
  activeTool: 'selection',
  currentStrokeColorIndex: COLOR_INDICES.DEFAULT,
  currentBackgroundColorIndex: COLOR_INDICES.TRANSPARENT,
  currentFillStyle: 'hachure',
  currentStrokeWidth: 2,
  currentStrokeStyle: 'solid',
  currentRoughness: 0,
  currentOpacity: 100,
  currentShadowEnabled: false,
  currentShadowBlur: 10,
  currentShadowOffsetX: 0,
  currentShadowOffsetY: 2,
  currentShadowOpacity: 30,
  selectedElementIds: new Set(),
  hoveredElementId: null,
  viewBackgroundColor: initialTheme === 'light' ? '#F06E65' : '#1a1a1a',
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
    const bgColor = theme === 'light' ? '#F06E65' : '#1a1a1a';

    return {
      ...state,
      theme,
      viewBackgroundColor: bgColor,
    };
  });
}
