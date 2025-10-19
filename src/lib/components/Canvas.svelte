<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, pan } from '../stores/appState';
  import { elements, addElement, updateElement } from '../stores/elements';
  import { renderElements } from '../engine/canvas/renderer';
  import { screenToWorld } from '../engine/canvas/coordinates';
  import { createElement } from '../engine/elements/factory';
  import { getElementAtPosition } from '../engine/collision/detection';
  import { history } from '../engine/history/undoRedo';
  import {
    getBindableElementAtPosition,
    calculateBinding,
    updateBoundElements,
    updateArrowBindingOffsets,
  } from '../engine/binding/arrows';
  import {
    getBindableElementForText,
    calculateTextBinding,
    updateBoundTextElements,
    getTextBindingPosition,
    updateTextBindingOffset,
  } from '../engine/binding/text';
  import {
    getHandleAtPosition,
    renderArrowHandles,
    type ArrowHandle,
  } from '../engine/arrows/handles';
  import { addControlPoint, removeControlPoint } from '../engine/arrows/curves';
  import { updateArrowBoundingBox } from '../engine/arrows/boundingBox';
  import { getCanonicalColor } from '$lib/utils/colorInversion';
  import { getCursor, type CursorType } from '$lib/utils/cursor';
  import type { Point, ArrowElement, TextElement, AnyExcalidrawElement, ExcalidrawElement } from '../engine/elements/types';

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let isPanning = false;
  let isDrawing = false;
  let isDragging = false;
  let isDraggingHandle = false;
  let lastMousePos = { x: 0, y: 0 };
  let drawStart: Point | null = null;
  let currentElementId: string | null = null;
  let draggedElement: AnyExcalidrawElement | null = null;
  let dragOffset: Point = { x: 0, y: 0 };
  let draggedHandle: ArrowHandle | null = null;
  let draggedArrow: ArrowElement | null = null;
  let lastClickTime = 0;
  let lastClickPos: Point | null = null;
  let isEditingText = false;
  let editingTextElement: TextElement | null = null;
  let textInputElement: HTMLTextAreaElement | null = null;
  let currentCursor: CursorType = 'default';
  let isOverElement = false;
  let isOverHandle = false;

  // Reactive statement to update canvas background when theme changes
  $: if ($appState.theme) {
    const bgColor = $appState.theme === 'light' ? '#ffffff' : '#1a1a1a';
    appState.update(s => ({ ...s, viewBackgroundColor: bgColor }));
  }

  // Reactive statement to update cursor based on current state
  $: currentCursor = getCursor({
    activeTool: $appState.activeTool,
    isPanning,
    isDragging,
    isDraggingHandle,
    isDrawing,
    isEditingText,
    isOverElement,
    isOverHandle,
  });

  onMount(() => {
    ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  });

  function resizeCanvas() {
    if (!canvasEl) return;
    canvasEl.width = window.innerWidth;
    canvasEl.height = window.innerHeight;
  }

  function render() {
    if (!ctx || !canvasEl) return;

    ctx.fillStyle = $appState.viewBackgroundColor;
    ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

    if ($appState.gridSize) {
      renderGrid(ctx, $appState);
    }

    renderElements(ctx, $elements, {
      scrollX: $appState.scrollX,
      scrollY: $appState.scrollY,
      zoom: $appState.zoom,
    }, {
      excludeIds: editingTextElement ? new Set([editingTextElement.id]) : undefined,
      theme: $appState.theme,
    });

    // Render selection handles si sélection active
    renderSelection(ctx);

    requestAnimationFrame(render);
  }

  function renderGrid(ctx: CanvasRenderingContext2D, state: typeof $appState) {
    const gridSize = state.gridSize!;
    ctx.strokeStyle = state.theme === 'light' ? '#e0e0e0' : '#404040';
    ctx.lineWidth = 1;

    const startX = Math.floor((-state.scrollX / state.zoom) / gridSize) * gridSize;
    const startY = Math.floor((-state.scrollY / state.zoom) / gridSize) * gridSize;
    const endX = startX + (canvasEl.width / state.zoom);
    const endY = startY + (canvasEl.height / state.zoom);

    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x * state.zoom + state.scrollX, 0);
      ctx.lineTo(x * state.zoom + state.scrollX, canvasEl.height);
      ctx.stroke();
    }

    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y * state.zoom + state.scrollY);
      ctx.lineTo(canvasEl.width, y * state.zoom + state.scrollY);
      ctx.stroke();
    }
  }

  function renderSelection(ctx: CanvasRenderingContext2D) {
    const selectedIds = Array.from($appState.selectedElementIds);
    if (selectedIds.length === 0) return;

    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    const selectedElements = $elements.filter(el => selectedIds.includes(el.id));
    for (const el of selectedElements) {
      if (el.type === 'arrow') {
        // Pour les flèches, afficher les handles seulement si on n'est pas en train de dessiner
        // Cela évite le conflit entre création et édition
        if (!isDrawing) {
          renderArrowHandles(ctx, el as ArrowElement, $appState.zoom);
        }
      } else {
        // Pour les autres éléments, afficher le bounding box
        ctx.strokeStyle = '#4dabf7';
        ctx.lineWidth = 2 / $appState.zoom;
        ctx.setLineDash([5 / $appState.zoom, 5 / $appState.zoom]);
        ctx.strokeRect(el.x, el.y, el.width, el.height);
        ctx.setLineDash([]);
      }
    }

    ctx.restore();
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    // Zoom avec la molette (sans modificateur)
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Position dans le monde avant le zoom
    const worldX = (mouseX - $appState.scrollX) / $appState.zoom;
    const worldY = (mouseY - $appState.scrollY) / $appState.zoom;

    // Calculer le nouveau zoom
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, $appState.zoom * delta));

    // Calculer le nouveau scroll pour garder le point du monde sous la souris
    const newScrollX = mouseX - worldX * newZoom;
    const newScrollY = mouseY - worldY * newZoom;

    // Appliquer le zoom et le scroll en une seule mise à jour
    appState.update(s => ({
      ...s,
      zoom: newZoom,
      scrollX: newScrollX,
      scrollY: newScrollY,
    }));
  }

  function handleMouseDown(e: MouseEvent) {
    const worldPos = screenToWorld(
      { x: e.clientX, y: e.clientY },
      { scrollX: $appState.scrollX, scrollY: $appState.scrollY, zoom: $appState.zoom }
    );

    // Détecter double-clic
    const now = Date.now();
    const DOUBLE_CLICK_THRESHOLD = 300; // ms
    const DISTANCE_THRESHOLD = 5; // pixels
    const isDoubleClick = lastClickPos &&
      now - lastClickTime < DOUBLE_CLICK_THRESHOLD &&
      Math.abs(worldPos.x - lastClickPos.x) < DISTANCE_THRESHOLD &&
      Math.abs(worldPos.y - lastClickPos.y) < DISTANCE_THRESHOLD;

    if (isDoubleClick) {
      handleDoubleClick(worldPos);
      lastClickTime = 0;
      lastClickPos = null;
      return;
    }

    lastClickTime = now;
    lastClickPos = worldPos;

    if (e.button === 1 || $appState.activeTool === 'hand') {
      isPanning = true;
      lastMousePos = { x: e.clientX, y: e.clientY };
      return;
    }

    if ($appState.activeTool === 'selection') {
      // Vérifier d'abord si on clique sur un handle de flèche sélectionnée
      // IMPORTANT: Ne pas détecter les handles si on est en mode dessin (conflit création/édition)
      const selectedIds = Array.from($appState.selectedElementIds);
      let handleClicked = false;

      if (!isDrawing) {
        for (const id of selectedIds) {
          const element = $elements.find(el => el.id === id);
          if (element && element.type === 'arrow') {
            const handle = getHandleAtPosition(element as ArrowElement, worldPos, $appState.zoom);
            if (handle) {
              isDraggingHandle = true;
              draggedHandle = handle;
              draggedArrow = element as ArrowElement;
              handleClicked = true;
              break;
            }
          }
        }
      }

      if (!handleClicked) {
        // Vérifier si on clique sur un élément existant
        const hitElement = getElementAtPosition($elements, worldPos);
        if (hitElement) {
          isDragging = true;
          draggedElement = hitElement;
          dragOffset = {
            x: worldPos.x - hitElement.x,
            y: worldPos.y - hitElement.y,
          };
          appState.update(s => ({
            ...s,
            selectedElementIds: new Set([hitElement.id]),
          }));
        } else {
          // Clear selection and close properties panel
          appState.update(s => ({
            ...s,
            selectedElementIds: new Set(),
            isPropertiesPanelOpen: false,
          }));
        }
      }
    } else if (['rectangle', 'ellipse', 'diamond'].includes($appState.activeTool)) {
      // Commencer à dessiner une forme
      isDrawing = true;
      drawStart = worldPos;

      // Convert display colors to canonical storage colors
      const canonicalStrokeColor = getCanonicalColor($appState.currentStrokeColor, $appState.theme);
      const canonicalBgColor = $appState.currentBackgroundColor === 'transparent'
        ? 'transparent'
        : getCanonicalColor($appState.currentBackgroundColor, $appState.theme);

      const newElement = createElement(
        $appState.activeTool as any,
        worldPos.x,
        worldPos.y,
        0,
        0,
        {
          strokeColor: canonicalStrokeColor,
          backgroundColor: canonicalBgColor,
          fillStyle: $appState.currentFillStyle,
          strokeWidth: $appState.currentStrokeWidth,
          roughness: $appState.currentRoughness,
        }
      );

      addElement(newElement as AnyExcalidrawElement);
      currentElementId = newElement.id!;
      history.record($elements);
    } else if ($appState.activeTool === 'arrow') {
      // Commencer à dessiner une flèche
      isDrawing = true;
      drawStart = worldPos;

      // Vérifier binding au début
      const startBindingElement = getBindableElementAtPosition($elements, worldPos);
      const startBinding = startBindingElement
        ? calculateBinding(worldPos, startBindingElement)
        : null;

      // Convert display color to canonical storage color
      const canonicalArrowColor = getCanonicalColor($appState.currentStrokeColor, $appState.theme);

      const baseArrow = createElement('arrow', worldPos.x, worldPos.y, 0, 0, {
        strokeColor: canonicalArrowColor,
        strokeWidth: $appState.currentStrokeWidth,
      });

      const newArrow: ArrowElement = {
        ...baseArrow,
        type: 'arrow',
        points: [
          { x: 0, y: 0 },
          { x: 0, y: 0 },
        ],
        startBinding,
        endBinding: null,
        startArrowhead: null,
        endArrowhead: 'arrow',
      } as ArrowElement;

      addElement(newArrow);
      currentElementId = newArrow.id;

      // Ajouter boundElement au startBinding
      if (startBinding && startBindingElement && 'boundElements' in startBindingElement) {
        updateElement(startBindingElement.id, {
          boundElements: [
            ...startBindingElement.boundElements,
            { id: newArrow.id, type: 'arrow' },
          ],
        } as any);
      }

      history.record($elements);
    } else if ($appState.activeTool === 'text') {
      // Créer un élément texte
      isDrawing = false; // Pas de dessin pour le texte

      // Créer un texte initial
      const fontSize = 20;
      const estimatedWidth = 100;
      const estimatedHeight = fontSize * 1.2;

      // Vérifier si on clique sur un élément pour créer un binding
      const bindingElement = getBindableElementForText($elements, worldPos);
      const textBinding = bindingElement
        ? calculateTextBinding(worldPos, bindingElement, estimatedWidth, estimatedHeight)
        : null;

      // Convert display color to canonical storage color
      const canonicalTextColor = getCanonicalColor($appState.currentStrokeColor, $appState.theme);

      const baseText = createElement('text', worldPos.x, worldPos.y, estimatedWidth, estimatedHeight, {
        strokeColor: canonicalTextColor,
        opacity: $appState.currentOpacity,
      }) as TextElement;

      const newText: TextElement = {
        ...baseText,
        text: '',
        fontSize,
        fontFamily: 'Virgil, Segoe UI Emoji',
        textAlign: 'left',
        verticalAlign: 'top',
        binding: textBinding,
      };

      // Si accrochage, calculer la position correcte
      if (textBinding && bindingElement) {
        const position = getTextBindingPosition(textBinding, bindingElement, estimatedWidth, estimatedHeight);
        newText.x = position.x;
        newText.y = position.y;

        // Ajouter le boundElement
        if ('boundElements' in bindingElement) {
          updateElement(bindingElement.id, {
            boundElements: [
              ...bindingElement.boundElements,
              { id: newText.id, type: 'text' },
            ],
          } as any);
        }
      }

      addElement(newText);

      // Démarrer l'édition du texte
      startTextEditing(newText);

      history.record($elements);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const worldPos = screenToWorld(
      { x: e.clientX, y: e.clientY },
      { scrollX: $appState.scrollX, scrollY: $appState.scrollY, zoom: $appState.zoom }
    );

    // Mettre à jour l'état de survol pour le curseur
    if (!isPanning && !isDragging && !isDraggingHandle && !isDrawing) {
      // Vérifier si on survole un handle
      isOverHandle = false;
      if ($appState.activeTool === 'selection') {
        const selectedIds = Array.from($appState.selectedElementIds);
        for (const id of selectedIds) {
          const element = $elements.find(el => el.id === id);
          if (element && element.type === 'arrow') {
            const handle = getHandleAtPosition(element as ArrowElement, worldPos, $appState.zoom);
            if (handle) {
              isOverHandle = true;
              break;
            }
          }
        }
      }

      // Vérifier si on survole un élément
      if (!isOverHandle) {
        const hitElement = getElementAtPosition($elements, worldPos);
        isOverElement = hitElement !== null && $appState.activeTool === 'selection';
      }
    }

    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      pan(dx, dy);
      lastMousePos = { x: e.clientX, y: e.clientY };
    } else if (isDraggingHandle && draggedHandle && draggedArrow) {
      // Déplacer le handle de la flèche
      const pointIndex = draggedHandle.pointIndex;
      const newPoints = [...draggedArrow.points];

      // Calculer la nouvelle position relative
      const relativeX = worldPos.x - draggedArrow.x;
      const relativeY = worldPos.y - draggedArrow.y;
      newPoints[pointIndex] = { x: relativeX, y: relativeY };

      // Vérifier s'il y a un nouveau binding
      let newBinding = null;
      let boundElement = null;

      if (draggedHandle.type === 'start' || draggedHandle.type === 'end') {
        boundElement = getBindableElementAtPosition($elements, worldPos, draggedArrow.id);
        if (boundElement) {
          // Toujours recalculer l'offset pour capturer la nouvelle position
          newBinding = calculateBinding(worldPos, boundElement, true);
        }
      }

      // Mettre à jour la flèche
      const updates: any = { points: newPoints };

      if (draggedHandle.type === 'start') {
        updates.startBinding = newBinding;

        // Nettoyer l'ancien binding
        if (draggedArrow.startBinding && !newBinding && draggedArrow) {
          const oldElement = $elements.find(el => el.id === draggedArrow!.startBinding!.elementId);
          if (oldElement && oldElement.type !== 'arrow' && 'boundElements' in oldElement) {
            updateElement(oldElement.id, {
              boundElements: oldElement.boundElements.filter(b => b.id !== draggedArrow!.id),
            } as any);
          }
        }

        // Ajouter le nouveau binding
        if (newBinding && boundElement && 'boundElements' in boundElement) {
          const alreadyBound = boundElement.boundElements.some(b => b.id === draggedArrow!.id);
          if (!alreadyBound) {
            updateElement(boundElement.id, {
              boundElements: [...boundElement.boundElements, { id: draggedArrow!.id, type: 'arrow' }],
            } as any);
          }
        }
      } else if (draggedHandle.type === 'end') {
        updates.endBinding = newBinding;

        // Nettoyer l'ancien binding
        if (draggedArrow.endBinding && !newBinding && draggedArrow) {
          const oldElement = $elements.find(el => el.id === draggedArrow!.endBinding!.elementId);
          if (oldElement && oldElement.type !== 'arrow' && 'boundElements' in oldElement) {
            updateElement(oldElement.id, {
              boundElements: oldElement.boundElements.filter(b => b.id !== draggedArrow!.id),
            } as any);
          }
        }

        // Ajouter le nouveau binding
        if (newBinding && boundElement && 'boundElements' in boundElement) {
          const alreadyBound = boundElement.boundElements.some(b => b.id === draggedArrow!.id);
          if (!alreadyBound) {
            updateElement(boundElement.id, {
              boundElements: [...boundElement.boundElements, { id: draggedArrow!.id, type: 'arrow' }],
            } as any);
          }
        }
      }

      // Mettre à jour et recalculer le bounding box
      let updatedArrow = { ...draggedArrow, ...updates } as ArrowElement;
      updatedArrow = updateArrowBoundingBox(updatedArrow);

      updateElement(draggedArrow.id, updatedArrow as any);

      // Mettre à jour draggedArrow pour la prochaine frame
      const freshArrow = $elements.find(el => el.id === draggedArrow!.id);
      if (freshArrow && freshArrow.type === 'arrow') {
        draggedArrow = freshArrow as ArrowElement;
      }
    } else if (isDragging && draggedElement) {
      // Déplacer l'élément
      const newX = worldPos.x - dragOffset.x;
      const newY = worldPos.y - dragOffset.y;

      updateElement(draggedElement.id, { x: newX, y: newY } as any);

      // Mettre à jour les arrows et textes liés
      let updatedElements = updateBoundElements($elements, draggedElement.id);
      updatedElements = updateBoundTextElements(updatedElements, draggedElement.id, ctx!);
      elements.set(updatedElements);
    } else if (isDrawing && drawStart && currentElementId) {
      if ($appState.activeTool === 'arrow') {
        // Redimensionner la flèche en cours de création
        const arrow = $elements.find(el => el.id === currentElementId);
        if (!arrow || arrow.type !== 'arrow') return;

        const dx = worldPos.x - drawStart.x;
        const dy = worldPos.y - drawStart.y;

        // Vérifier binding à la fin
        const endBindingElement = getBindableElementAtPosition($elements, worldPos, currentElementId);
        const endBinding = endBindingElement
          ? calculateBinding(worldPos, endBindingElement)
          : null;

        // Mettre à jour SANS recalculer le bounding box pendant la création
        // Le bounding box sera recalculé à la fin (mouseUp) pour éviter que la flèche "parte au loin"
        const tempArrow = {
          ...arrow,
          points: [
            { x: 0, y: 0 },
            { x: dx, y: dy },
          ],
          endBinding,
        } as ArrowElement;

        updateElement(currentElementId, tempArrow as any);

        // Mettre à jour boundElements si le binding a changé
        if (endBinding && endBindingElement && 'boundElements' in endBindingElement) {
          const alreadyBound = endBindingElement.boundElements.some(b => b.id === currentElementId);
          if (!alreadyBound) {
            updateElement(endBindingElement.id, {
              boundElements: [
                ...endBindingElement.boundElements,
                { id: currentElementId, type: 'arrow' },
              ],
            } as any);
          }
        }
      } else {
        // Redimensionner l'élément en cours de création
        const width = worldPos.x - drawStart.x;
        const height = worldPos.y - drawStart.y;
        updateElement(currentElementId, { width, height } as any);
      }
    }
  }

  function handleDoubleClick(worldPos: Point) {
    // Vérifier d'abord si on double-clique sur un texte pour l'éditer
    const hitElement = getElementAtPosition($elements, worldPos);
    if (hitElement && hitElement.type === 'text') {
      startTextEditing(hitElement as TextElement);
      return;
    }

    // Si on double-clique sur un élément sélectionné, ouvrir le panneau Properties
    const selectedIds = Array.from($appState.selectedElementIds);
    if (hitElement && selectedIds.includes(hitElement.id)) {
      appState.update(s => ({ ...s, isPropertiesPanelOpen: true }));
    }

    // Double-clic sur une flèche sélectionnée: convertir en courbe ou supprimer point de contrôle

    for (const id of selectedIds) {
      const element = $elements.find(el => el.id === id);
      if (element && element.type === 'arrow') {
        const arrow = element as ArrowElement;

        // Vérifier si on a cliqué sur un handle intermédiaire
        const handle = getHandleAtPosition(arrow, worldPos, $appState.zoom);
        if (handle && handle.type === 'mid') {
          // Supprimer le point de contrôle
          let updatedArrow = removeControlPoint(arrow, handle.pointIndex);
          updatedArrow = updateArrowBoundingBox(updatedArrow);
          updateElement(arrow.id, updatedArrow as any);
          history.record($elements);
          return;
        }

        // Sinon, si c'est une ligne droite, la convertir en courbe
        if (arrow.points.length === 2) {
          let updatedArrow = addControlPoint(arrow);
          updatedArrow = updateArrowBoundingBox(updatedArrow);
          updateElement(arrow.id, updatedArrow as any);
          history.record($elements);
          return;
        }
      }
    }
  }

  function handleMouseUp() {
    // Si on finit de créer une flèche, recalculer son bounding box
    if (isDrawing && currentElementId && $appState.activeTool === 'arrow') {
      const arrow = $elements.find(el => el.id === currentElementId);
      if (arrow && arrow.type === 'arrow') {
        const updatedArrow = updateArrowBoundingBox(arrow as ArrowElement);
        updateElement(currentElementId, updatedArrow as any);
      }
    }

    // Si on a déplacé un texte lié, mettre à jour son offset
    if (isDragging && draggedElement && draggedElement.type === 'text') {
      const textEl = draggedElement as TextElement;
      if (textEl.binding) {
        const boundElement = $elements.find(el => el.id === textEl.binding!.elementId);
        if (boundElement && boundElement.type !== 'arrow' && boundElement.type !== 'text') {
          const updatedText = updateTextBindingOffset(textEl, boundElement as ExcalidrawElement, ctx!);
          updateElement(textEl.id, updatedText as any);
        }
      }
    }

    // Si on a déplacé une flèche avec des bindings, mettre à jour ses offsets
    if (isDragging && draggedElement && draggedElement.type === 'arrow') {
      const arrowEl = draggedElement as ArrowElement;
      if (arrowEl.startBinding || arrowEl.endBinding) {
        const updatedArrow = updateArrowBindingOffsets(arrowEl, $elements);
        updateElement(arrowEl.id, updatedArrow as any);
      }
    }

    if (isDrawing || isDraggingHandle || isDragging) {
      history.record($elements);
    }

    isPanning = false;
    isDrawing = false;
    isDragging = false;
    isDraggingHandle = false;
    drawStart = null;
    currentElementId = null;
    draggedElement = null;
    draggedHandle = null;
    draggedArrow = null;
  }

  function startTextEditing(textElement: TextElement) {
    isEditingText = true;
    editingTextElement = textElement;

    // Créer un textarea pour l'édition
    setTimeout(() => {
      if (textInputElement) {
        textInputElement.focus();
        textInputElement.select();
      }
    }, 10);
  }

  function handleTextInput(e: Event) {
    if (!editingTextElement || !ctx) return;

    const textarea = e.target as HTMLTextAreaElement;
    const text = textarea.value;

    // Mesurer le texte pour ajuster les dimensions
    ctx.save();
    ctx.font = `${editingTextElement.fontSize}px ${editingTextElement.fontFamily}`;
    const lines = text.split('\n');
    let maxWidth = 0;
    for (const line of lines) {
      const metrics = ctx.measureText(line);
      maxWidth = Math.max(maxWidth, metrics.width);
    }
    const textHeight = editingTextElement.fontSize * 1.2 * Math.max(1, lines.length);
    ctx.restore();

    // Mettre à jour l'élément texte
    const updatedText: Partial<TextElement> = {
      text,
      width: Math.max(100, maxWidth + 10),
      height: textHeight,
    };

    // Si binding, recalculer la position
    if (editingTextElement.binding) {
      const boundElement = $elements.find(el => el.id === editingTextElement!.binding!.elementId);
      if (boundElement && boundElement.type !== 'arrow' && boundElement.type !== 'text') {
        const position = getTextBindingPosition(
          editingTextElement.binding,
          boundElement,
          updatedText.width!,
          updatedText.height!
        );
        updatedText.x = position.x;
        updatedText.y = position.y;
      }
    }

    updateElement(editingTextElement.id, updatedText as any);

    // Mettre à jour editingTextElement pour rester synchronisé
    const updated = $elements.find(el => el.id === editingTextElement!.id);
    if (updated && updated.type === 'text') {
      editingTextElement = updated as TextElement;
    }
  }

  function finishTextEditing() {
    if (!editingTextElement) return;

    // Si le texte est vide, supprimer l'élément
    if (editingTextElement.text.trim() === '') {
      elements.update(els => els.filter(el => el.id !== editingTextElement!.id));
    }

    isEditingText = false;
    editingTextElement = null;
    textInputElement = null;

    // Revenir à l'outil de sélection
    appState.update(s => ({ ...s, activeTool: 'selection' }));
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (isEditingText && e.key === 'Escape') {
      e.preventDefault();
      finishTextEditing();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<canvas
  bind:this={canvasEl}
  on:wheel={handleWheel}
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:mouseleave={handleMouseUp}
  style="cursor: {currentCursor}"
/>

{#if isEditingText && editingTextElement}
  <textarea
    bind:this={textInputElement}
    bind:value={editingTextElement.text}
    on:input={handleTextInput}
    on:blur={finishTextEditing}
    style="
      position: absolute;
      left: {editingTextElement.x * $appState.zoom + $appState.scrollX}px;
      top: {editingTextElement.y * $appState.zoom + $appState.scrollY}px;
      width: {editingTextElement.width * $appState.zoom}px;
      min-height: {editingTextElement.height * $appState.zoom}px;
      font-size: {editingTextElement.fontSize * $appState.zoom}px;
      font-family: {editingTextElement.fontFamily};
      color: {editingTextElement.strokeColor};
      background: transparent;
      border: 2px solid #4dabf7;
      outline: none;
      resize: none;
      overflow: hidden;
      padding: 2px;
      z-index: 1000;
    "
  />
{/if}

<style>
  canvas {
    display: block;
  }
</style>
