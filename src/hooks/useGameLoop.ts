import { useEffect, useRef } from "react";
import { useGameDispatch } from "@/store/useGameStore";

const TARGET_FPS = 60;
const FRAME_MS = 1000 / TARGET_FPS;

export function useGameLoop() {
  const dispatch = useGameDispatch();
  const lastRealTimeRef = useRef<number>(performance.now());
  const lastTickTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick(time: number) {
      // time is performance.now() passed by RAF
      
      // Throttle the actual game logic dispatch to TARGET_FPS (60fps)
      // This prevents React from choking on 144Hz/240Hz monitors while keeping
      // the requestAnimationFrame loop running smoothly for any visual components.
      if (time - lastTickTimeRef.current >= FRAME_MS) {
        const delta = time - lastRealTimeRef.current;
        lastRealTimeRef.current = time;
        lastTickTimeRef.current = time;
        
        // We still use Date.now() for the timestamp to persist/offline progress
        // but delta is high-precision.
        dispatch({ type: "TICK", deltaTimeMs: delta, currentTimestamp: Date.now() });
      }
      
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dispatch]);
}
