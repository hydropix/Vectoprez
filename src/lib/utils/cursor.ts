import type { AppState } from '../engine/elements/types';

/**
 * Type de curseur pour différentes actions
 */
export type CursorType =
  | 'default'
  | 'crosshair'
  | 'pointer'
  | 'grab'
  | 'grabbing'
  | 'move'
  | 'text'
  | 'nwse-resize'
  | 'nesw-resize'
  | 'ns-resize'
  | 'ew-resize';

/**
 * Retourne le curseur approprié basé sur l'outil actif et l'état de l'interaction
 */
export function getCursor(params: {
  activeTool: AppState['activeTool'];
  isPanning?: boolean;
  isDragging?: boolean;
  isDraggingHandle?: boolean;
  isDrawing?: boolean;
  isEditingText?: boolean;
  isOverElement?: boolean;
  isOverHandle?: boolean;
}): CursorType {
  const {
    activeTool,
    isPanning,
    isDragging,
    isDraggingHandle,
    isDrawing,
    isEditingText,
    isOverElement,
    isOverHandle,
  } = params;

  // États prioritaires
  if (isEditingText) {
    return 'text';
  }

  if (isPanning) {
    return 'grabbing';
  }

  if (isDragging) {
    return 'move';
  }

  if (isDraggingHandle) {
    return 'move';
  }

  if (isDrawing) {
    return 'crosshair';
  }

  // Curseurs basés sur l'outil actif
  switch (activeTool) {
    case 'selection':
      if (isOverHandle) {
        return 'move';
      }
      if (isOverElement) {
        return 'move';
      }
      return 'default';

    case 'hand':
      return 'grab';

    case 'rectangle':
    case 'ellipse':
    case 'arrow':
      return 'crosshair';

    case 'text':
      return 'text';

    default:
      return 'default';
  }
}

/**
 * Convertit un CursorType en valeur CSS
 */
export function getCursorCSS(cursor: CursorType): string {
  return cursor;
}
