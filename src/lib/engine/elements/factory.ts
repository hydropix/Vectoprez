import { v4 as uuid } from 'uuid';
import type { ExcalidrawElement, ArrowElement, TextElement, BaseElement } from './types';
import { COLOR_INDICES } from '$lib/utils/colorPalette';

export function createElement(
  type: ExcalidrawElement['type'] | 'arrow' | 'text',
  x: number,
  y: number,
  width: number,
  height: number,
  options: Partial<BaseElement> = {}
): ExcalidrawElement | Partial<ArrowElement> | TextElement {
  const base = {
    id: uuid(),
    x,
    y,
    width,
    height,
    angle: 0,
    strokeColorIndex: options.strokeColorIndex ?? COLOR_INDICES.DEFAULT,
    backgroundColorIndex: options.backgroundColorIndex ?? COLOR_INDICES.TRANSPARENT,
    fillStyle: options.fillStyle ?? 'hachure',
    strokeWidth: options.strokeWidth ?? 2,
    strokeStyle: options.strokeStyle ?? 'solid',
    roughness: options.roughness ?? 0,
    opacity: options.opacity ?? 100,
    locked: options.locked ?? false,
    seed: Math.floor(Math.random() * 2 ** 31),
    parentId: null,
    originalBounds: null,
    ...options,
  };

  if (type === 'arrow') {
    return {
      ...base,
      type: 'arrow',
    } as Partial<ArrowElement>;
  }

  if (type === 'text') {
    return {
      ...base,
      type: 'text',
      text: '',
      fontSize: 20,
      fontFamily: 'Virgil, Segoe UI Emoji',
      textAlign: 'left',
      verticalAlign: 'top',
    } as TextElement;
  }

  return {
    ...base,
    type,
    childrenIds: [],
    isExpanded: false,
  } as ExcalidrawElement;
}
