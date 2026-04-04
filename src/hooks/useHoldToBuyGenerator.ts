import { useCallback, useContext, useRef } from "react";
import Decimal from "break_eternity.js";
import { StoreContext, useGameDispatch } from "@/store/useGameStore";
import { useBuyMode } from "@/contexts/BuyModeContext";
import type { GeneratorId } from "@/engine/constants";
import { computeGeneratorPurchase } from "@/utils/computeGeneratorPurchase";

const HOLD_MS = 320;
const REPEAT_MS = 75;

export function useHoldToBuyGenerator(id: GeneratorId) {
  const store = useContext(StoreContext);
  const dispatch = useGameDispatch();
  const { buyMode } = useBuyMode();
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerIdRef = useRef<number | null>(null);

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

  const tryBuy = useCallback(() => {
    if (!store) return;
    const { amount, canPurchase } = computeGeneratorPurchase(
      store.getState(),
      id,
      buyMode
    );
    if (!canPurchase || amount.lt(Decimal.dOne)) {
      stopRepeat();
      return;
    }
    dispatch({ type: "BUY_GENERATOR", id, amount });
  }, [store, dispatch, id, buyMode, stopRepeat]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!store) return;
      if (e.button !== 0) return;
      e.preventDefault();
      pointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        tryBuy();
        repeatRef.current = setInterval(tryBuy, REPEAT_MS);
      }, HOLD_MS);
    },
    [store, tryBuy]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (pointerIdRef.current !== e.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      pointerIdRef.current = null;

      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
        tryBuy();
      }
      stopRepeat();
    },
    [tryBuy, stopRepeat]
  );

  const onPointerCancel = useCallback(() => {
    clearAll();
  }, [clearAll]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!store) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        tryBuy();
      }
    },
    [store, tryBuy]
  );

  const onLostPointerCapture = useCallback(() => {
    clearAll();
  }, [clearAll]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
    onKeyDown,
  };
}
