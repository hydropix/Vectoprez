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
  import {
    getLineHandleAtPosition,
    renderLineHandles,
    type LineHandle,
  } from '../engine/lines/handles';
  import { addControlPoint, removeControlPoint } from '../engine/arrows/curves';
  import { updateArrowBoundingBox } from '../engine/arrows/boundingBox';
  import { getColorFromIndex } from '$lib/utils/colorPalette';
  import { getCursor, type CursorType } from '$lib/utils/cursor';
  import type { Point, ArrowElement, TextElement, AnyExcalidrawElement, ExcalidrawElement } from '../engine/elements/types';
  import {
    getHandleAtPosition as getTransformHandleAtPosition,
    renderTransformHandles,
    getCursorForHandle,
    type TransformHandle,
    renderGroupTransformHandles,
    getGroupHandleAtPosition,
  } from '../engine/transform/handles';
  import { calculateResize, calculateRotation, snapRotation } from '../engine/transform/geometry';
  import { getGroupBoundingBox, type GroupBounds } from '../engine/selection/groupBounds';
  import { translateGroup, scaleGroup, rotateGroup } from '../engine/selection/groupTransform';
  import {
    normalizeSelectionBox,
    getElementsInSelectionBox,
    renderSelectionBox,
  } from '../engine/selection/selectionBox';

  let canvasEl: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let isPanning = false;
  let isDrawing = false;
  let isDragging = false;
  let isDraggingHandle = false;
  let isDraggingTransformHandle = false;
  let lastMousePos = { x: 0, y: 0 };
  let drawStart: Point | null = null;
  let currentElementId: string | null = null;
  let draggedElement: AnyExcalidrawElement | null = null;
  let dragOffset: Point = { x: 0, y: 0 };
  let draggedHandle: ArrowHandle | null = null;
  let draggedArrow: ArrowElement | null = null;
  let draggedLineHandle: LineHandle | null = null;
  let draggedLine: ExcalidrawElement | null = null;
  let draggedTransformHandle: TransformHandle | null = null;
  let transformStartPoint: Point | null = null;
  let transformOriginalElement: (ExcalidrawElement | TextElement) | null = null;
  let isDrawingSelectionBox = false;
  let selectionBoxStart: Point | null = null;
  let selectionBoxCurrent: Point | null = null;
  let isDraggingGroup = false;
  let isDraggingGroupHandle = false;
  let draggedGroupHandle: TransformHandle | null = null;
  let groupTransformStart: Point | null = null;
  let originalGroupElements: AnyExcalidrawElement[] = [];
  let originalGroupBounds: GroupBounds | null = null;
  let clickedGroupElement: AnyExcalidrawElement | null = null;
  let lastClickTime = 0;
  let lastClickPos: Point | null = null;
  let isEditingText = false;
  let editingTextElement: TextElement | null = null;
  let textInputElement: HTMLTextAreaElement | null = null;
  let currentCursor: CursorType = 'default';
  let isOverElement = false;
  let isOverHandle = false;
  let isOverTransformHandle = false;
  let hoverTransformHandleType: TransformHandle | null = null;

  // Reactive statement to update canvas background when theme changes
  $: if ($appState.theme) {
    const bgColor = $appState.theme === 'light' ? '#ff9f93' : '#171923';
    appState.update(s => ({ ...s, viewBackgroundColor: bgColor }));
  }

  // Reactive statement to update cursor based on current state
  $: {
    if (isDraggingTransformHandle && draggedTransformHandle && transformOriginalElement) {
      currentCursor = draggedTransformHandle.type === 'rotate'
        ? 'grabbing'
        : getCursorForHandle(draggedTransformHandle.type, transformOriginalElement.angle) as CursorType;
    } else if (isOverTransformHandle && hoverTransformHandleType) {
      const selectedIds = Array.from($appState.selectedElementIds);
      const selectedElement = $elements.find(el => el.id === selectedIds[0]);
      if (selectedElement && selectedElement.type !== 'arrow') {
        currentCursor = hoverTransformHandleType.type === 'rotate'
          ? 'grab'
          : getCursorForHandle(hoverTransformHandleType.type, selectedElement.angle) as CursorType;
      } else {
        currentCursor = getCursor({
          activeTool: $appState.activeTool,
          isPanning,
          isDragging,
          isDraggingHandle,
          isDrawing,
          isEditingText,
          isOverElement,
          isOverHandle,
        });
      }
    } else {
      currentCursor = getCursor({
        activeTool: $appState.activeTool,
        isPanning,
        isDragging,
        isDraggingHandle,
        isDrawing,
        isEditingText,
        isOverElement,
        isOverHandle,
      });
    }
  }

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

    // Render hover feedback avant la sélection
    renderHoverFeedback(ctx);

    // Render selection handles si sélection active
    renderSelection(ctx);

    requestAnimationFrame(render);
  }

  function renderGrid(ctx: CanvasRenderingContext2D, state: typeof $appState) {
    const gridSize = state.gridSize!;
    // Subtle grid with dots instead of lines for modern look
    const dotSize = 1.5;
    ctx.fillStyle = state.theme === 'light'
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.08)';

    const startX = Math.floor((-state.scrollX / state.zoom) / gridSize) * gridSize;
    const startY = Math.floor((-state.scrollY / state.zoom) / gridSize) * gridSize;
    const endX = startX + (canvasEl.width / state.zoom);
    const endY = startY + (canvasEl.height / state.zoom);

    // Draw dots at grid intersections
    for (let x = startX; x < endX; x += gridSize) {
      for (let y = startY; y < endY; y += gridSize) {
        ctx.beginPath();
        ctx.arc(
          x * state.zoom + state.scrollX,
          y * state.zoom + state.scrollY,
          dotSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  function renderSelection(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    if (isDrawingSelectionBox && selectionBoxStart && selectionBoxCurrent) {
      const box = normalizeSelectionBox(selectionBoxStart, selectionBoxCurrent);
      renderSelectionBox(ctx, box, $appState.zoom);
    }

    ctx.restore();

    const selectedIds = Array.from($appState.selectedElementIds);
    if (selectedIds.length === 0) return;

    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    const selectedElements = $elements.filter(el => selectedIds.includes(el.id));

    if (selectedElements.length === 1 && selectedElements[0].type !== 'arrow' && selectedElements[0].type !== 'line') {
      const element = selectedElements[0] as ExcalidrawElement | TextElement;
      renderTransformHandles(ctx, element, $appState.zoom);
    } else if (selectedElements.length > 1) {
      const allNonArrowNonLine = selectedElements.every(el => el.type !== 'arrow' && el.type !== 'line');

      if (allNonArrowNonLine) {
        const groupBounds = getGroupBoundingBox(selectedElements);
        if (groupBounds) {
          renderGroupTransformHandles(ctx, groupBounds, $appState.zoom);
        }
      } else {
        for (const el of selectedElements) {
          if (el.type === 'arrow') {
            if (!isDrawing) {
              renderArrowHandles(ctx, el as ArrowElement, $appState.zoom);
            }
          } else if (el.type === 'line') {
            if (!isDrawing) {
              renderLineHandles(ctx, el as ExcalidrawElement, $appState.zoom);
            }
          } else {
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 8 / $appState.zoom;

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2.5 / $appState.zoom;
            ctx.setLineDash([8 / $appState.zoom, 4 / $appState.zoom]);
            ctx.strokeRect(el.x, el.y, el.width, el.height);
            ctx.setLineDash([]);

            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
          }
        }
      }
    } else {
      for (const el of selectedElements) {
        if (el.type === 'arrow') {
          if (!isDrawing) {
            renderArrowHandles(ctx, el as ArrowElement, $appState.zoom);
          }
        } else if (el.type === 'line') {
          if (!isDrawing) {
            renderLineHandles(ctx, el as ExcalidrawElement, $appState.zoom);
          }
        } else {
          ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
          ctx.shadowBlur = 8 / $appState.zoom;

          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 2.5 / $appState.zoom;
          ctx.setLineDash([8 / $appState.zoom, 4 / $appState.zoom]);
          ctx.strokeRect(el.x, el.y, el.width, el.height);
          ctx.setLineDash([]);

          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }
    }

    ctx.restore();
  }

  function renderHoverFeedback(ctx: CanvasRenderingContext2D) {
    // Ne pas afficher le feedback si pas d'élément survolé
    if (!$appState.hoveredElementId) return;

    // Ne pas afficher si l'élément est déjà sélectionné
    if ($appState.selectedElementIds.has($appState.hoveredElementId)) return;

    // Trouver l'élément survolé
    const hoveredElement = $elements.find(el => el.id === $appState.hoveredElementId);
    if (!hoveredElement) return;

    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    // Marge identique à celle des transform handles (10px)
    const HANDLE_MARGIN = 10;
    const margin = HANDLE_MARGIN / $appState.zoom;

    // Style du contour gris avec effet de glow - transparent (40% d'opacité)
    ctx.shadowColor = 'rgba(128, 128, 128, 0.25)';
    ctx.shadowBlur = 12 / $appState.zoom;

    ctx.strokeStyle = 'rgba(128, 128, 128, 0.4)'; // Gris à 40% d'opacité
    ctx.lineWidth = 3.5 / $appState.zoom;
    ctx.setLineDash([]); // Ligne solide

    // Dessiner le contour autour de l'élément avec marge
    if (hoveredElement.type === 'arrow') {
      // Pour les flèches, on dessine autour du bounding box
      const arrow = hoveredElement as ArrowElement;
      ctx.strokeRect(
        arrow.x - margin,
        arrow.y - margin,
        arrow.width + margin * 2,
        arrow.height + margin * 2
      );
    } else {
      // Pour les autres éléments, utiliser leur position et dimension
      ctx.strokeRect(
        hoveredElement.x - margin,
        hoveredElement.y - margin,
        hoveredElement.width + margin * 2,
        hoveredElement.height + margin * 2
      );
    }

    // Reset
    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

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
      const selectedIds = Array.from($appState.selectedElementIds);
      let handleClicked = false;

      if (!isDrawing && selectedIds.length > 1) {
        const selectedElements = $elements.filter(el => selectedIds.includes(el.id));
        const allNonArrowNonLine = selectedElements.every(el => el.type !== 'arrow' && el.type !== 'line');

        if (allNonArrowNonLine) {
          const groupBounds = getGroupBoundingBox(selectedElements);
          if (groupBounds) {
            const groupHandle = getGroupHandleAtPosition(groupBounds, worldPos, $appState.zoom);
            if (groupHandle) {
              isDraggingGroupHandle = true;
              draggedGroupHandle = groupHandle;
              groupTransformStart = worldPos;
              originalGroupElements = structuredClone(selectedElements);
              originalGroupBounds = groupBounds;
              handleClicked = true;
            }
          }
        }
      }

      if (!handleClicked && !isDrawing && selectedIds.length === 1) {
        const element = $elements.find(el => el.id === selectedIds[0]);
        if (element && element.type !== 'arrow' && element.type !== 'line') {
          const transformHandle = getTransformHandleAtPosition(
            element as ExcalidrawElement | TextElement,
            worldPos,
            $appState.zoom
          );
          if (transformHandle) {
            isDraggingTransformHandle = true;
            draggedTransformHandle = transformHandle;
            transformStartPoint = worldPos;
            transformOriginalElement = structuredClone(element) as ExcalidrawElement | TextElement;
            handleClicked = true;
          }
        }
      }

      // Priority 2: Check arrow handles
      if (!handleClicked && !isDrawing) {
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

      // Priority 3: Check line handles
      if (!handleClicked && !isDrawing) {
        for (const id of selectedIds) {
          const element = $elements.find(el => el.id === id);
          if (element && element.type === 'line') {
            const handle = getLineHandleAtPosition(element as ExcalidrawElement, worldPos, $appState.zoom);
            if (handle) {
              isDraggingHandle = true;
              draggedLineHandle = handle;
              draggedLine = element as ExcalidrawElement;
              handleClicked = true;
              break;
            }
          }
        }
      }

      if (!handleClicked) {
        const hitElement = getElementAtPosition($elements, worldPos);

        if (hitElement) {
          if (e.shiftKey) {
            const newSelection = new Set(selectedIds);
            if (newSelection.has(hitElement.id)) {
              newSelection.delete(hitElement.id);
            } else {
              newSelection.add(hitElement.id);
            }
            appState.update(s => ({
              ...s,
              selectedElementIds: newSelection,
            }));
          } else {
            if (selectedIds.includes(hitElement.id) && selectedIds.length > 1) {
              isDraggingGroup = true;
              const selectedElements = $elements.filter(el => selectedIds.includes(el.id));
              originalGroupElements = structuredClone(selectedElements);
              clickedGroupElement = structuredClone(hitElement);
              dragOffset = {
                x: worldPos.x - hitElement.x,
                y: worldPos.y - hitElement.y,
              };
            } else {
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
            }
          }
        } else {
          if (e.shiftKey) {
          } else {
            isDrawingSelectionBox = true;
            selectionBoxStart = worldPos;
            selectionBoxCurrent = worldPos;
            appState.update(s => ({
              ...s,
              selectedElementIds: new Set(),
              isPropertiesPanelOpen: false,
            }));
          }
        }
      }
    } else if (['rectangle', 'ellipse', 'line'].includes($appState.activeTool)) {
      isDrawing = true;
      drawStart = worldPos;

      const newElement = createElement(
        $appState.activeTool as any,
        worldPos.x,
        worldPos.y,
        0,
        0,
        {
          strokeColorIndex: $appState.currentStrokeColorIndex,
          backgroundColorIndex: $appState.currentBackgroundColorIndex,
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

      const baseArrow = createElement('arrow', worldPos.x, worldPos.y, 0, 0, {
        strokeColorIndex: $appState.currentStrokeColorIndex,
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

      const bindingElement = getBindableElementForText($elements, worldPos);
      const textBinding = bindingElement
        ? calculateTextBinding(worldPos, bindingElement, estimatedWidth, estimatedHeight)
        : null;

      const baseText = createElement('text', worldPos.x, worldPos.y, estimatedWidth, estimatedHeight, {
        strokeColorIndex: $appState.currentStrokeColorIndex,
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
    if (!isPanning && !isDragging && !isDraggingHandle && !isDraggingTransformHandle && !isDrawing) {
      isOverHandle = false;
      isOverTransformHandle = false;
      hoverTransformHandleType = null;

      if ($appState.activeTool === 'selection') {
        const selectedIds = Array.from($appState.selectedElementIds);

        // Check transform handles first for single non-arrow, non-line selection
        if (selectedIds.length === 1) {
          const element = $elements.find(el => el.id === selectedIds[0]);
          if (element && element.type !== 'arrow' && element.type !== 'line') {
            const transformHandle = getTransformHandleAtPosition(
              element as ExcalidrawElement | TextElement,
              worldPos,
              $appState.zoom
            );
            if (transformHandle) {
              isOverTransformHandle = true;
              hoverTransformHandleType = transformHandle;
            }
          }
        }

        // Check arrow handles if no transform handle is hovered
        if (!isOverTransformHandle) {
          for (const id of selectedIds) {
            const element = $elements.find(el => el.id === id);
            if (element && element.type === 'arrow') {
              const handle = getHandleAtPosition(element as ArrowElement, worldPos, $appState.zoom);
              if (handle) {
                isOverHandle = true;
                break;
              }
            } else if (element && element.type === 'line') {
              const handle = getLineHandleAtPosition(element as ExcalidrawElement, worldPos, $appState.zoom);
              if (handle) {
                isOverHandle = true;
                break;
              }
            }
          }
        }
      }

      // Vérifier si on survole un élément
      if (!isOverHandle && !isOverTransformHandle) {
        const hitElement = getElementAtPosition($elements, worldPos);
        isOverElement = hitElement !== null && $appState.activeTool === 'selection';
      }
    }

    if (isDrawingSelectionBox && selectionBoxStart) {
      selectionBoxCurrent = worldPos;
    } else if (isDraggingGroup && originalGroupElements.length > 0 && clickedGroupElement) {
      const dx = worldPos.x - dragOffset.x - clickedGroupElement.x;
      const dy = worldPos.y - dragOffset.y - clickedGroupElement.y;

      const updates = translateGroup(originalGroupElements, dx, dy);
      for (const update of updates) {
        updateElement(update.id!, update as any);
      }

      let updatedEls = $elements;
      for (const orig of originalGroupElements) {
        updatedEls = updateBoundElements(updatedEls, orig.id);
        updatedEls = updateBoundTextElements(updatedEls, orig.id, ctx!);
      }
      elements.set(updatedEls);
    } else if (isDraggingGroupHandle && draggedGroupHandle && groupTransformStart && originalGroupBounds) {
      if (draggedGroupHandle.type === 'rotate') {
        const angleDelta = calculateRotation(
          {
            x: originalGroupBounds.x,
            y: originalGroupBounds.y,
            width: originalGroupBounds.width,
            height: originalGroupBounds.height,
            angle: 0,
          } as any,
          worldPos
        );

        const snappedAngle = e.shiftKey ? snapRotation(angleDelta, true) : angleDelta;
        const updates = rotateGroup(originalGroupElements, originalGroupBounds, snappedAngle);

        for (const update of updates) {
          updateElement(update.id!, update as any);
        }

        let updatedEls = $elements;
        for (const orig of originalGroupElements) {
          updatedEls = updateBoundElements(updatedEls, orig.id);
          updatedEls = updateBoundTextElements(updatedEls, orig.id, ctx!);
        }
        elements.set(updatedEls);
      } else {
        const dx = worldPos.x - groupTransformStart.x;
        const dy = worldPos.y - groupTransformStart.y;

        let scaleX = 1;
        let scaleY = 1;
        let origin = { x: originalGroupBounds.centerX, y: originalGroupBounds.centerY };

        const handleType = draggedGroupHandle.type;
        if (handleType === 'se') {
          origin = { x: originalGroupBounds.x, y: originalGroupBounds.y };
          scaleX = 1 + dx / originalGroupBounds.width;
          scaleY = 1 + dy / originalGroupBounds.height;
        } else if (handleType === 'nw') {
          origin = { x: originalGroupBounds.x + originalGroupBounds.width, y: originalGroupBounds.y + originalGroupBounds.height };
          scaleX = 1 - dx / originalGroupBounds.width;
          scaleY = 1 - dy / originalGroupBounds.height;
        } else if (handleType === 'ne') {
          origin = { x: originalGroupBounds.x, y: originalGroupBounds.y + originalGroupBounds.height };
          scaleX = 1 + dx / originalGroupBounds.width;
          scaleY = 1 - dy / originalGroupBounds.height;
        } else if (handleType === 'sw') {
          origin = { x: originalGroupBounds.x + originalGroupBounds.width, y: originalGroupBounds.y };
          scaleX = 1 - dx / originalGroupBounds.width;
          scaleY = 1 + dy / originalGroupBounds.height;
        }

        const updates = scaleGroup(originalGroupElements, originalGroupBounds, scaleX, scaleY, origin, true);

        for (const update of updates) {
          updateElement(update.id!, update as any);
        }

        let updatedEls = $elements;
        for (const orig of originalGroupElements) {
          updatedEls = updateBoundElements(updatedEls, orig.id);
          updatedEls = updateBoundTextElements(updatedEls, orig.id, ctx!);
        }
        elements.set(updatedEls);
      }
    } else if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      pan(dx, dy);
      lastMousePos = { x: e.clientX, y: e.clientY };
    } else if (isDraggingTransformHandle && draggedTransformHandle && transformStartPoint && transformOriginalElement) {
      // Transform handling (resize or rotate)
      const selectedIds = Array.from($appState.selectedElementIds);
      if (selectedIds.length === 1) {
        const elementId = selectedIds[0];

        if (draggedTransformHandle.type === 'rotate') {
          // Rotation
          const newAngle = calculateRotation(transformOriginalElement, worldPos);
          const snappedAngle = e.shiftKey ? snapRotation(newAngle, true) : newAngle;

          updateElement(elementId, {
            angle: snappedAngle,
          } as any);
        } else {
          // Resize
          const resizeResult = calculateResize(
            transformOriginalElement,
            draggedTransformHandle.type,
            transformStartPoint,
            worldPos,
            e.shiftKey // Maintain aspect ratio with Shift
          );

          updateElement(elementId, resizeResult as any);

          // Update bound elements if needed
          let updatedElements = updateBoundElements($elements, elementId);
          updatedElements = updateBoundTextElements(updatedElements, elementId, ctx!);
          elements.set(updatedElements);
        }
      }
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
    } else if (isDraggingHandle && draggedLineHandle && draggedLine) {
      // Déplacer le handle de la ligne
      if (draggedLineHandle.type === 'start') {
        // Déplacer le point de départ
        const dx = worldPos.x - draggedLine.x;
        const dy = worldPos.y - draggedLine.y;

        updateElement(draggedLine.id, {
          x: worldPos.x,
          y: worldPos.y,
          width: draggedLine.width - dx,
          height: draggedLine.height - dy,
        } as any);
      } else if (draggedLineHandle.type === 'end') {
        // Déplacer le point de fin
        const newWidth = worldPos.x - draggedLine.x;
        const newHeight = worldPos.y - draggedLine.y;

        updateElement(draggedLine.id, {
          width: newWidth,
          height: newHeight,
        } as any);
      }

      // Mettre à jour draggedLine pour la prochaine frame
      const freshLine = $elements.find(el => el.id === draggedLine!.id);
      if (freshLine && freshLine.type === 'line') {
        draggedLine = freshLine as ExcalidrawElement;
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
    if (isDrawingSelectionBox && selectionBoxStart && selectionBoxCurrent) {
      const box = normalizeSelectionBox(selectionBoxStart, selectionBoxCurrent);
      const selectedElements = getElementsInSelectionBox($elements, box, 'center');

      appState.update(s => ({
        ...s,
        selectedElementIds: new Set(selectedElements.map(el => el.id)),
      }));

      isDrawingSelectionBox = false;
      selectionBoxStart = null;
      selectionBoxCurrent = null;
      return;
    }

    if (isDrawing && currentElementId && $appState.activeTool === 'arrow') {
      const arrow = $elements.find(el => el.id === currentElementId);
      if (arrow && arrow.type === 'arrow') {
        const updatedArrow = updateArrowBoundingBox(arrow as ArrowElement);
        updateElement(currentElementId, updatedArrow as any);
      }
    }

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

    if (isDragging && draggedElement && draggedElement.type === 'arrow') {
      const arrowEl = draggedElement as ArrowElement;
      if (arrowEl.startBinding || arrowEl.endBinding) {
        const updatedArrow = updateArrowBindingOffsets(arrowEl, $elements);
        updateElement(arrowEl.id, updatedArrow as any);
      }
    }

    if (isDrawing || isDraggingHandle || isDragging || isDraggingTransformHandle || isDraggingGroup || isDraggingGroupHandle) {
      history.record($elements);
    }

    isPanning = false;
    isDrawing = false;
    isDragging = false;
    isDraggingHandle = false;
    isDraggingTransformHandle = false;
    isDrawingSelectionBox = false;
    isDraggingGroup = false;
    isDraggingGroupHandle = false;
    drawStart = null;
    currentElementId = null;
    draggedElement = null;
    draggedHandle = null;
    draggedArrow = null;
    draggedLineHandle = null;
    draggedLine = null;
    draggedTransformHandle = null;
    transformStartPoint = null;
    transformOriginalElement = null;
    selectionBoxStart = null;
    selectionBoxCurrent = null;
    draggedGroupHandle = null;
    groupTransformStart = null;
    originalGroupElements = [];
    originalGroupBounds = null;
    clickedGroupElement = null;
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
      color: {getColorFromIndex(editingTextElement.strokeColorIndex, $appState.theme)};
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
    transition: background-color 0.3s ease;
  }
</style>
