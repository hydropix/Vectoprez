import { writable } from 'svelte/store';
import type { AnyExcalidrawElement } from '../engine/elements/types';
import { validateAndFixHierarchyOrder } from '../engine/rendering/layering';

export const elements = writable<AnyExcalidrawElement[]>([]);

export function addElement(element: AnyExcalidrawElement) {
  elements.update(els => {
    const updated = [...els, element];
    return validateAndFixHierarchyOrder(updated);
  });
}

export function updateElement(id: string, updates: Partial<AnyExcalidrawElement>) {
  elements.update(els => {
    const updated = els.map(el => (el.id === id ? { ...el, ...updates } as AnyExcalidrawElement : el));
    return validateAndFixHierarchyOrder(updated);
  });
}

export function deleteElements(ids: string[]) {
  elements.update(els => {
    const updated = els.filter(el => !ids.includes(el.id));
    return validateAndFixHierarchyOrder(updated);
  });
}

export function clearElements() {
  elements.set([]);
}
