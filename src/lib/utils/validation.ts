import type { AnyExcalidrawElement, AppState, ToolType, FillStyle, StrokeStyle, Roughness } from '../engine/elements/types';
import type { ExcalidrawFile } from './export';

/**
 * Validate if a value is a valid ToolType
 */
function isValidToolType(value: unknown): value is ToolType {
  const validTools: ToolType[] = ['selection', 'rectangle', 'ellipse', 'arrow', 'line', 'draw', 'text', 'eraser', 'hand'];
  return typeof value === 'string' && validTools.includes(value as ToolType);
}

/**
 * Validate if a value is a valid FillStyle
 */
function isValidFillStyle(value: unknown): value is FillStyle {
  return value === 'hachure' || value === 'cross-hatch' || value === 'solid';
}

/**
 * Validate if a value is a valid StrokeStyle
 */
function isValidStrokeStyle(value: unknown): value is StrokeStyle {
  return value === 'solid' || value === 'dashed' || value === 'dotted';
}

/**
 * Validate if a value is a valid Roughness
 */
function isValidRoughness(value: unknown): value is Roughness {
  return value === 0 || value === 1 || value === 2;
}

/**
 * Validate if a value is a valid stroke width
 */
function isValidStrokeWidth(value: unknown): value is 1 | 2 | 4 {
  return value === 1 || value === 2 || value === 4;
}

/**
 * Validate if an object has the basic element properties
 */
function isValidBaseElement(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  const el = obj as any;

  return (
    typeof el.id === 'string' &&
    typeof el.x === 'number' &&
    typeof el.y === 'number' &&
    typeof el.width === 'number' &&
    typeof el.height === 'number' &&
    typeof el.angle === 'number' &&
    typeof el.strokeColor === 'string' &&
    typeof el.backgroundColor === 'string' &&
    isValidFillStyle(el.fillStyle) &&
    isValidStrokeWidth(el.strokeWidth) &&
    isValidStrokeStyle(el.strokeStyle) &&
    isValidRoughness(el.roughness) &&
    typeof el.opacity === 'number' &&
    typeof el.locked === 'boolean' &&
    typeof el.seed === 'number'
  );
}

/**
 * Validate if an object is a valid element
 */
function isValidElement(obj: unknown): boolean {
  if (!isValidBaseElement(obj)) return false;

  const el = obj as any;
  const validTypes = ['rectangle', 'ellipse', 'line', 'arrow', 'text'];

  if (!validTypes.includes(el.type)) return false;

  // Type-specific validation
  if (el.type === 'arrow') {
    if (!Array.isArray(el.points) || el.points.length < 2) return false;
    for (const point of el.points) {
      if (typeof point.x !== 'number' || typeof point.y !== 'number') return false;
    }
  }

  if (el.type === 'text') {
    if (
      typeof el.text !== 'string' ||
      typeof el.fontSize !== 'number' ||
      typeof el.fontFamily !== 'string' ||
      typeof el.textAlign !== 'string' ||
      typeof el.verticalAlign !== 'string'
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validate if an array contains valid elements
 */
function areValidElements(arr: unknown): arr is AnyExcalidrawElement[] {
  if (!Array.isArray(arr)) return false;
  return arr.every(isValidElement);
}

/**
 * Validate if an object is a valid AppState (partial validation)
 */
function isValidAppState(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;

  const state = obj as any;

  // Only validate properties that are present
  if (state.scrollX !== undefined && typeof state.scrollX !== 'number') return false;
  if (state.scrollY !== undefined && typeof state.scrollY !== 'number') return false;
  if (state.zoom !== undefined && typeof state.zoom !== 'number') return false;
  if (state.activeTool !== undefined && !isValidToolType(state.activeTool)) return false;
  if (state.currentStrokeColor !== undefined && typeof state.currentStrokeColor !== 'string') return false;
  if (state.currentBackgroundColor !== undefined && typeof state.currentBackgroundColor !== 'string') return false;
  if (state.currentFillStyle !== undefined && !isValidFillStyle(state.currentFillStyle)) return false;
  if (state.currentStrokeWidth !== undefined && !isValidStrokeWidth(state.currentStrokeWidth)) return false;
  if (state.currentRoughness !== undefined && !isValidRoughness(state.currentRoughness)) return false;
  if (state.currentOpacity !== undefined && typeof state.currentOpacity !== 'number') return false;

  return true;
}

/**
 * Validate an Excalidraw file structure
 */
export function validateExcalidrawFile(data: unknown): data is ExcalidrawFile {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid file: not an object');
  }

  const file = data as any;

  if (file.type !== 'excalidraw') {
    throw new Error('Invalid file: not an Excalidraw file');
  }

  if (typeof file.version !== 'number') {
    throw new Error('Invalid file: missing or invalid version');
  }

  if (!areValidElements(file.elements)) {
    throw new Error('Invalid file: elements array is invalid');
  }

  if (!isValidAppState(file.appState)) {
    throw new Error('Invalid file: appState is invalid');
  }

  return true;
}

/**
 * Sanitize elements to ensure they have valid values
 */
export function sanitizeElements(elements: unknown[]): AnyExcalidrawElement[] {
  return elements.filter(isValidElement) as AnyExcalidrawElement[];
}

/**
 * Sanitize app state to ensure it has valid values
 */
export function sanitizeAppState(state: Partial<AppState>): Partial<AppState> {
  const sanitized: Partial<AppState> = {};

  if (typeof state.scrollX === 'number') sanitized.scrollX = state.scrollX;
  if (typeof state.scrollY === 'number') sanitized.scrollY = state.scrollY;
  if (typeof state.zoom === 'number') sanitized.zoom = Math.max(0.1, Math.min(3.0, state.zoom));
  if (isValidToolType(state.activeTool)) sanitized.activeTool = state.activeTool;
  if (typeof state.currentStrokeColorIndex === 'number') sanitized.currentStrokeColorIndex = state.currentStrokeColorIndex;
  if (typeof state.currentBackgroundColorIndex === 'number') sanitized.currentBackgroundColorIndex = state.currentBackgroundColorIndex;
  if (isValidFillStyle(state.currentFillStyle)) sanitized.currentFillStyle = state.currentFillStyle;
  if (isValidStrokeWidth(state.currentStrokeWidth)) sanitized.currentStrokeWidth = state.currentStrokeWidth;
  if (isValidRoughness(state.currentRoughness)) sanitized.currentRoughness = state.currentRoughness;
  if (typeof state.currentOpacity === 'number') sanitized.currentOpacity = Math.max(0, Math.min(100, state.currentOpacity));

  return sanitized;
}
