import Decimal from "break_eternity.js";
import { GENERATOR_IDS, type GeneratorId } from "@/engine/constants";

export interface GeneratorState {
  id: GeneratorId;
  quantity: Decimal;
  /** true assim que o jogador compra pelo menos 1 unidade; não volta a false (gerador fica visível mesmo com 0). */
  everOwned: boolean;
  /** Progresso do ciclo 0..1 (lógica do jogo) */
  cycleProgress: number;
  /** Timestamp do início do ciclo atual (para animação fluida da barra) */
  cycleStartTime: number;
  /** Quantos marcos já foram resgatados (1 = resgatou até 10, 2 = até 100, etc.) */
  claimedMilestoneIndex: number;
  /** Índice (1-based) do marco para o qual estamos progredindo; nunca recua quando a quantidade diminui */
  currentMilestoneTargetIndex: number;
  /** Ranque da melhoria "reduzir tempo de ciclo pela metade" (0 = sem melhoria; máx por gerador). */
  upgradeCycleSpeedRank: number;
  /** Ranque da melhoria "dobrar produção por ciclo" (0 = sem melhoria; infinitos ranques). */
  upgradeProductionRank: number;
}

export interface GameState {
  baseResource: Decimal;
  /** Moeda gerada por segundo (base 1/s + melhoria); usada para comprar geradores */
  ticketCurrency: Decimal;
  /** Acumulador em segundos para geração discreta */
  ticketAccumulator: number;
  /** Moeda de marcos (melhorias) */
  milestoneCurrency: Decimal;
  /** Ranque da melhoria "tickets por segundo": base 1/s, cada ranque +1/s (infinitos). */
  upgradeTicketRateRank: number;
  /** Quantas vezes trocou recurso base por +1 ▲/s (marcos 500, 5k, 5M, 5B, …). */
  ticketTradeMilestoneCount: number;
  /** Ranque da melhoria global "reduzir custo de compra pela metade" (0 = sem; cada ranque ÷2 no custo). */
  upgradeGeneratorCostHalfRank: number;
  generators: GeneratorState[];
  lastUpdateTimestamp: number;
}

const ZERO = Decimal.dZero;

function initialGeneratorState(id: GeneratorId): GeneratorState {
  const now = Date.now();
  return {
    id,
    quantity: ZERO,
    everOwned: false,
    cycleProgress: 0,
    cycleStartTime: now,
    claimedMilestoneIndex: 0,
    currentMilestoneTargetIndex: 1,
    upgradeCycleSpeedRank: 0,
    upgradeProductionRank: 0,
  };
}

/** IDs dos geradores a exibir na lista: todos que já foram desbloqueados (everOwned) + o próximo a comprar. */
export function getVisibleGeneratorIds(state: GameState): GeneratorId[] {
  const ids: GeneratorId[] = [];
  let nextAdded = false;
  for (const id of GENERATOR_IDS) {
    const gen = state.generators.find((g) => g.id === id);
    if (gen?.everOwned) ids.push(id);
    else if (!nextAdded) {
      ids.push(id);
      nextAdded = true;
    }
  }
  return ids;
}

export function getInitialState(): GameState {
  return {
    baseResource: Decimal.fromNumber(10),
    ticketCurrency: Decimal.dOne,
    ticketAccumulator: 0,
    milestoneCurrency: ZERO,
    upgradeTicketRateRank: 0,
    ticketTradeMilestoneCount: 0,
    upgradeGeneratorCostHalfRank: 0,
    generators: GENERATOR_IDS.map((id) => initialGeneratorState(id)),
    lastUpdateTimestamp: Date.now(),
  };
}
