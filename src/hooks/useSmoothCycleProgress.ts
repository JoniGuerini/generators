import { useEffect, useRef } from "react";

/**
 * Conecta uma ref diretamente ao loop RAF para animar a largura da barra de progresso.
 * Ao invés de usar useState (que causa re-render do React a cada frame),
 * manipulamos o DOM diretamente via ref — zero impacto no React.
 */
export function useSmoothCycleProgress(
  cycleStartTime: number,
  cycleTimeSeconds: number,
  active: boolean
): React.RefObject<HTMLDivElement | null> {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;

    if (!active || cycleTimeSeconds <= 0) {
      bar.style.width = "0%";
      return undefined;
    }

    const cycleTimeMs = cycleTimeSeconds * 1000;
    let rafId: number;

    function tick() {
      const elapsed = Date.now() - cycleStartTime;
      const p = (elapsed / cycleTimeMs) % 1;
      // Manipula o DOM diretamente — sem setState, sem re-render do React
      if (bar) {
        bar.style.width = `${Math.min(100, p * 100)}%`;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cycleStartTime, cycleTimeSeconds, active]);

  return barRef;
}
