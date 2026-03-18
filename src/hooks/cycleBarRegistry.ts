/**
 * Todas as barras de ciclo são atualizadas num único passo no RAF do game loop,
 * evitando dezenas de requestAnimationFrame competindo com o TICK (causa jank).
 */
type BarUpdate = () => void;

const updates = new Set<BarUpdate>();

export function registerCycleBarUpdate(fn: BarUpdate): () => void {
  updates.add(fn);
  return () => {
    updates.delete(fn);
  };
}

export function flushCycleBars(): void {
  if (typeof document !== "undefined" && document.hidden) return;
  for (const fn of updates) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}
