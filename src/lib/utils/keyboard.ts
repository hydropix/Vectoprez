import { get } from 'svelte/store';
import { appState, setTool, setZoom } from '../stores/appState';
import { elements, deleteElements } from '../stores/elements';
import { history } from '../engine/history/undoRedo';

export function setupKeyboardShortcuts() {
  window.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e: KeyboardEvent) {
  const state = get(appState);

  // Outils
  if (e.key === 'v' || e.key === '1') {
    setTool('selection');
  } else if (e.key === 'r') {
    setTool('rectangle');
  } else if (e.key === 'o' || e.key === 'e') {
    setTool('ellipse');
  } else if (e.key === 'a') {
    setTool('arrow');
  } else if (e.key === 'h' || e.key === ' ') {
    e.preventDefault();
    setTool('hand');
  }

  // Undo/Redo
  else if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault();
    const prev = history.undo();
    if (prev) elements.set(prev);
  } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
    e.preventDefault();
    const next = history.redo();
    if (next) elements.set(next);
  }

  // Supprimer
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    const selectedIds = Array.from(state.selectedElementIds);
    if (selectedIds.length > 0) {
      e.preventDefault();
      history.record(get(elements));
      deleteElements(selectedIds);
      appState.update(s => ({ ...s, selectedElementIds: new Set() }));
    }
  }

  // Zoom
  else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
    e.preventDefault();
    setZoom(1);
  } else if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
    e.preventDefault();
    setZoom(state.zoom * 1.2);
  } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    setZoom(state.zoom * 0.8);
  }

  // Toggle Grid
  else if ((e.ctrlKey || e.metaKey) && e.key === "'") {
    e.preventDefault();
    appState.update(s => ({
      ...s,
      gridSize: s.gridSize === null ? 20 : null,
    }));
  }

  // Escape pour clear selection
  else if (e.key === 'Escape') {
    appState.update(s => ({ ...s, selectedElementIds: new Set() }));
  }
}
