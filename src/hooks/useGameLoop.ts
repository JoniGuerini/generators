import { useEffect, useRef } from "react";
import { useGameDispatch } from "@/store/useGameStore";

export function useGameLoop() {
  const dispatch = useGameDispatch();
  const lastRef = useRef<number>(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function tick() {
      const now = Date.now();
      const delta = now - lastRef.current;
      lastRef.current = now;
      dispatch({ type: "TICK", deltaTimeMs: delta, currentTimestamp: now });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dispatch]);
}
