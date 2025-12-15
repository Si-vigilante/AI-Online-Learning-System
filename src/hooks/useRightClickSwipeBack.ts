import { useEffect, useRef } from 'react';

const SWIPE_X_THRESHOLD = -80; // negative: swipe left
const SWIPE_Y_TOLERANCE = 60;

interface Options {
  enableRightClickSwipeBack?: boolean;
  onBack?: () => void;
  fallbackPath?: string;
}

const isInteractiveElement = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (['input', 'textarea', 'select', 'option', 'button'].includes(tag)) return true;
  if (el.isContentEditable) return true;
  if (el.dataset?.disableSwipeback === 'true') return true;
  return false;
};

export function useRightClickSwipeBack(options: Options = {}) {
  const { enableRightClickSwipeBack = true, onBack, fallbackPath = '/' } = options;
  const startX = useRef(0);
  const startY = useRef(0);
  const active = useRef(false);
  const triggered = useRef(false);
  const preventContextMenu = useRef(false);

  const goBackSafely = () => {
    const before = window.location.href;
    const historyLen = window.history.length;
    console.log('[swipeback] trigger back', { historyLen, url: before });
    window.history.back();
    setTimeout(() => {
      const after = window.location.href;
      if (after === before || window.history.length <= 1) {
        window.location.assign(fallbackPath);
      }
    }, 300);
  };

  useEffect(() => {
    if (!enableRightClickSwipeBack) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 2) return; // only right button
      if (isInteractiveElement(e.target)) return;
      active.current = true;
      triggered.current = false;
      preventContextMenu.current = false;
      startX.current = e.clientX;
      startY.current = e.clientY;
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!active.current || triggered.current) return;
      if ((e.buttons & 2) === 0) return; // ensure right button still pressed
      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;
      if (deltaX <= SWIPE_X_THRESHOLD && Math.abs(deltaY) <= SWIPE_Y_TOLERANCE) {
        triggered.current = true;
        preventContextMenu.current = true;
        if (onBack) {
          onBack();
        } else {
          goBackSafely();
        }
      }
    };

    const handlePointerUp = () => {
      active.current = false;
    };

    const handlePointerCancel = () => {
      active.current = false;
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (preventContextMenu.current) {
        e.preventDefault();
        preventContextMenu.current = false;
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true } as any);
    };
  }, [enableRightClickSwipeBack, onBack]);
}
