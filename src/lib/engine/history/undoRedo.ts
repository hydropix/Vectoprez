import { writable, derived } from 'svelte/store';
import type { AnyExcalidrawElement } from '../elements/types';
import { MAX_HISTORY } from '$lib/constants';

interface HistoryEntry {
  elements: AnyExcalidrawElement[];
}

interface HistoryState {
  pastLength: number;
  futureLength: number;
}

class History {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private state = writable<HistoryState>({ pastLength: 0, futureLength: 0 });

  private updateState() {
    this.state.set({
      pastLength: this.past.length,
      futureLength: this.future.length,
    });
  }

  record(elements: AnyExcalidrawElement[]) {
    const entry: HistoryEntry = {
      elements: structuredClone(elements),
    };

    this.past.push(entry);
    if (this.past.length > MAX_HISTORY) {
      this.past.shift();
    }

    this.future = [];
    this.updateState();
  }

  undo(): AnyExcalidrawElement[] | null {
    const entry = this.past.pop();
    if (!entry) return null;

    this.future.push(entry);
    const previous = this.past[this.past.length - 1];
    this.updateState();
    return previous ? previous.elements : [];
  }

  redo(): AnyExcalidrawElement[] | null {
    const entry = this.future.pop();
    if (!entry) return null;

    this.past.push(entry);
    this.updateState();
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
    this.updateState();
  }

  getState() {
    return this.state;
  }
}

export const history = new History();

export const canUndo = derived(history.getState(), ($state) => $state.pastLength > 1);
export const canRedo = derived(history.getState(), ($state) => $state.futureLength > 0);
