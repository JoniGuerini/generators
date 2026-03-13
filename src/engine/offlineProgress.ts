import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { GENERATOR_DEFS, GENERATOR_IDS } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import { advanceMilestoneTargetIndex } from "@/utils/milestones";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getTicketsPerSecond,
} from "@/engine/upgrades";

/** Mínimo de tempo ausente (em ms) para mostrar o card de boas-vindas (5 segundos). */
export const MIN_OFFLINE_MS = 5 * 1000;

export interface OfflineGains {
  /** Recurso base gerado (●). */
  baseResource: Decimal;
  /** Tickets gerados (▲). */
  ticketCurrency: Decimal;
  /** Ganho por gerador (só entradas com quantidade > 0). */
  generators: { id: GeneratorId; quantity: Decimal }[];
  /** Tempo offline em ms. */
  offlineTimeMs: number;
}

/**
 * Simula a progressão do jogo por um período offline e retorna o novo estado
 * e os ganhos para exibição no card de boas-vindas.
 */
export function simulateOfflineProgress(
  state: GameState,
  offlineMs: number,
  now: number
): { newState: GameState; gains: OfflineGains } {
  const deltaMs = Math.max(0, offlineMs);
  const deltaSec = deltaMs / 1000;

  let baseResource = Decimal.fromDecimal(state.baseResource);
  const deltas = Object.fromEntries(
    GENERATOR_IDS.map((id) => [id, Decimal.dZero])
  ) as Record<GeneratorId, Decimal>;

  const updatedGenerators = state.generators.map((gen) => {
    const def = GENERATOR_DEFS[gen.id];
    if (Decimal.lte(gen.quantity, Decimal.dZero))
      return { ...gen, cycleProgress: 0, cycleStartTime: now };

    const cycleTimeSec = getEffectiveCycleTimeSeconds(
      def.cycleTimeSeconds,
      gen.upgradeCycleSpeedRank
    );
    const productionPerCycle = getEffectiveProductionPerCycle(
      def.productionPerCycle,
      gen.upgradeProductionRank
    );
    const cycleTimeMs = cycleTimeSec * 1000;
    let progress = gen.cycleProgress + deltaSec / cycleTimeSec;
    const cyclesCompleted = Math.floor(progress);
    const progressRemainder = progress - cyclesCompleted;

    if (cyclesCompleted >= 1) {
      const produced = productionPerCycle.mul(gen.quantity).mul(cyclesCompleted);
      if (def.produces === "base") {
        baseResource = baseResource.add(produced);
      } else {
        deltas[def.produces] = deltas[def.produces].add(produced);
      }
      const cycleStartTime = now - progressRemainder * cycleTimeMs;
      return { ...gen, cycleProgress: progressRemainder, cycleStartTime };
    }
    return { ...gen, cycleProgress: progress };
  });

  const hasAnyGenerator = state.generators.some((g) =>
    Decimal.gte(g.quantity, Decimal.dOne)
  );
  let ticketCurrency = state.ticketCurrency;
  let ticketAccumulator = state.ticketAccumulator;
  if (hasAnyGenerator) {
    const ticketsPerSec = getTicketsPerSecond(
      state.upgradeTicketRateRank,
      state.ticketTradeMilestoneCount,
      state.upgradeTicketMultiplierRank
    );
    const acc = ticketAccumulator + deltaSec;
    const wholeSeconds = Math.floor(acc);
    if (wholeSeconds >= 1) {
      ticketCurrency = ticketCurrency.add(Decimal.fromNumber(wholeSeconds * ticketsPerSec));
      ticketAccumulator = acc - wholeSeconds;
    } else {
      ticketAccumulator = acc;
    }
  }

  const withQuantities = updatedGenerators.map((g) =>
    deltas[g.id].gt(Decimal.dZero)
      ? { ...g, quantity: g.quantity.add(deltas[g.id]) }
      : g
  );
  const withTargets = withQuantities.map((g) => ({
    ...g,
    currentMilestoneTargetIndex: advanceMilestoneTargetIndex(
      g.quantity,
      g.currentMilestoneTargetIndex
    ),
  }));

  const newState: GameState = {
    ...state,
    baseResource,
    ticketCurrency,
    ticketAccumulator,
    generators: withTargets,
    lastUpdateTimestamp: now,
  };

  const baseResourceGain = baseResource.sub(state.baseResource);
  const ticketGain = ticketCurrency.sub(state.ticketCurrency);
  const generatorsGain = state.generators
    .map((g, i) => ({
      id: g.id,
      quantity: withTargets[i].quantity.sub(g.quantity),
    }))
    .filter((x) => x.quantity.gt(Decimal.dZero));

  const gains: OfflineGains = {
    baseResource: baseResourceGain,
    ticketCurrency: ticketGain,
    generators: generatorsGain,
    offlineTimeMs: deltaMs,
  };

  return { newState, gains };
}
