import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_MARGIN = 16;
const DEFAULT_ORB_SIZE = 84;

function getViewport() {
  if (typeof window === "undefined") {
    return { width: 1440, height: 900 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

function getEffectiveRightInset(viewport, rightInset) {
  return viewport.width <= 760 ? 0 : rightInset;
}

function clampPosition(position, viewport, orbSize, margin, rightInset = 0, bottomInset = 0) {
  const effectiveRightInset = getEffectiveRightInset(viewport, rightInset);
  return {
    x: clamp(position.x, margin, viewport.width - orbSize - margin - effectiveRightInset),
    y: clamp(position.y, margin, viewport.height - orbSize - margin - bottomInset)
  };
}

function getDefaultPosition(viewport, orbSize, margin, rightInset = 0, bottomInset = 0) {
  const effectiveRightInset = getEffectiveRightInset(viewport, rightInset);
  return {
    x: viewport.width - orbSize - margin - effectiveRightInset,
    y: viewport.height - orbSize - margin - bottomInset
  };
}

function getRelativePosition(position, viewport, orbSize, margin, rightInset = 0, bottomInset = 0) {
  const effectiveRightInset = getEffectiveRightInset(viewport, rightInset);
  const availableWidth = Math.max(1, viewport.width - orbSize - margin * 2 - effectiveRightInset);
  const availableHeight = Math.max(1, viewport.height - orbSize - margin * 2 - bottomInset);

  return {
    xRatio: clamp((position.x - margin) / availableWidth, 0, 1),
    yRatio: clamp((position.y - margin) / availableHeight, 0, 1)
  };
}

function positionFromRatios(ratios, viewport, orbSize, margin, rightInset = 0, bottomInset = 0) {
  const effectiveRightInset = getEffectiveRightInset(viewport, rightInset);
  const availableWidth = Math.max(0, viewport.width - orbSize - margin * 2 - effectiveRightInset);
  const availableHeight = Math.max(0, viewport.height - orbSize - margin * 2 - bottomInset);

  return clampPosition({
    x: margin + clamp(ratios.xRatio, 0, 1) * availableWidth,
    y: margin + clamp(ratios.yRatio, 0, 1) * availableHeight
  }, viewport, orbSize, margin, rightInset, bottomInset);
}

function getSavedPosition(storageKey, viewport, orbSize, margin, rightInset = 0, bottomInset = 0) {
  if (typeof window === "undefined") {
    return getDefaultPosition(viewport, orbSize, margin, rightInset, bottomInset);
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Number.isFinite(parsed?.xRatio) && Number.isFinite(parsed?.yRatio)) {
        // A posição escolhida pelo usuário ocupa toda a viewport. Os recuos
        // laterais servem somente para a posição inicial, nunca para limitar
        // a liberdade de reposicionamento da esfera.
        return positionFromRatios(parsed, viewport, orbSize, margin);
      }
      return getDefaultPosition(viewport, orbSize, margin, rightInset, bottomInset);
    }
  } catch {
    // A posição é apenas uma preferência visual; falhas de storage não bloqueiam o tutor.
  }

  return getDefaultPosition(viewport, orbSize, margin, rightInset, bottomInset);
}

export function getTutorPanelStyle(
  position,
  viewport,
  { orbSize = DEFAULT_ORB_SIZE, width = 430, maxHeight = 720, gap = 16, margin = 16 } = {}
) {
  const panelWidth = Math.min(width, viewport.width - margin * 2);
  const panelHeight = Math.min(maxHeight, viewport.height - margin * 2);

  if (viewport.width <= 720) {
    return {
      top: margin,
      left: margin,
      right: "auto",
      bottom: "auto",
      width: viewport.width - margin * 2,
      height: Math.max(300, viewport.height - orbSize - margin * 3),
      maxHeight: Math.max(300, viewport.height - orbSize - margin * 3)
    };
  }

  const preferredLeft = position.x > viewport.width / 2
    ? position.x - panelWidth - gap
    : position.x + orbSize + gap;
  const left = clamp(preferredLeft, margin, viewport.width - panelWidth - margin);
  const top = clamp(
    position.y + orbSize / 2 - panelHeight / 2,
    margin,
    viewport.height - panelHeight - margin
  );

  return {
    top,
    left,
    right: "auto",
    bottom: "auto",
    width: panelWidth,
    height: panelHeight,
    maxHeight: panelHeight
  };
}

export function getTutorPanelMorphStyle(
  panelStyle,
  position,
  { orbSize = DEFAULT_ORB_SIZE } = {}
) {
  if (!panelStyle || !position) return panelStyle;

  const panelLeft = Number(panelStyle.left) || 0;
  const panelTop = Number(panelStyle.top) || 0;
  const panelWidth = Number(panelStyle.width) || 430;
  const panelHeight = Number(panelStyle.height || panelStyle.maxHeight) || 720;
  const sourceCenterX = position.x + orbSize / 2;
  const sourceCenterY = position.y + orbSize / 2;
  const panelCenterX = panelLeft + panelWidth / 2;
  const panelCenterY = panelTop + panelHeight / 2;

  return {
    ...panelStyle,
    "--aog-morph-x": `${sourceCenterX - panelCenterX}px`,
    "--aog-morph-y": `${sourceCenterY - panelCenterY}px`,
    "--aog-focus-x": `${sourceCenterX}px`,
    "--aog-focus-y": `${sourceCenterY}px`
  };
}

export default function useDraggableTutorOrb({
  enabled = true,
  storageKey = "aeternum_atlas_ai_orb_position",
  orbSize = DEFAULT_ORB_SIZE,
  margin = DEFAULT_MARGIN,
  rightInset = 0,
  bottomInset = 0
} = {}) {
  const initialViewport = getViewport();
  const [viewport, setViewport] = useState(initialViewport);
  const [position, setPosition] = useState(() => (
    getSavedPosition(storageKey, initialViewport, orbSize, margin, rightInset, bottomInset)
  ));
  const [isDragging, setIsDragging] = useState(false);
  const positionRef = useRef(position);
  const viewportRef = useRef(initialViewport);
  const dragRef = useRef(null);
  const movedRef = useRef(false);

  const updatePosition = useCallback((nextPosition) => {
    positionRef.current = nextPosition;
    setPosition(nextPosition);
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleResize = () => {
      const nextViewport = getViewport();
      const relativePosition = getRelativePosition(
        positionRef.current,
        viewportRef.current,
        orbSize,
        margin
      );
      viewportRef.current = nextViewport;
      setViewport(nextViewport);
      updatePosition(positionFromRatios(relativePosition, nextViewport, orbSize, margin));
    };

    window.addEventListener("resize", handleResize);
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, [bottomInset, enabled, margin, orbSize, rightInset, updatePosition]);

  const onPointerDown = useCallback((event) => {
    if (!enabled) return;
    event.preventDefault();
    movedRef.current = false;
    dragRef.current = {
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      originX: positionRef.current.x,
      originY: positionRef.current.y
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  }, [enabled]);

  const onPointerMove = useCallback((event) => {
    const drag = dragRef.current;
    if (!enabled || !drag || drag.pointerId !== event.pointerId) return;

    if (event.cancelable) event.preventDefault();
    const deltaX = event.clientX - drag.pointerX;
    const deltaY = event.clientY - drag.pointerY;
    if (Math.hypot(deltaX, deltaY) > 5) movedRef.current = true;

    updatePosition(clampPosition({
      x: drag.originX + deltaX,
      y: drag.originY + deltaY
    }, viewport, orbSize, margin));
  }, [enabled, margin, orbSize, updatePosition, viewport]);

  const finishDrag = useCallback((event) => {
    const drag = dragRef.current;
    if (!enabled || !drag || drag.pointerId !== event.pointerId) return;

    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);

    if (movedRef.current) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({
          ...positionRef.current,
          ...getRelativePosition(positionRef.current, viewportRef.current, orbSize, margin)
        }));
      } catch {
        // O tutor permanece funcional mesmo quando o navegador bloqueia o storage.
      }
    }
  }, [enabled, margin, orbSize, storageKey]);

  useEffect(() => {
    if (!enabled || !isDragging) return undefined;

    // O Viewer pode conter iframes 3D. Acompanhar o gesto pela janela inteira
    // mantém o arraste contínuo mesmo quando o cursor atravessa esses elementos.
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", finishDrag);
    window.addEventListener("pointercancel", finishDrag);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishDrag);
      window.removeEventListener("pointercancel", finishDrag);
    };
  }, [enabled, finishDrag, isDragging, onPointerMove]);

  const consumeDragClick = useCallback(() => {
    if (!movedRef.current) return false;
    movedRef.current = false;
    return true;
  }, []);

  return {
    position,
    viewport,
    isDragging,
    consumeDragClick,
    dragHandlers: enabled ? {
      onPointerDown,
      onPointerMove,
      onPointerUp: finishDrag,
      onPointerCancel: finishDrag,
      onLostPointerCapture: finishDrag
    } : {}
  };
}
