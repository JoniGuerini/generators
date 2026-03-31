import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { getTotalTicketTrades } from "@/store/gameState";
import { GENERATOR_DEFS, parseGeneratorId } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import { advanceMilestoneTargetIndex } from "@/utils/milestones";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getTicketsPerSecond,
  getCritChance,
  getCritMultiplier,
} from "@/engine/upgrades";

export const MIN_OFFLINE_MS = 5 * 1000;

export interface OfflineGains {
  lineResources: Record<number, Decimal>;
  ticketCurrency: Decimal;
  generators: { id: GeneratorId; quantity: Decimal }[];
  offlineTimeMs: number;
}

export function simulateOfflineProgress(
  state: GameState,
  offlineMs: number,
  now: number
): { newState: GameState; gains: OfflineGains } {
  const deltaMs = Math.max(0, offlineMs);
  const deltaSec = deltaMs / 1000;

  const lineResourceDeltas = new Map<number, Decimal>();
  const deltas = new Map<GeneratorId, Decimal>();

  const updatedGenerators = state.generators.map((gen) => {
    const def = GENERATOR_DEFS[gen.id];
    if (Decimal.lte(gen.quantity, Decimal.dZero))
      return gen;

    const cycleTimeSec = getEffectiveCycleTimeSeconds(
      def.cycleTimeSeconds,
      gen.upgradeCycleSpeedRank
    );
    const productionPerCycle = getEffectiveProductionPerCycle(
      def.productionPerCycle,
      gen.upgradeProductionRank,
      state.upgradeGlobalProductionDoublerRank
    );
    const cycleTimeMs = cycleTimeSec * 1000;
    let progress = gen.cycleProgress + deltaSec / cycleTimeSec;
    const cyclesCompleted = Math.floor(progress);
    const progressRemainder = progress - cyclesCompleted;

    if (cyclesCompleted >= 1) {
      const critChance = getCritChance(gen.upgradeCritChanceRank);
      const critMult = getCritMultiplier(gen.upgradeCritMultiplierRank);
      const avgMultiplier = 1 + critChance * (critMult - 1);
      const produced = productionPerCycle.mul(gen.quantity).mul(cyclesCompleted).mul(avgMultiplier);
      if (def.produces === "base") {
        const ln = parseGeneratorId(gen.id).line;
        lineResourceDeltas.set(ln, (lineResourceDeltas.get(ln) ?? Decimal.dZero).add(produced));
      } else {
        const prev = deltas.get(def.produces) ?? Decimal.dZero;
        deltas.set(def.produces, prev.add(produced));
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
      getTotalTicketTrades(state),
      state.upgradeTicketMultiplierRank,
      state.upgradeTicketTradeDoublerRank
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

  const withQuantities = updatedGenerators.map((g) => {
    const delta = deltas.get(g.id);
    return delta && delta.gt(Decimal.dZero)
      ? { ...g, quantity: g.quantity.add(delta) }
      : g;
  });
  const withTargets = withQuantities.map((g) => ({
    ...g,
    currentMilestoneTargetIndex: advanceMilestoneTargetIndex(
      g.quantity,
      g.currentMilestoneTargetIndex
    ),
  }));

  const lineResources = { ...state.lineResources };
  for (const [ln, delta] of lineResourceDeltas) {
    lineResources[ln] = (lineResources[ln] ?? Decimal.dZero).add(delta);
  }

  const newState: GameState = {
    ...state,
    lineResources,
    ticketCurrency,
    ticketAccumulator,
    generators: withTargets,
    lastUpdateTimestamp: now,
  };

  const lineResourceGains: Record<number, Decimal> = {};
  for (const [ln, delta] of lineResourceDeltas) {
    lineResourceGains[ln] = delta;
  }

  const ticketGain = ticketCurrency.sub(state.ticketCurrency);
  const generatorsGain = state.generators
    .map((g, i) => ({
      id: g.id,
      quantity: withTargets[i].quantity.sub(g.quantity),
    }))
    .filter((x) => x.quantity.gt(Decimal.dZero));

  const gains: OfflineGains = {
    lineResources: lineResourceGains,
    ticketCurrency: ticketGain,
    generators: generatorsGain,
    offlineTimeMs: deltaMs,
  };

  return { newState, gains };
}
