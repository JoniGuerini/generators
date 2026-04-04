import type { UpgradeBuyMode } from "@/contexts/BuyModeContext";
import type { GameState } from "@/store/gameState";
import type { GameAction } from "@/store/reducer";

export const ABSOLUTE_CAP = 50_000;

export function getUpgradeBulkMaxSteps(mode: UpgradeBuyMode): number {
  switch (mode) {
    case "1x":
      return 1;
    case "10x":
      return 10;
    case "50x":
      return 50;
    case "100%":
      return ABSOLUTE_CAP;
    default:
      return 1;
  }
}

/**
 * Dispara compras consecutivas enquanto `tryGetAction` devolver uma ação válida,
 * até `maxSteps` ou troca de estado (custo/ranque atualizados a cada dispatch).
 */
export function dispatchUpgradeBulk(
  dispatch: (a: GameAction) => void,
  getState: () => GameState,
  maxSteps: number,
  tryGetAction: (s: GameState) => GameAction | null,
): void {
  const cap = Math.min(Math.max(1, maxSteps), ABSOLUTE_CAP);
  let steps = 0;
  while (steps < cap) {
    const action = tryGetAction(getState());
    if (!action) break;
    dispatch(action);
    steps++;
  }
}

/** Compra exatamente `exactCount` níveis (1x/10x/50x) — só chamar se a carteira cobrir o lote. */
export function dispatchUpgradeFixedBatch(
  dispatch: (a: GameAction) => void,
  getState: () => GameState,
  exactCount: number,
  tryGetAction: (s: GameState) => GameAction | null,
): void {
  const n = Math.min(Math.max(0, Math.floor(exactCount)), ABSOLUTE_CAP);
  for (let i = 0; i < n; i++) {
    const action = tryGetAction(getState());
    if (!action) break;
    dispatch(action);
  }
}
