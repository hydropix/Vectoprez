import type { Theme } from '$lib/engine/elements/types';

export type ColorIndex = number;

export const COLOR_INDICES = {
  DEFAULT: 0,
  CREAM: 1,
  NAVY: 2,
  TEAL: 3,
  BEIGE: 4,
  BROWN: 5,
  CORAL: 6,
  MAGENTA: 7,
  LIME: 8,
  TRANSPARENT: -1,
} as const;

const LIGHT_THEME_LUT: string[] = [
  '#2d2d2d',
  '#ffffff',
  '#1F92AF',
  '#2eb8b8',
  '#e6a84e',
  '#CA7F58',
  '#D35869',
  '#d4478f',
  '#7cb342',
];

const DARK_THEME_LUT: string[] = [
  '#f5f5f5',
  '#9ca3af',
  '#4FC3F7',
  '#63D8E2',
  '#FFD54F',
  '#FFAB91',
  '#FF7597',
  '#E85D9A',
  '#A8D96F',
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
    COLOR_INDICES.TEAL,
    COLOR_INDICES.BEIGE,
    COLOR_INDICES.BROWN,
    COLOR_INDICES.CORAL,
    COLOR_INDICES.MAGENTA,
    COLOR_INDICES.LIME,
  ];
}
