import type { AnyExcalidrawElement } from '../elements/types';
import { MAX_HISTORY } from '$lib/constants';

interface HistoryEntry {
  elements: AnyExcalidrawElement[];
}

class History {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];

  record(elements: AnyExcalidrawElement[]) {
    // Deep copy to avoid mutations - structuredClone preserves Sets, Maps, etc.
    const entry: HistoryEntry = {
      elements: structuredClone(elements),
    };

    this.past.push(entry);
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }

    // Clear future when a new action is performed
    this.future = [];
  }

  undo(): AnyExcalidrawElement[] | null {
    const entry = this.past.pop();
    if (!entry) return null;

    this.future.push(entry);
    const previous = this.past[this.past.length - 1];
    return previous ? previous.elements : [];
  }

  redo(): AnyExcalidrawElement[] | null {
    const entry = this.future.pop();
    if (!entry) return null;

    this.past.push(entry);
    return entry.elements;
  }

  canUndo(): boolean {
    return this.past.length > 1;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear() {
    this.past = [];
    this.future = [];
  }
}

export const history = new History();
