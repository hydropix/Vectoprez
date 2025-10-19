import { get } from 'svelte/store';
import { appState, setTool, setZoom } from '../stores/appState';
import { elements, deleteElements, addElement } from '../stores/elements';
import { history } from '../engine/history/undoRedo';
import { duplicateElements, calculateCenterPoint, collectElementsWithChildren } from './clipboard';
import { screenToWorld } from '../engine/canvas/coordinates';

export function setupKeyboardShortcuts() {
  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}

function handleKeyDown(e: KeyboardEvent) {
  const target = e.target as HTMLElement;
  const isEditingText = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';

  if (isEditingText) {
    return;
  }

  if (e.repeat) {
    return;
  }

  const state = get(appState);

  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    e.preventDefault();
    const allElements = get(elements);
    appState.update(s => ({
      ...s,
      selectedElementIds: new Set(allElements.map(el => el.id)),
    }));
  }

  else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
    e.preventDefault();
    const selectedIds = Array.from(state.selectedElementIds);
    if (selectedIds.length > 0) {
      const allElements = get(elements);
      const elementsWithChildren = collectElementsWithChildren(selectedIds, allElements);
      appState.update(s => ({
        ...s,
        clipboard: elementsWithChildren,
      }));
    }
  }

  else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
    e.preventDefault();
    if (state.clipboard.length > 0) {
      const clipboardElements = state.clipboard;
      const centerPoint = calculateCenterPoint(clipboardElements);

      let targetPosition = { x: 0, y: 0 };

      if (state.mousePosition) {
        targetPosition = screenToWorld(state.mousePosition, {
          scrollX: state.scrollX,
          scrollY: state.scrollY,
          zoom: state.zoom,
        });
      } else {
        const viewportCenterX = window.innerWidth / 2;
        const viewportCenterY = window.innerHeight / 2;
        targetPosition = screenToWorld(
          { x: viewportCenterX, y: viewportCenterY },
          {
            scrollX: state.scrollX,
            scrollY: state.scrollY,
            zoom: state.zoom,
          }
        );
      }

      const offset = {
        x: targetPosition.x - centerPoint.x,
        y: targetPosition.y - centerPoint.y,
      };

      const duplicated = duplicateElements(clipboardElements, offset);

      history.record(get(elements));

      for (const element of duplicated) {
        addElement(element);
      }

      appState.update(s => ({
        ...s,
        selectedElementIds: new Set(duplicated.map(el => el.id)),
      }));
    }
  }

  else if (e.key === 'v' || e.key === '1') {
    setTool('selection');
  } else if (e.key === 'r') {
    setTool('rectangle');
  } else if (e.key === 'o' || e.key === 'e') {
    setTool('ellipse');
  } else if (e.key === 'a' && !e.ctrlKey && !e.metaKey) {
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
