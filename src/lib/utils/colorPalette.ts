import type { Theme } from '$lib/engine/elements/types';

export type ColorIndex = number;

export const COLOR_INDICES = {
  DEFAULT: 0,
  CREAM: 1,
  NAVY: 2,
  BEIGE: 3,
  CORAL: 4,
  LIME: 5,
  PURPLE: 6,
  ORANGE: 7,
  MINT: 8,
  TRANSPARENT: -1,
} as const;

const LIGHT_THEME_LUT: string[] = [
  '#2d2d2d',
  '#ffffff',
  '#1F92AF',
  '#e6a84e',
  '#D35869',
  '#7cb342',
  '#9c27b0',
  '#ff6f00',
  '#26a69a',
];

const DARK_THEME_LUT: string[] = [
  '#f5f5f5',
  '#9ca3af',
  '#4FC3F7',
  '#FFD54F',
  '#FF7597',
  '#A8D96F',
  '#ce93d8',
  '#ffb74d',
  '#4db6ac',
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
    COLOR_INDICES.CREAM,
    COLOR_INDICES.NAVY,
    COLOR_INDICES.BEIGE,
    COLOR_INDICES.CORAL,
    COLOR_INDICES.LIME,
    COLOR_INDICES.PURPLE,
    COLOR_INDICES.ORANGE,
    COLOR_INDICES.MINT,
  ];
}
