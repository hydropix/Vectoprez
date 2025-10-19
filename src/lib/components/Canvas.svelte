<script lang="ts">
  import { onMount } from 'svelte';
  import { appState, pan } from '../stores/appState';
  import { elements, addElement, updateElement, deleteElements } from '../stores/elements';
  import { renderElements } from '../engine/canvas/renderer';
  import { screenToWorld } from '../engine/canvas/coordinates';
  import { createElement } from '../engine/elements/factory';
  import { getElementAtPosition } from '../engine/collision/detection';
  import { history } from '../engine/history/undoRedo';
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
  import { updateHierarchy, finalizeHierarchyChange } from '../engine/container/hierarchy';
  import { moveWithChildren } from '../engine/container/transform';
  import { updateContainerBounds, calculateRequiredBounds } from '../engine/container/autoResize';
  import { renderContainerPreview, renderHierarchyIndicator, renderDropTargetHighlight, renderDetachIndicator, createAnimationState, getAnimationProgress, isAnimationComplete, type AnimationState } from '../engine/container/feedback';
  import type { Bounds } from '../engine/container/autoResize';
  import { isValidContainerType } from '../engine/container/detection';
  import { updateTextDimensions, shouldDeleteEmptyText } from '../engine/text/editing';
  import { calculateTextScale } from '../engine/text/transform';
  import { MIN_ELEMENT_SIZE_SCREEN } from '../constants';
  import { collectElementIdsWithChildren } from '$lib/utils/clipboard';

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
  let lastDraggedElementPos: Point | null = null;
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
  let justHandledDoubleClick = false;
  let isEditingText = false;
  let editingTextElement: TextElement | null = null;
  let textInputElement: HTMLTextAreaElement | null = null;
  let currentCursor: CursorType = 'default';
  let isOverElement = false;
  let isOverHandle = false;
  let isOverTransformHandle = false;
  let hoverTransformHandleType: TransformHandle | null = null;
  let potentialContainer: ExcalidrawElement | null = null;
  let shouldDetach = false;
  let containerAnimations: Map<string, AnimationState> = new Map();
  let previewBounds: Bounds | null = null;

  $: if ($appState.theme) {
    const bgColor = $appState.theme === 'light' ? '#F06E65' : '#1a1a1a';
    appState.update(s => ({ ...s, viewBackgroundColor: bgColor }));
  }


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

    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    for (const element of $elements) {
      if (isValidContainerType(element)) {
        renderHierarchyIndicator(ctx, element as ExcalidrawElement, $appState.zoom);
      }
    }

    if ((isDragging || isDraggingGroup) && potentialContainer && !shouldDetach) {
      renderDropTargetHighlight(ctx, potentialContainer, $appState.zoom);
    }

    if (isDragging && shouldDetach && draggedElement?.parentId) {
      const parentElement = $elements.find(el => el.id === draggedElement!.parentId);
      if (parentElement && isValidContainerType(parentElement)) {
        renderDetachIndicator(ctx, parentElement as ExcalidrawElement, $appState.zoom);
      }
    }

    if (isDraggingGroup && shouldDetach && clickedGroupElement) {
      const draggedGroupElement = originalGroupElements.find(el => el.id === clickedGroupElement!.id);
      if (draggedGroupElement?.parentId) {
        const parentElement = $elements.find(el => el.id === draggedGroupElement.parentId);
        if (parentElement && isValidContainerType(parentElement)) {
          renderDetachIndicator(ctx, parentElement as ExcalidrawElement, $appState.zoom);
        }
      }
    }

    if (potentialContainer && previewBounds) {
      renderContainerPreview(ctx, potentialContainer, previewBounds, 1);
    }

    for (const [containerId, animation] of containerAnimations.entries()) {
      const container = $elements.find(el => el.id === containerId);
      if (container && isValidContainerType(container)) {
        const progress = getAnimationProgress(animation);
        renderContainerPreview(ctx, container as ExcalidrawElement, animation.endBounds, progress);

        if (isAnimationComplete(animation)) {
          containerAnimations.delete(containerId);
        }
      }
    }

    ctx.restore();

    renderHoverFeedback(ctx);

    renderSelection(ctx);

    requestAnimationFrame(render);
  }

  function renderGrid(ctx: CanvasRenderingContext2D, state: typeof $appState) {
    const gridSize = state.gridSize!;
    const dotSize = 1.5;
    ctx.fillStyle = state.theme === 'light'
      ? 'rgba(0, 0, 0, 0.08)'
      : 'rgba(255, 255, 255, 0.08)';

    const startX = Math.floor((-state.scrollX / state.zoom) / gridSize) * gridSize;
    const startY = Math.floor((-state.scrollY / state.zoom) / gridSize) * gridSize;
    const endX = startX + (canvasEl.width / state.zoom);
    const endY = startY + (canvasEl.height / state.zoom);

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
    if (!$appState.hoveredElementId) return;
    if ($appState.selectedElementIds.has($appState.hoveredElementId)) return;

    const hoveredElement = $elements.find(el => el.id === $appState.hoveredElementId);
    if (!hoveredElement) return;

    ctx.save();
    ctx.translate($appState.scrollX, $appState.scrollY);
    ctx.scale($appState.zoom, $appState.zoom);

    const HANDLE_MARGIN = 10;
    const margin = HANDLE_MARGIN / $appState.zoom;

    ctx.shadowColor = 'rgba(128, 128, 128, 0.25)';
    ctx.shadowBlur = 12 / $appState.zoom;
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.4)';
    ctx.lineWidth = 3.5 / $appState.zoom;
    ctx.setLineDash([]);

    if (hoveredElement.type === 'arrow') {
      const arrow = hoveredElement as ArrowElement;
      ctx.strokeRect(
        arrow.x - margin,
        arrow.y - margin,
        arrow.width + margin * 2,
        arrow.height + margin * 2
      );
    } else {
      ctx.strokeRect(
        hoveredElement.x - margin,
        hoveredElement.y - margin,
        hoveredElement.width + margin * 2,
        hoveredElement.height + margin * 2
      );
    }

    ctx.setLineDash([]);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const worldX = (mouseX - $appState.scrollX) / $appState.zoom;
    const worldY = (mouseY - $appState.scrollY) / $appState.zoom;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, $appState.zoom * delta));

    const newScrollX = mouseX - worldX * newZoom;
    const newScrollY = mouseY - worldY * newZoom;

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

    const now = Date.now();
    const DOUBLE_CLICK_THRESHOLD = 300;
    const DISTANCE_THRESHOLD = 5;
    const isDoubleClick = lastClickPos &&
      now - lastClickTime < DOUBLE_CLICK_THRESHOLD &&
      Math.abs(worldPos.x - lastClickPos.x) < DISTANCE_THRESHOLD &&
      Math.abs(worldPos.y - lastClickPos.y) < DISTANCE_THRESHOLD;

    if (isDoubleClick) {
      if (currentElementId) {
        elements.update(els => els.filter(el => el.id !== currentElementId));
        currentElementId = null;
        isDrawing = false;
        drawStart = null;
      }
      justHandledDoubleClick = true;
      handleDoubleClick(worldPos);
      lastClickTime = 0;
      lastClickPos = null;
      return;
    }

    justHandledDoubleClick = false;

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
            const idsWithChildren = collectElementIdsWithChildren([hitElement.id], $elements);

            if (newSelection.has(hitElement.id)) {
              for (const id of idsWithChildren) {
                newSelection.delete(id);
              }
            } else {
              for (const id of idsWithChildren) {
                newSelection.add(id);
              }
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
              lastDraggedElementPos = { x: hitElement.x, y: hitElement.y };
              dragOffset = {
                x: worldPos.x - hitElement.x,
                y: worldPos.y - hitElement.y,
              };
              const idsWithChildren = collectElementIdsWithChildren([hitElement.id], $elements);
              appState.update(s => ({
                ...s,
                selectedElementIds: new Set(idsWithChildren),
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
      isDrawing = true;
      drawStart = worldPos;

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
        startArrowhead: null,
        endArrowhead: 'arrow',
      } as ArrowElement;

      addElement(newArrow);
      currentElementId = newArrow.id;

      history.record($elements);
    } else if ($appState.activeTool === 'text') {
      isDrawing = false;

      const fontSize = 20;
      const estimatedWidth = 100;
      const estimatedHeight = fontSize * 1.2;

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
      };

      addElement(newText);
      startTextEditing(newText);

      history.record($elements);
    }
  }

  function handleMouseMove(e: MouseEvent) {
    const worldPos = screenToWorld(
      { x: e.clientX, y: e.clientY },
      { scrollX: $appState.scrollX, scrollY: $appState.scrollY, zoom: $appState.zoom }
    );

    appState.update(s => ({
      ...s,
      mousePosition: { x: e.clientX, y: e.clientY },
    }));

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

      const rootElements = originalGroupElements.filter(el => !el.parentId || !originalGroupElements.some(other => other.id === el.parentId));
      if (rootElements.length === 1 && clickedGroupElement) {
        const movedClickedElement = $elements.find(el => el.id === clickedGroupElement!.id);
        if (movedClickedElement) {
          const hierarchyUpdate = updateHierarchy(movedClickedElement.id, $elements);
          potentialContainer = hierarchyUpdate.potentialContainer;
          shouldDetach = hierarchyUpdate.shouldDetach;

          if (potentialContainer) {
            const tempElement = movedClickedElement;
            const children = [tempElement];
            previewBounds = calculateRequiredBounds(potentialContainer, children);
          } else {
            previewBounds = null;
          }
        }
      }
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
      }
    } else if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      pan(dx, dy);
      lastMousePos = { x: e.clientX, y: e.clientY };
    } else if (isDraggingTransformHandle && draggedTransformHandle && transformStartPoint && transformOriginalElement && ctx) {
      const selectedIds = Array.from($appState.selectedElementIds);
      if (selectedIds.length === 1) {
        const elementId = selectedIds[0];

        if (draggedTransformHandle.type === 'rotate') {
          const newAngle = calculateRotation(transformOriginalElement, worldPos);
          const snappedAngle = e.shiftKey ? snapRotation(newAngle, true) : newAngle;

          updateElement(elementId, {
            angle: snappedAngle,
          } as any);
        } else {
          if (transformOriginalElement.type === 'text') {
            const scaleResult = calculateTextScale(
              transformOriginalElement as TextElement,
              draggedTransformHandle.type,
              transformStartPoint,
              worldPos,
              ctx
            );

            updateElement(elementId, scaleResult as any);
          } else {
            const resizeResult = calculateResize(
              transformOriginalElement,
              draggedTransformHandle.type,
              transformStartPoint,
              worldPos,
              e.shiftKey
            );

            updateElement(elementId, resizeResult as any);
          }
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

      const updates: any = { points: newPoints };

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
    } else if (isDragging && draggedElement && lastDraggedElementPos) {
      const newX = worldPos.x - dragOffset.x;
      const newY = worldPos.y - dragOffset.y;
      const dx = newX - lastDraggedElementPos.x;
      const dy = newY - lastDraggedElementPos.y;

      const hasChildren = isValidContainerType(draggedElement) &&
        (draggedElement as ExcalidrawElement).childrenIds.length > 0;

      let updatedElements: AnyExcalidrawElement[];
      if (hasChildren) {
        updatedElements = moveWithChildren(draggedElement!.id, dx, dy, $elements);
        lastDraggedElementPos = { x: newX, y: newY };
      } else {
        updatedElements = $elements.map(el =>
          el.id === draggedElement!.id
            ? { ...el, x: newX, y: newY }
            : el
        );
      }

      elements.set(updatedElements);

      const hierarchyUpdate = updateHierarchy(draggedElement!.id, updatedElements);
      potentialContainer = hierarchyUpdate.potentialContainer;
      shouldDetach = hierarchyUpdate.shouldDetach;

      if (potentialContainer) {
        const tempElement = updatedElements.find(el => el.id === draggedElement!.id)!;
        const children = [tempElement];
        previewBounds = calculateRequiredBounds(potentialContainer, children);
      } else {
        previewBounds = null;
      }
    } else if (isDrawing && drawStart && currentElementId) {
      if ($appState.activeTool === 'arrow') {
        const arrow = $elements.find(el => el.id === currentElementId);
        if (!arrow || arrow.type !== 'arrow') return;

        const dx = worldPos.x - drawStart.x;
        const dy = worldPos.y - drawStart.y;

        const tempArrow = {
          ...arrow,
          points: [
            { x: 0, y: 0 },
            { x: dx, y: dy },
          ],
        } as ArrowElement;

        updateElement(currentElementId, tempArrow as any);
      } else {
        const width = worldPos.x - drawStart.x;
        const height = worldPos.y - drawStart.y;

        const absWidth = Math.abs(width);
        const absHeight = Math.abs(height);
        const x = width < 0 ? drawStart.x + width : drawStart.x;
        const y = height < 0 ? drawStart.y + height : drawStart.y;

        updateElement(currentElementId, { x, y, width: absWidth, height: absHeight } as any);
      }
    }
  }

  function handleDoubleClick(worldPos: Point) {
    const hitElement = getElementAtPosition($elements, worldPos);

    if (hitElement && hitElement.type === 'text') {
      startTextEditing(hitElement as TextElement);
      return;
    }

    const selectedIds = Array.from($appState.selectedElementIds);
    if (hitElement && selectedIds.includes(hitElement.id)) {
      appState.update(s => ({ ...s, isPropertiesPanelOpen: true }));
    }

    for (const id of selectedIds) {
      const element = $elements.find(el => el.id === id);
      if (element && element.type === 'arrow') {
        const arrow = element as ArrowElement;

        const handle = getHandleAtPosition(arrow, worldPos, $appState.zoom);
        if (handle && handle.type === 'mid') {
          let updatedArrow = removeControlPoint(arrow, handle.pointIndex);
          updatedArrow = updateArrowBoundingBox(updatedArrow);
          updateElement(arrow.id, updatedArrow as any);
          history.record($elements);
          return;
        }

        if (arrow.points.length === 2) {
          let updatedArrow = addControlPoint(arrow);
          updatedArrow = updateArrowBoundingBox(updatedArrow);
          updateElement(arrow.id, updatedArrow as any);
          history.record($elements);
          return;
        }
      }
    }

    if (!hitElement) {
      const fontSize = 20;
      const estimatedWidth = 100;
      const estimatedHeight = fontSize * 1.2;

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
      };

      addElement(newText);
      startTextEditing(newText);
      history.record($elements);
    }
  }

  function handleMouseUp() {
    if (justHandledDoubleClick) {
      justHandledDoubleClick = false;
      return;
    }

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

    if (isDrawing && drawStart && currentElementId && ['rectangle', 'ellipse', 'line'].includes($appState.activeTool)) {
      const element = $elements.find(el => el.id === currentElementId);
      if (element) {
        const widthInScreen = Math.abs(element.width) * $appState.zoom;
        const heightInScreen = Math.abs(element.height) * $appState.zoom;

        if (widthInScreen < MIN_ELEMENT_SIZE_SCREEN && heightInScreen < MIN_ELEMENT_SIZE_SCREEN) {
          deleteElements([currentElementId]);
          isDrawing = false;
          drawStart = null;
          currentElementId = null;
          return;
        }
      }
    }

    if (isDrawing && drawStart && currentElementId && $appState.activeTool === 'arrow') {
      const arrow = $elements.find(el => el.id === currentElementId);
      if (arrow && arrow.type === 'arrow') {
        const points = (arrow as ArrowElement).points;
        if (points.length >= 2) {
          const dx = points[points.length - 1].x - points[0].x;
          const dy = points[points.length - 1].y - points[0].y;
          const distanceInScreen = Math.sqrt(dx * dx + dy * dy) * $appState.zoom;

          if (distanceInScreen < MIN_ELEMENT_SIZE_SCREEN) {
            deleteElements([currentElementId]);
            isDrawing = false;
            drawStart = null;
            currentElementId = null;
            return;
          }
        }
      }
    }

    if (isDragging && draggedElement) {
      let updatedElements = finalizeHierarchyChange(
        draggedElement.id,
        potentialContainer,
        shouldDetach,
        $elements
      );

      if (potentialContainer || shouldDetach) {
        if (potentialContainer) {
          updatedElements = updateContainerBounds(potentialContainer!.id, updatedElements);

          const container = updatedElements.find(el => el.id === potentialContainer!.id);
          if (container && isValidContainerType(container)) {
            const startBounds: Bounds = {
              x: potentialContainer.x,
              y: potentialContainer.y,
              width: potentialContainer.width,
              height: potentialContainer.height
            };
            const endBounds: Bounds = {
              x: (container as ExcalidrawElement).x,
              y: (container as ExcalidrawElement).y,
              width: (container as ExcalidrawElement).width,
              height: (container as ExcalidrawElement).height
            };
            containerAnimations.set(potentialContainer.id, createAnimationState(startBounds, endBounds));
          }
        }

        if (shouldDetach && draggedElement.parentId) {
          const oldParentId = draggedElement.parentId;
          updatedElements = updateContainerBounds(oldParentId, updatedElements);

          const oldParent = updatedElements.find(el => el.id === oldParentId);
          if (oldParent && isValidContainerType(oldParent)) {
            const startBounds: Bounds = {
              x: oldParent.x,
              y: oldParent.y,
              width: oldParent.width,
              height: oldParent.height
            };
            const endBounds: Bounds = {
              x: oldParent.x,
              y: oldParent.y,
              width: (oldParent as ExcalidrawElement).originalBounds?.width ?? oldParent.width,
              height: (oldParent as ExcalidrawElement).originalBounds?.height ?? oldParent.height
            };
            containerAnimations.set(oldParentId, createAnimationState(startBounds, endBounds));
          }
        }
      }

      elements.set(updatedElements);

      potentialContainer = null;
      shouldDetach = false;
      previewBounds = null;
    }

    if (isDraggingGroup && clickedGroupElement && originalGroupElements.length > 0) {
      const rootElements = originalGroupElements.filter(el => !el.parentId || !originalGroupElements.some(other => other.id === el.parentId));

      if (rootElements.length === 1 && (potentialContainer || shouldDetach)) {
        const draggedElementId = clickedGroupElement.id;
        let updatedElements = finalizeHierarchyChange(
          draggedElementId,
          potentialContainer,
          shouldDetach,
          $elements
        );

        if (potentialContainer) {
          updatedElements = updateContainerBounds(potentialContainer!.id, updatedElements);

          const container = updatedElements.find(el => el.id === potentialContainer!.id);
          if (container && isValidContainerType(container)) {
            const startBounds: Bounds = {
              x: potentialContainer.x,
              y: potentialContainer.y,
              width: potentialContainer.width,
              height: potentialContainer.height
            };
            const endBounds: Bounds = {
              x: (container as ExcalidrawElement).x,
              y: (container as ExcalidrawElement).y,
              width: (container as ExcalidrawElement).width,
              height: (container as ExcalidrawElement).height
            };
            containerAnimations.set(potentialContainer.id, createAnimationState(startBounds, endBounds));
          }
        }

        if (shouldDetach) {
          const originalDraggedElement = originalGroupElements.find(el => el.id === draggedElementId);
          if (originalDraggedElement?.parentId) {
            const oldParentId = originalDraggedElement.parentId;
            updatedElements = updateContainerBounds(oldParentId, updatedElements);

            const oldParent = updatedElements.find(el => el.id === oldParentId);
            if (oldParent && isValidContainerType(oldParent)) {
              const startBounds: Bounds = {
                x: oldParent.x,
                y: oldParent.y,
                width: oldParent.width,
                height: oldParent.height
              };
              const endBounds: Bounds = {
                x: oldParent.x,
                y: oldParent.y,
                width: (oldParent as ExcalidrawElement).originalBounds?.width ?? oldParent.width,
                height: (oldParent as ExcalidrawElement).originalBounds?.height ?? oldParent.height
              };
              containerAnimations.set(oldParentId, createAnimationState(startBounds, endBounds));
            }
          }
        }

        elements.set(updatedElements);
      }

      potentialContainer = null;
      shouldDetach = false;
      previewBounds = null;
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
    lastDraggedElementPos = null;
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

    const dimensions = updateTextDimensions(
      text,
      editingTextElement.fontSize,
      editingTextElement.fontFamily,
      ctx
    );

    const updatedText: Partial<TextElement> = {
      text,
      width: dimensions.width,
      height: dimensions.height,
    };

    updateElement(editingTextElement.id, updatedText as any);

    const updated = $elements.find(el => el.id === editingTextElement!.id);
    if (updated && updated.type === 'text') {
      editingTextElement = updated as TextElement;
    }
  }

  function finishTextEditing() {
    if (!editingTextElement) return;

    if (shouldDeleteEmptyText(editingTextElement.text)) {
      elements.update(els => els.filter(el => el.id !== editingTextElement!.id));
    }

    isEditingText = false;
    editingTextElement = null;
    textInputElement = null;

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
      border: none;
      outline: none;
      resize: none;
      overflow: hidden;
      padding: 0;
      white-space: pre-wrap;
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
