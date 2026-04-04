import Decimal from "break_eternity.js";
import type { GameState } from "./gameState";
import { getInitialState, getTotalTicketTrades, isLineUnlocked } from "./gameState";
import { GENERATOR_DEFS, parseGeneratorId, getUnlockRequirement } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getCurrentMilestoneCount,
  getCoinsFromClaiming,
  advanceMilestoneTargetIndex,
} from "@/utils/milestones";
import { getMaxAffordableForGenerator } from "@/utils/computeGeneratorPurchase";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getEffectiveGeneratorCost,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getTicketsPerSecond,
  getUpgradeCostTicketMultiplier,
  getUpgradeCostTicketTradeDoubler,
  getMaxAffordableTrades,
  getUpgradeCostMilestoneDoubler,
  getUpgradeCostGlobalProductionDoubler,
  getUpgradeCostLineProductionDoubler,
  getUpgradeCostLineCostHalf,
  getMilestoneRewardMultiplier,
  getCritChance,
  getCritMultiplier,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";

export type GameAction =
  | { type: "TICK"; deltaTimeMs: number; currentTimestamp: number }
  | { type: "MANUAL_CYCLE"; id: GeneratorId }
  | { type: "BUY_GENERATOR"; id: GeneratorId; amount: Decimal }
  | { type: "CLAIM_MILESTONES"; id: GeneratorId }
  | { type: "CLAIM_ALL_MILESTONES" }
  | { type: "BUY_UPGRADE"; id: GeneratorId; upgradeType: "cycleSpeed" | "production" | "critChance" | "critMultiplier" }
  | { type: "BUY_TICKET_MULTIPLIER_UPGRADE" }
  | { type: "BUY_TICKET_TRADE_DOUBLER_UPGRADE" }
  | { type: "TRADE_BASE_FOR_TICKET_RATE"; line: number }
  | { type: "TRADE_ALL_LINES" }
  | { type: "BUY_GENERATOR_COST_HALF_UPGRADE" }
  | { type: "BUY_MILESTONE_DOUBLER_UPGRADE" }
  | { type: "BUY_GLOBAL_PRODUCTION_DOUBLER_UPGRADE" }
  | { type: "BUY_LINE_PRODUCTION_DOUBLER_UPGRADE"; line: number }
  | { type: "BUY_LINE_COST_HALF_UPGRADE"; line: number }
  | { type: "TOGGLE_FPS" }
  | { type: "TOGGLE_SFX" }
  | { type: "SET_SFX_VOLUME"; volume: number }
  | { type: "SET_LOCALE"; locale: string }
  | { type: "SET_ACTIVE_LINE"; line: number }
  | { type: "RESET_OPTIONS" }
  | { type: "RESET_GAME" }
  | { type: "REPLACE_STATE"; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const deltaSec = action.deltaTimeMs / 1000;
      const now = action.currentTimestamp;
      const lineResourceDeltas = new Map<number, Decimal>();
      const deltasMap = new Map<GeneratorId, Decimal>();

      let generatorsChanged = false;
      const updatedGenerators = state.generators.map((gen) => {
        const isManual = gen.manualCycleActive && Decimal.lte(gen.quantity, Decimal.dZero);
        if (Decimal.lte(gen.quantity, Decimal.dZero) && !isManual) {
          return gen;
        }

        const def = GENERATOR_DEFS[gen.id];
        const cycleTimeSec = getEffectiveCycleTimeSeconds(
          def.cycleTimeSeconds,
          gen.upgradeCycleSpeedRank
        );
        const { line: genLine } = parseGeneratorId(gen.id);
        const lineDoublerRank = state.upgradeLineProductionDoublerRanks[genLine] ?? 0;
        const productionPerCycle = getEffectiveProductionPerCycle(
          def.productionPerCycle,
          gen.upgradeProductionRank,
          state.upgradeGlobalProductionDoublerRank,
          lineDoublerRank
        );
        
        let progress = gen.cycleProgress + deltaSec / cycleTimeSec;
        const cyclesCompleted = Math.floor(progress);

        if (cyclesCompleted >= 1) {
          generatorsChanged = true;

          if (isManual) {
            progress = 0;
          } else {
            progress -= cyclesCompleted;
          }

          const effectiveQuantity = isManual ? Decimal.dOne : gen.quantity;
          const effectiveCycles = isManual ? 1 : cyclesCompleted;

          const critChance = getCritChance(gen.upgradeCritChanceRank);
          let produced: Decimal;
          if (critChance > 0) {
            const critMult = getCritMultiplier(gen.upgradeCritMultiplierRank);
            let critCount = 0;
            for (let c = 0; c < effectiveCycles; c++) {
              if (Math.random() < critChance) critCount++;
            }
            const normalCycles = effectiveCycles - critCount;
            produced = productionPerCycle.mul(effectiveQuantity).mul(normalCycles + critCount * critMult);
          } else {
            produced = productionPerCycle.mul(effectiveQuantity).mul(effectiveCycles);
          }

          if (def.produces === "base") {
            const ln = parseGeneratorId(gen.id).line;
            lineResourceDeltas.set(ln, (lineResourceDeltas.get(ln) ?? Decimal.dZero).add(produced));
          } else {
            const currentDelta = deltasMap.get(def.produces) || Decimal.dZero;
            deltasMap.set(def.produces, currentDelta.add(produced));
          }
        } else if (progress !== gen.cycleProgress) {
          generatorsChanged = true;
        }

        const manualCycleActive = isManual && cyclesCompleted < 1 ? true : isManual ? false : gen.manualCycleActive;
        const cycleTimeMs = cycleTimeSec * 1000;
        const cycleStartTime = now - progress * cycleTimeMs;
        return { ...gen, cycleProgress: progress, cycleStartTime, manualCycleActive };
      });

      const hasAnyGenerator = state.generators.some((g) =>
        Decimal.gte(g.quantity, Decimal.dOne)
      );
      let ticketCurrency = state.ticketCurrency;
      let ticketAccumulator = state.ticketAccumulator;
      if (hasAnyGenerator) {
        const acc = ticketAccumulator + deltaSec;
        if (acc >= 1) {
          const wholeSeconds = Math.floor(acc);
          const ticketsPerSec = getTicketsPerSecond(
            getTotalTicketTrades(state),
            state.upgradeTicketMultiplierRank,
            state.upgradeTicketTradeDoublerRank
          );
          ticketCurrency = ticketCurrency.add(Decimal.fromNumber(wholeSeconds * ticketsPerSec));
          ticketAccumulator = acc - wholeSeconds;
        } else {
          ticketAccumulator = acc;
        }
      }

      // If no generators were bought/produced, we can skip some mapping
      let generatorsWithGains = updatedGenerators;
      if (deltasMap.size > 0) {
        generatorsWithGains = updatedGenerators.map((g) => {
          const delta = deltasMap.get(g.id);
          if (delta && delta.gt(Decimal.dZero)) {
            const nextQuantity = g.quantity.add(delta);
            return {
              ...g,
              quantity: nextQuantity,
              currentMilestoneTargetIndex: advanceMilestoneTargetIndex(
                nextQuantity,
                g.currentMilestoneTargetIndex
              ),
            };
          }
          return g;
        });
      } else if (generatorsChanged) {
        // Just milestone targets if needed (though usually only quantity changes targets)
        // But we return updatedGenerators which has new cycleStartTimes
      }

      let lineResources = state.lineResources;
      let lineStats = state.lineStats;
      if (lineResourceDeltas.size > 0) {
        lineResources = { ...lineResources };
        lineStats = { ...lineStats };
        for (const [ln, delta] of lineResourceDeltas) {
          lineResources[ln] = (lineResources[ln] ?? Decimal.dZero).add(delta);
          const prev = lineStats[ln] ?? { baseResourceProduced: Decimal.dZero, milestoneCurrencyEarned: Decimal.dZero };
          lineStats[ln] = { ...prev, baseResourceProduced: prev.baseResourceProduced.add(delta) };
        }
      }

      return {
        ...state,
        lineResources,
        ticketCurrency,
        ticketAccumulator,
        lineStats,
        generators: generatorsWithGains,
        lastUpdateTimestamp: now,
      };
    }

    case "MANUAL_CYCLE": {
      const gen = state.generators.find((g) => g.id === action.id);
      if (!gen || gen.quantity.gt(Decimal.dZero) || gen.manualCycleActive) return state;
      return {
        ...state,
        generators: state.generators.map((g) =>
          g.id === action.id
            ? { ...g, manualCycleActive: true, cycleProgress: 0, cycleStartTime: Date.now() }
            : g
        ),
      };
    }

    case "BUY_GENERATOR": {
      const def = GENERATOR_DEFS[action.id];
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0 || action.amount.lt(Decimal.dOne)) return state;
      const gen = state.generators[genIndex];
      if (!gen.everOwned) {
        const unlockReq = getUnlockRequirement(action.id);
        if (unlockReq.required.gt(Decimal.dZero) && unlockReq.previousGenId) {
          const prevQty = state.generators.find((g) => g.id === unlockReq.previousGenId)?.quantity ?? Decimal.dZero;
          if (prevQty.lt(unlockReq.required)) return state;
        }
      }
      const { line: buyLine } = parseGeneratorId(action.id);
      const lineCostHalfRank = state.upgradeLineCostHalfRanks[buyLine] ?? 0;
      const effectiveCost = getEffectiveGeneratorCost(
        def.cost,
        state.upgradeGeneratorCostHalfRank,
        lineCostHalfRank
      );
      const effectiveCostPrev = getEffectiveGeneratorCost(
        def.costPreviousGenerator,
        state.upgradeGeneratorCostHalfRank,
        lineCostHalfRank
      );
      const ticketCostPerUnit = buyLine;
      const lineRes = state.lineResources[buyLine] ?? Decimal.dZero;
      const maxAffordableCap = getMaxAffordableForGenerator(state, action.id);
      const amountDecimal = Decimal.min(maxAffordableCap, action.amount);
      if (amountDecimal.lte(Decimal.dZero)) return state;
      const totalCost = effectiveCost.mul(amountDecimal);
      const totalPrevCost =
        effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base"
          ? effectiveCostPrev.mul(amountDecimal)
          : Decimal.dZero;

      const nextGenerators = state.generators.map((g, i) => {
        if (i === genIndex) {
          const isFirstPurchase = !g.everOwned;
          const wasEmpty = g.everOwned && g.quantity.lte(Decimal.dZero);
          const cycleTimeSec = getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, g.upgradeCycleSpeedRank);
          const next = {
            ...g,
            quantity: g.quantity.add(amountDecimal),
            everOwned: true,
            cycleProgress: isFirstPurchase ? 0 : g.cycleProgress,
            cycleStartTime: isFirstPurchase
              ? Date.now()
              : wasEmpty
                ? Date.now() - g.cycleProgress * cycleTimeSec * 1000
                : g.cycleStartTime,
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
        lineResources: { ...state.lineResources, [buyLine]: lineRes.sub(totalCost) },
        ticketCurrency: state.ticketCurrency.sub(amountDecimal.mul(ticketCostPerUnit)),
        generators: nextGenerators,
      };
    }

    case "BUY_UPGRADE": {
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0) return state;
      const gen = state.generators[genIndex];
      const def = GENERATOR_DEFS[gen.id];
      const generatorNumber = parseGeneratorId(gen.id).gen;

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

      if (action.upgradeType === "production") {
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

      if (action.upgradeType === "critChance") {
        if (gen.upgradeCritChanceRank >= MAX_CRIT_CHANCE_RANK) return state;
        const cost = getUpgradeCostCritChance(generatorNumber, gen.upgradeCritChanceRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeCritChanceRank: g.upgradeCritChanceRank + 1 } : g
          ),
        };
      }

      if (action.upgradeType === "critMultiplier") {
        const cost = getUpgradeCostCritMultiplier(generatorNumber, gen.upgradeCritMultiplierRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeCritMultiplierRank: g.upgradeCritMultiplierRank + 1 } : g
          ),
        };
      }

      return state;
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

    case "BUY_TICKET_TRADE_DOUBLER_UPGRADE": {
      const cost = getUpgradeCostTicketTradeDoubler(state.upgradeTicketTradeDoublerRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeTicketTradeDoublerRank: state.upgradeTicketTradeDoublerRank + 1,
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

    case "BUY_MILESTONE_DOUBLER_UPGRADE": {
      const cost = getUpgradeCostMilestoneDoubler(state.upgradeMilestoneDoublerRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank + 1,
      };
    }

    case "BUY_GLOBAL_PRODUCTION_DOUBLER_UPGRADE": {
      const cost = getUpgradeCostGlobalProductionDoubler(state.upgradeGlobalProductionDoublerRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeGlobalProductionDoublerRank: state.upgradeGlobalProductionDoublerRank + 1,
      };
    }

    case "BUY_LINE_PRODUCTION_DOUBLER_UPGRADE": {
      const currentRank = state.upgradeLineProductionDoublerRanks[action.line] ?? 0;
      const cost = getUpgradeCostLineProductionDoubler(currentRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeLineProductionDoublerRanks: {
          ...state.upgradeLineProductionDoublerRanks,
          [action.line]: currentRank + 1,
        },
      };
    }

    case "BUY_LINE_COST_HALF_UPGRADE": {
      const currentRank = state.upgradeLineCostHalfRanks[action.line] ?? 0;
      const cost = getUpgradeCostLineCostHalf(currentRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        upgradeLineCostHalfRanks: {
          ...state.upgradeLineCostHalfRanks,
          [action.line]: currentRank + 1,
        },
      };
    }

    case "TRADE_BASE_FOR_TICKET_RATE": {
      const tradeLineRes = state.lineResources[action.line] ?? Decimal.dZero;
      const lineTradeCount = state.lineTicketTradeCounts[action.line] ?? 0;
      const { trades, totalCost } = getMaxAffordableTrades(lineTradeCount, tradeLineRes);
      if (trades <= 0) return state;
      return {
        ...state,
        lineResources: { ...state.lineResources, [action.line]: tradeLineRes.sub(totalCost) },
        lineTicketTradeCounts: { ...state.lineTicketTradeCounts, [action.line]: lineTradeCount + trades },
      };
    }

    case "TRADE_ALL_LINES": {
      const newResources = { ...state.lineResources };
      const newCounts = { ...state.lineTicketTradeCounts };
      let anyTrade = false;
      for (let ln = 1; ln <= 10; ln++) {
        if (!isLineUnlocked(state, ln)) continue;
        const res = newResources[ln] ?? Decimal.dZero;
        const count = newCounts[ln] ?? 0;
        const { trades, totalCost } = getMaxAffordableTrades(count, res);
        if (trades > 0) {
          newResources[ln] = res.sub(totalCost);
          newCounts[ln] = count + trades;
          anyTrade = true;
        }
      }
      if (!anyTrade) return state;
      return { ...state, lineResources: newResources, lineTicketTradeCounts: newCounts };
    }

    case "CLAIM_MILESTONES": {
      const genIndex = state.generators.findIndex((g) => g.id === action.id);
      if (genIndex < 0) return state;
      const gen = state.generators[genIndex];
      const currentCount = getCurrentMilestoneCount(gen.quantity);
      const claimed = gen.claimedMilestoneIndex;
      if (currentCount <= claimed) return state;
      const { gen: generatorNumber, line: claimLine } = parseGeneratorId(gen.id);
      const baseCoins = getCoinsFromClaiming(generatorNumber, claimed, currentCount);
      const mult = getMilestoneRewardMultiplier(state.upgradeMilestoneDoublerRank);
      const coins = mult > 1 ? baseCoins.mul(mult) : baseCoins;
      const prevLS = state.lineStats[claimLine] ?? { baseResourceProduced: Decimal.dZero, milestoneCurrencyEarned: Decimal.dZero };
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.add(coins),
        lineStats: { ...state.lineStats, [claimLine]: { ...prevLS, milestoneCurrencyEarned: prevLS.milestoneCurrencyEarned.add(coins) } },
        generators: state.generators.map((g, i) =>
          i === genIndex ? { ...g, claimedMilestoneIndex: currentCount } : g
        ),
      };
    }

    case "CLAIM_ALL_MILESTONES": {
      const milestoneMultiplier = getMilestoneRewardMultiplier(state.upgradeMilestoneDoublerRank);
      let totalCoins = Decimal.dZero;
      const lineCoins = new Map<number, Decimal>();
      const updatedGens = state.generators.map((gen) => {
        const currentCount = getCurrentMilestoneCount(gen.quantity);
        if (currentCount <= gen.claimedMilestoneIndex) return gen;
        const { gen: generatorNumber, line: ln } = parseGeneratorId(gen.id);
        const coins = getCoinsFromClaiming(generatorNumber, gen.claimedMilestoneIndex, currentCount);
        totalCoins = totalCoins.add(coins);
        lineCoins.set(ln, (lineCoins.get(ln) ?? Decimal.dZero).add(coins));
        return { ...gen, claimedMilestoneIndex: currentCount };
      });
      if (totalCoins.lte(Decimal.dZero)) return state;
      const finalCoins = milestoneMultiplier > 1 ? totalCoins.mul(milestoneMultiplier) : totalCoins;
      const updatedLineStats = { ...state.lineStats };
      for (const [ln, raw] of lineCoins) {
        const earned = milestoneMultiplier > 1 ? raw.mul(milestoneMultiplier) : raw;
        const prev = updatedLineStats[ln] ?? { baseResourceProduced: Decimal.dZero, milestoneCurrencyEarned: Decimal.dZero };
        updatedLineStats[ln] = { ...prev, milestoneCurrencyEarned: prev.milestoneCurrencyEarned.add(earned) };
      }
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.add(finalCoins),
        lineStats: updatedLineStats,
        generators: updatedGens,
      };
    }

    case "TOGGLE_FPS": {
      return {
        ...state,
        options: { ...state.options, showFPS: !state.options.showFPS },
      };
    }

    case "TOGGLE_SFX": {
      return {
        ...state,
        options: { ...state.options, sfxEnabled: !state.options.sfxEnabled },
      };
    }

    case "SET_SFX_VOLUME": {
      return {
        ...state,
        options: { ...state.options, sfxVolume: action.volume },
      };
    }


    case "SET_LOCALE": {
      return {
        ...state,
        options: { ...state.options, locale: action.locale },
      };
    }

    case "SET_ACTIVE_LINE": {
      return { ...state, activeLine: action.line };
    }

    case "RESET_OPTIONS": {
      return {
        ...state,
        options: { showFPS: false, sfxEnabled: true, sfxVolume: 50, locale: "pt-BR" },
      };
    }

    case "RESET_GAME": {
      return { ...getInitialState(), options: state.options };
    }

    case "REPLACE_STATE": {
      return action.state;
    }

    default:
      return state;
  }
}
