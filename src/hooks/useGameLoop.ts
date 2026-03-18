import { useEffect, useRef } from "react";
import { useGameDispatch } from "@/store/useGameStore";
import { flushCycleBars } from "@/hooks/cycleBarRegistry";

const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;

export function useGameLoop() {
  const dispatch = useGameDispatch();
  const lastRealTimeRef = useRef<number>(performance.now());
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick(time: number) {
      if (time - lastTickTimeRef.current >= FRAME_MS) {
        const delta = time - lastRealTimeRef.current;
        lastRealTimeRef.current = time;
        lastTickTimeRef.current = time;
        dispatch({ type: "TICK", deltaTimeMs: delta, currentTimestamp: Date.now() });
      }

      flushCycleBars();

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dispatch]);
}
