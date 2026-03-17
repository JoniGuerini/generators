import { useState, useEffect } from "react";

/**
 * Contador de FPS suavizado
 * Para evitar oscilações visuais violentas, usa-se a média das medições
 */
export function useFPS(): number {
  const [fps, setFps] = useState(0);
  
  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;
    let rafId: number;
    
    // Suavização do FPS para não ficar oscilando todo milisegundo
    function tick() {
      frames++;
      const now = performance.now();
      const elapsed = now - lastTime;
      
      // Atualiza a tela a cada 250ms em vez de 1000ms para parecer mais "real time",
      // mas mantendo a matemática do FPS (multiplica os frames pra bater em 1 segundo)
      if (elapsed >= 250) {
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
