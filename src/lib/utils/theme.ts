import type { Theme } from '$lib/engine/elements/types';

export interface ColorScheme {
  // UI colors
  background: string;
  surface: string;
  border: string;
  text: string;
  textSecondary: string;

  // Canvas colors
  canvasBackground: string;

  // Tool colors
  buttonHover: string;
  buttonActive: string;

  // Input colors
  inputBackground: string;
  inputBorder: string;
}

export const colorSchemes: Record<Theme, ColorScheme> = {
  light: {
    background: '#ffffff',
    surface: '#f8f9fa',
    border: '#dee2e6',
    text: '#212529',
    textSecondary: '#6c757d',
    canvasBackground: '#ffffff',
    buttonHover: '#e9ecef',
    buttonActive: '#dee2e6',
    inputBackground: '#ffffff',
    inputBorder: '#ced4da'
  },
  dark: {
    background: '#1a1a1a',
    surface: '#2d2d2d',
    border: '#404040',
    text: '#e9ecef',
    textSecondary: '#adb5bd',
    canvasBackground: '#1a1a1a',
    buttonHover: '#3d3d3d',
    buttonActive: '#4d4d4d',
    inputBackground: '#2d2d2d',
    inputBorder: '#404040'
  }
};

export function getColorScheme(theme: Theme): ColorScheme {
  return colorSchemes[theme];
}

export function applyTheme(theme: Theme): void {
  const scheme = getColorScheme(theme);
  const root = document.documentElement;

  // Apply CSS variables
  root.style.setProperty('--color-background', scheme.background);
  root.style.setProperty('--color-surface', scheme.surface);
  root.style.setProperty('--color-border', scheme.border);
  root.style.setProperty('--color-text', scheme.text);
  root.style.setProperty('--color-text-secondary', scheme.textSecondary);
  root.style.setProperty('--color-canvas-background', scheme.canvasBackground);
  root.style.setProperty('--color-button-hover', scheme.buttonHover);
  root.style.setProperty('--color-button-active', scheme.buttonActive);
  root.style.setProperty('--color-input-background', scheme.inputBackground);
  root.style.setProperty('--color-input-border', scheme.inputBorder);

  // Store theme preference
  localStorage.setItem('theme', theme);
}

export function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // Check system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }

  return 'light';
}
