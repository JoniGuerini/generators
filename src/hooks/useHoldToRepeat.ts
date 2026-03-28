import { useCallback, useRef } from "react";

const HOLD_MS = 320;
const REPEAT_MS = 75;

/**
 * Hook genérico de "segurar para repetir".
 * Executa `action` no clique e, ao segurar, repete a cada 75ms.
 */
export function useHoldToRepeat(action: () => void) {
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const stopRepeat = useCallback(() => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }, []);

  const clearAll = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    stopRepeat();
    pointerIdRef.current = null;
  }, [stopRepeat]);

  const fire = useCallback(() => {
    actionRef.current();
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      pointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch { /* ignore */ }
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        fire();
        repeatRef.current = setInterval(fire, REPEAT_MS);
      }, HOLD_MS);
    },
    [fire]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch { /* ignore */ }
      pointerIdRef.current = null;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        fire();
      }
      stopRepeat();
    },
    [fire, stopRepeat]
  );

  const onPointerCancel = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const onLostPointerCapture = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fire();
      }
    },
    [fire]
  );

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onKeyDown,
  };
}
