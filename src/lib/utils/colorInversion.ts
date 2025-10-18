import type { Theme } from '$lib/engine/elements/types';

/**
 * Converts a display color back to its canonical storage value
 * This is the inverse of getThemedColor - used when creating elements
 *
 * In dark mode:
 * - If user sees white (#ffffff), store as black (#000000)
 * - If user sees near-black (#1a1a1a), store as white (#ffffff)
 * - Other colors remain unchanged
 */
export function getCanonicalColor(displayColor: string, theme: Theme): string {
  if (theme === 'light') {
    return displayColor;
  }

  // Normalize color to lowercase for comparison
  const normalizedColor = displayColor.toLowerCase().replace(/\s/g, '');

  // White displayed in dark mode = black stored
  if (normalizedColor === '#ffffff' || normalizedColor === '#fff' || normalizedColor === 'white') {
    return '#000000';
  }

  // Near-black displayed in dark mode = white stored
  if (normalizedColor === '#1a1a1a') {
    return '#ffffff';
  }

  // For other colors, we don't reverse the inversion
  // Keep them as-is since they're already canonical
  return displayColor;
}

/**
 * Inverts specific colors for dark mode to ensure visibility
 * Pure black becomes white, pure white becomes near-black
 */
export function getThemedColor(color: string, theme: Theme): string {
  if (theme === 'light') {
    return color;
  }

  // Normalize color to lowercase for comparison
  const normalizedColor = color.toLowerCase().replace(/\s/g, '');

  // Invert pure black to white
  if (normalizedColor === '#000000' || normalizedColor === '#000' || normalizedColor === 'black') {
    return '#ffffff';
  }

  // Invert pure white to light gray (not pure white to maintain some contrast)
  if (normalizedColor === '#ffffff' || normalizedColor === '#fff' || normalizedColor === 'white') {
    return '#1a1a1a';
  }

  // Invert very dark colors (close to black)
  if (isVeryDark(color)) {
    return lightenColor(color);
  }

  // Invert very light colors (close to white)
  if (isVeryLight(color)) {
    return darkenColor(color);
  }

  // Keep other colors as-is
  return color;
}

/**
 * Check if a color is very dark (close to black)
 */
function isVeryDark(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.2; // Very dark if luminance < 20%
}

/**
 * Check if a color is very light (close to white)
 */
function isVeryLight(color: string): boolean {
  const rgb = hexToRgb(color);
  if (!rgb) return false;

  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.8; // Very light if luminance > 80%
}

/**
 * Lighten a dark color for dark mode
 */
function lightenColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  // Invert and boost brightness
  const r = Math.min(255, 255 - rgb.r + 100);
  const g = Math.min(255, 255 - rgb.g + 100);
  const b = Math.min(255, 255 - rgb.b + 100);

  return rgbToHex(r, g, b);
}

/**
 * Darken a light color for dark mode
 */
function darkenColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  // Reduce brightness significantly
  const r = Math.max(0, rgb.r - 200);
  const g = Math.max(0, rgb.g - 200);
  const b = Math.max(0, rgb.b - 200);

  return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
