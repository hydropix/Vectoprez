import { v4 as uuid } from 'uuid';
import type { ExcalidrawElement, ArrowElement, TextElement, BaseElement } from './types';

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
    strokeColor: options.strokeColor ?? '#000000',
    backgroundColor: options.backgroundColor ?? 'transparent',
    fillStyle: options.fillStyle ?? 'hachure',
    strokeWidth: options.strokeWidth ?? 1,
    strokeStyle: options.strokeStyle ?? 'solid',
    roughness: options.roughness ?? 1,
    opacity: options.opacity ?? 100,
    locked: options.locked ?? false,
    seed: Math.floor(Math.random() * 2 ** 31),
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
      binding: null,
    } as TextElement;
  }

  return {
    ...base,
    type,
    boundElements: [],
  } as ExcalidrawElement;
}
