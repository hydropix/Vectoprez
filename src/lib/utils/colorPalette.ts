import type { Theme } from '$lib/engine/elements/types';

export type ColorIndex = number;

export const COLOR_INDICES = {
  DEFAULT: 0,
  GRAY: 1,
  RED: 2,
  GREEN: 3,
  BLUE: 4,
  ORANGE: 5,
  TRANSPARENT: -1,
} as const;

const LIGHT_THEME_LUT: string[] = [
  '#000000',
  '#6b7280',
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#f97316',
];

const DARK_THEME_LUT: string[] = [
  '#ffffff',
  '#6b7280',
  '#ef4444',
  '#10b981',
  '#3b82f6',
  '#f97316',
];

export function getColorFromIndex(index: ColorIndex, theme: Theme): string {
  if (index === COLOR_INDICES.TRANSPARENT) {
    return 'transparent';
  }

  const lut = theme === 'light' ? LIGHT_THEME_LUT : DARK_THEME_LUT;

  if (index < 0 || index >= lut.length) {
    return lut[COLOR_INDICES.DEFAULT];
  }

  return lut[index];
}

export function getColorPaletteForTheme(theme: Theme): string[] {
  return theme === 'light' ? [...LIGHT_THEME_LUT] : [...DARK_THEME_LUT];
}

export function getAllColorIndices(): ColorIndex[] {
  return [
    COLOR_INDICES.DEFAULT,
    COLOR_INDICES.GRAY,
    COLOR_INDICES.RED,
    COLOR_INDICES.GREEN,
    COLOR_INDICES.BLUE,
    COLOR_INDICES.ORANGE,
  ];
}
