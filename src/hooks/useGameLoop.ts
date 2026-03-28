import { useEffect, useRef } from "react";
import { useGameDispatch } from "@/store/useGameStore";
import { flushCycleBars } from "@/hooks/cycleBarRegistry";

const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;

/**
 * Delta máximo por TICK (ms). Previne saltos bruscos quando a aba volta
 * do background — períodos maiores são tratados pelo sistema offline.
 */
const MAX_TICK_DELTA_MS = 2000;

export function useGameLoop() {
  const dispatch = useGameDispatch();
  const lastRealTimeRef = useRef<number>(performance.now());
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        pausedRef.current = true;
      } else {
        pausedRef.current = false;
        lastRealTimeRef.current = performance.now();
        lastTickTimeRef.current = performance.now();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    function tick(time: number) {
      if (!pausedRef.current && time - lastTickTimeRef.current >= FRAME_MS) {
        const rawDelta = time - lastRealTimeRef.current;
        const delta = Math.min(rawDelta, MAX_TICK_DELTA_MS);
        lastRealTimeRef.current = time;
        lastTickTimeRef.current = time;
        dispatch({ type: "TICK", deltaTimeMs: delta, currentTimestamp: Date.now() });
      }

      flushCycleBars();

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [dispatch]);
}
