import { useLayoutEffect, useRef } from "react";
import { registerCycleBarUpdate } from "@/hooks/cycleBarRegistry";

/**
 * Barra sincronizada com o RAF único do game loop (sem N+1 RAF — evita jank).
 */
export function useSmoothCycleProgress(
  cycleStartTime: number,
  cycleTimeSeconds: number,
  active: boolean
): React.RefObject<HTMLDivElement | null> {
  const barRef = useRef<HTMLDivElement | null>(null);
  const cycleStartRef = useRef(cycleStartTime);
  const cycleMsRef = useRef(Math.max(1, cycleTimeSeconds * 1000));
  const activeRef = useRef(active);

  useLayoutEffect(() => {
    cycleStartRef.current = cycleStartTime;
    cycleMsRef.current = Math.max(1, cycleTimeSeconds * 1000);
    activeRef.current = active;
  }, [cycleStartTime, cycleTimeSeconds, active]);

  useLayoutEffect(() => {
    if (!active) {
      const b = barRef.current;
      if (b) b.style.transform = "scaleX(0)";
      return undefined;
    }

    const update = () => {
      if (!activeRef.current) return;
      const node = barRef.current;
      if (!node?.isConnected) return;
      const cycleMs = cycleMsRef.current;
      const elapsed = Date.now() - cycleStartRef.current;
      const phase = ((elapsed % cycleMs) + cycleMs) % cycleMs;
      const p = Math.min(1, phase / cycleMs);
      node.style.transform = `scaleX(${p})`;
    };

    return registerCycleBarUpdate(update);
  }, [active, cycleStartTime, cycleTimeSeconds]);

  return barRef;
}
