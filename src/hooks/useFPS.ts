import { useState, useEffect } from "react";

/**
 * Contador de FPS clássico: conta frames por segundo via requestAnimationFrame.
 */
export function useFPS(): number {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let lastTime = performance.now();
    let rafId: number;
    function tick() {
      frames++;
      const now = performance.now();
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((frames * 1000) / elapsed));
        frames = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);
  return fps;
}
