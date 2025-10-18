import { writable } from 'svelte/store';
import type { AnyExcalidrawElement } from '../engine/elements/types';

export const elements = writable<AnyExcalidrawElement[]>([]);

// Helpers
export function addElement(element: AnyExcalidrawElement) {
  elements.update(els => [...els, element]);
}

export function updateElement(id: string, updates: Partial<AnyExcalidrawElement>) {
  elements.update(els =>
    els.map(el => (el.id === id ? { ...el, ...updates } as AnyExcalidrawElement : el))
  );
}

export function deleteElements(ids: string[]) {
  elements.update(els => els.filter(el => !ids.includes(el.id)));
}

export function clearElements() {
  elements.set([]);
}
