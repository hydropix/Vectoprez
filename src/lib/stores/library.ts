import { writable } from 'svelte/store';
import type { AnyExcalidrawElement } from '../engine/elements/types';
import { STORAGE_KEY_LIBRARY } from '$lib/constants';

export interface LibraryItem {
	id: string;
	name: string;
	elements: AnyExcalidrawElement[];
	createdAt: number;
}

function loadLibrary(): LibraryItem[] {
	if (typeof window === 'undefined') return [];
	const saved = localStorage.getItem(STORAGE_KEY_LIBRARY);
	if (!saved) return [];
	try {
		return JSON.parse(saved);
	} catch {
		return [];
	}
}

function saveLibrary(items: LibraryItem[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY_LIBRARY, JSON.stringify(items));
}

export const library = writable<LibraryItem[]>(loadLibrary());

library.subscribe((items) => {
	saveLibrary(items);
});

export function addToLibrary(name: string, elements: AnyExcalidrawElement[]) {
	const item: LibraryItem = {
		id: crypto.randomUUID(),
		name,
		elements: structuredClone(elements),
		createdAt: Date.now()
	};
	library.update((items) => [item, ...items]);
}

export function removeFromLibrary(id: string) {
	library.update((items) => items.filter((item) => item.id !== id));
}
