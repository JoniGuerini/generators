import { useState, useEffect } from "react";

/**
 * Retorna o progresso do ciclo (0..1) calculado em tempo real para animação fluida da barra.
 * Atualiza a cada frame via requestAnimationFrame.
 */
export function useSmoothCycleProgress(
  cycleStartTime: number,
  cycleTimeSeconds: number,
  active: boolean
): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active || cycleTimeSeconds <= 0) {
      setProgress(0);
      return undefined;
    }
    const cycleTimeMs = cycleTimeSeconds * 1000;
    let rafId: number;
    function tick() {
      const elapsed = Date.now() - cycleStartTime;
      const p = (elapsed / cycleTimeMs) % 1;
      setProgress(p);
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [cycleStartTime, cycleTimeSeconds, active]);

  return active ? progress : 0;
}
