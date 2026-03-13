import Decimal from "break_eternity.js";
import type { GameState } from "./gameState";
import { getInitialState } from "./gameState";
import { GENERATOR_DEFS, GENERATOR_IDS } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getCurrentMilestoneCount,
  getCoinsFromClaiming,
  advanceMilestoneTargetIndex,
} from "@/utils/milestones";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getEffectiveGeneratorCost,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getTicketsPerSecond,
  getUpgradeCostTicketRate,
  getUpgradeCostTicketMultiplier,
  getTicketTradeThreshold,
} from "@/engine/upgrades";

export type GameAction =
  | { type: "TICK"; deltaTimeMs: number; currentTimestamp: number }
  | { type: "BUY_GENERATOR"; id: GeneratorId; amount: number }
  | { type: "CLAIM_MILESTONES"; id: GeneratorId }
  | { type: "BUY_UPGRADE"; id: GeneratorId; upgradeType: "cycleSpeed" | "production" }
  | { type: "BUY_TICKET_RATE_UPGRADE" }
  | { type: "BUY_TICKET_MULTIPLIER_UPGRADE" }
  | { type: "TRADE_BASE_FOR_TICKET_RATE" }
  | { type: "BUY_GENERATOR_COST_HALF_UPGRADE" }
  | { type: "RESET_GAME" }
  | { type: "REPLACE_STATE"; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const deltaSec = action.deltaTimeMs / 1000;
      const now = action.currentTimestamp;
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
      return {
        ...state,
        baseResource,
        ticketCurrency,
        ticketAccumulator,
        generators: withTargets,
        lastUpdateTimestamp: state.lastUpdateTimestamp + action.deltaTimeMs,
      };
    }

    case "BUY_GENERATOR": {
      const def = GENERATOR_DEFS[action.id];
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0 || action.amount < 1) return state;
      const effectiveCost = getEffectiveGeneratorCost(
        def.cost,
        state.upgradeGeneratorCostHalfRank
      );
      const effectiveCostPrev = getEffectiveGeneratorCost(
        def.costPreviousGenerator,
        state.upgradeGeneratorCostHalfRank
      );
      const maxByBase = state.baseResource.div(effectiveCost).floor();
      const maxByTickets = state.ticketCurrency.floor();
      let maxByPrev = Decimal.fromNumber(Number.MAX_SAFE_INTEGER);
      if (effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base") {
        const prevGen = state.generators.find((g) => g.id === def.produces);
        if (prevGen) {
          maxByPrev = prevGen.quantity.div(effectiveCostPrev).floor();
        }
      }
      const maxByTicketsNum = Math.min(maxByTickets.toNumber(), Number.MAX_SAFE_INTEGER);
      const maxByPrevNum = Math.min(maxByPrev.toNumber(), Number.MAX_SAFE_INTEGER);
      const maxAffordable = Decimal.fromNumber(
        Math.min(
          maxByBase.toNumber(),
          maxByTicketsNum,
          maxByPrevNum,
          action.amount
        )
      );
      const amountDecimal = maxAffordable;
      if (amountDecimal.lte(Decimal.dZero)) return state;
      const totalCost = effectiveCost.mul(amountDecimal);
      const amountNum = amountDecimal.toNumber();
      const totalPrevCost =
        effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base"
          ? effectiveCostPrev.mul(amountDecimal)
          : Decimal.dZero;

      const nextGenerators = state.generators.map((g, i) => {
        if (i === genIndex) {
          const next = {
            ...g,
            quantity: g.quantity.add(Decimal.fromNumber(amountNum)),
            everOwned: true,
          };
          return {
            ...next,
            currentMilestoneTargetIndex: advanceMilestoneTargetIndex(
              next.quantity,
              next.currentMilestoneTargetIndex
            ),
          };
        }
        if (def.produces !== "base" && g.id === def.produces && totalPrevCost.gt(Decimal.dZero)) {
          return { ...g, quantity: g.quantity.sub(totalPrevCost) };
        }
        return g;
      });
      return {
        ...state,
        baseResource: state.baseResource.sub(totalCost),
        ticketCurrency: state.ticketCurrency.sub(Decimal.fromNumber(amountNum)),
        generators: nextGenerators,
      };
    }

    case "BUY_UPGRADE": {
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0) return state;
      const gen = state.generators[genIndex];
      const def = GENERATOR_DEFS[gen.id];
      const generatorNumber = parseInt(gen.id.replace("generator", ""), 10);

      if (action.upgradeType === "cycleSpeed") {
        const maxRank = getMaxCycleSpeedRank(def.cycleTimeSeconds);
        if (gen.upgradeCycleSpeedRank >= maxRank) return state;
        const cost = getUpgradeCostCycleSpeed(generatorNumber, gen.upgradeCycleSpeedRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeCycleSpeedRank: g.upgradeCycleSpeedRank + 1 } : g
          ),
        };
      }

      const cost = getUpgradeCostProduction(generatorNumber, gen.upgradeProductionRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        generators: state.generators.map((g, i) =>
          i === genIndex ? { ...g, upgradeProductionRank: g.upgradeProductionRank + 1 } : g
        ),
      };
    }

    case "BUY_TICKET_RATE_UPGRADE": {
      const cost = getUpgradeCostTicketRate(state.upgradeTicketRateRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeTicketRateRank: state.upgradeTicketRateRank + 1,
      };
    }

    case "BUY_TICKET_MULTIPLIER_UPGRADE": {
      const cost = getUpgradeCostTicketMultiplier(state.upgradeTicketMultiplierRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank + 1,
      };
    }

    case "BUY_GENERATOR_COST_HALF_UPGRADE": {
      const cost = getUpgradeCostGeneratorCostHalf(state.upgradeGeneratorCostHalfRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank + 1,
      };
    }

    case "TRADE_BASE_FOR_TICKET_RATE": {
      const cost = getTicketTradeThreshold(state.ticketTradeMilestoneCount);
      if (state.baseResource.lt(cost)) return state;
      return {
        ...state,
        baseResource: state.baseResource.sub(cost),
        ticketTradeMilestoneCount: state.ticketTradeMilestoneCount + 1,
      };
    }

    case "CLAIM_MILESTONES": {
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0) return state;
      const gen = state.generators[genIndex];
      const currentCount = getCurrentMilestoneCount(gen.quantity);
      const claimed = gen.claimedMilestoneIndex;
      if (currentCount <= claimed) return state;
      const generatorNumber = parseInt(gen.id.replace("generator", ""), 10);
      const coins = getCoinsFromClaiming(generatorNumber, claimed, currentCount);
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.add(coins),
        generators: state.generators.map((g, i) =>
          i === genIndex ? { ...g, claimedMilestoneIndex: currentCount } : g
        ),
      };
    }

    case "RESET_GAME": {
      return getInitialState();
    }

    case "REPLACE_STATE": {
      return action.state;
    }

    default:
      return state;
  }
}
