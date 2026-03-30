import Decimal from "break_eternity.js";
import type { GameState } from "./gameState";
import { getInitialState } from "./gameState";
import { GENERATOR_DEFS, parseGeneratorId } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getCurrentMilestoneCount,
  getCoinsFromClaiming,
  advanceMilestoneTargetIndex,
} from "@/utils/milestones";
import { MISSIONS, RANK_THRESHOLDS } from "@/engine/missions";
import type { MissionReward } from "@/engine/missions";
import { getCardKey, getCardsNeeded } from "@/engine/cards";
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
  getTicketTradeThreshold,
  getUpgradeCostMilestoneDoubler,
  getMilestoneRewardMultiplier,
  getCritChance,
  getCritMultiplier,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";

export type GameAction =
  | { type: "TICK"; deltaTimeMs: number; currentTimestamp: number }
  | { type: "BUY_GENERATOR"; id: GeneratorId; amount: number }
  | { type: "CLAIM_MILESTONES"; id: GeneratorId }
  | { type: "CLAIM_ALL_MILESTONES" }
  | { type: "BUY_UPGRADE"; id: GeneratorId; upgradeType: "cycleSpeed" | "production" | "critChance" | "critMultiplier" }
  | { type: "BUY_TICKET_MULTIPLIER_UPGRADE" }
  | { type: "TRADE_BASE_FOR_TICKET_RATE" }
  | { type: "BUY_GENERATOR_COST_HALF_UPGRADE" }
  | { type: "BUY_MILESTONE_DOUBLER_UPGRADE" }
  | { type: "TOGGLE_FPS" }
  | { type: "TOGGLE_SFX" }
  | { type: "SET_SFX_VOLUME"; volume: number }
  | { type: "SET_SFX_STYLE"; style: string }
  | { type: "SET_LOCALE"; locale: string }
  | { type: "CLAIM_MISSION"; missionId: string; cards: Record<string, number> }
  | { type: "RANK_UP" }
  | { type: "SET_ACTIVE_LINE"; line: number }
  | { type: "RESET_OPTIONS" }
  | { type: "RESET_GAME" }
  | { type: "REPLACE_STATE"; state: GameState };

function addCards(cards: Record<string, number>, toAdd: Record<string, number>): Record<string, number> {
  const next = { ...cards };
  for (const [key, count] of Object.entries(toAdd)) {
    next[key] = (next[key] || 0) + count;
  }
  return next;
}

function spendCards(cards: Record<string, number>, key: string, amount: number): Record<string, number> {
  const next = { ...cards };
  next[key] = (next[key] || 0) - amount;
  if (next[key] <= 0) delete next[key];
  return next;
}

function applyMissionReward(state: GameState, reward: MissionReward): GameState {
  switch (reward.type) {
    case "baseResource":
      return { ...state, baseResource: state.baseResource.add(Decimal.fromNumber(reward.amount)) };
    case "tickets":
      return { ...state, ticketCurrency: state.ticketCurrency.add(Decimal.fromNumber(reward.amount)) };
    case "milestoneCurrency":
      return { ...state, milestoneCurrency: state.milestoneCurrency.add(Decimal.fromNumber(reward.amount)) };
    case "generators": {
      const genIndex = state.generators.findIndex((g) => g.id === reward.generatorId);
      if (genIndex < 0) return state;
      return {
        ...state,
        generators: state.generators.map((g, i) =>
          i === genIndex
            ? {
                ...g,
                quantity: g.quantity.add(Decimal.fromNumber(reward.amount)),
                everOwned: true,
                currentMilestoneTargetIndex: advanceMilestoneTargetIndex(
                  g.quantity.add(Decimal.fromNumber(reward.amount)),
                  g.currentMilestoneTargetIndex
                ),
              }
            : g
        ),
      };
    }
    default:
      return state;
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      const deltaSec = action.deltaTimeMs / 1000;
      const now = action.currentTimestamp;
      let baseResource = state.baseResource;
      const lineBaseDeltas = new Map<number, Decimal>();
      const deltasMap = new Map<GeneratorId, Decimal>();

      let generatorsChanged = false;
      const updatedGenerators = state.generators.map((gen) => {
        if (Decimal.lte(gen.quantity, Decimal.dZero)) {
          return gen;
        }

        const def = GENERATOR_DEFS[gen.id];
        const cycleTimeSec = getEffectiveCycleTimeSeconds(
          def.cycleTimeSeconds,
          gen.upgradeCycleSpeedRank
        );
        const productionPerCycle = getEffectiveProductionPerCycle(
          def.productionPerCycle,
          gen.upgradeProductionRank
        );
        
        let progress = gen.cycleProgress + deltaSec / cycleTimeSec;
        const cyclesCompleted = Math.floor(progress);

        if (cyclesCompleted >= 1) {
          generatorsChanged = true;
          progress -= cyclesCompleted;

          const critChance = getCritChance(gen.upgradeCritChanceRank);
          let produced: Decimal;
          if (critChance > 0) {
            const critMult = getCritMultiplier(gen.upgradeCritMultiplierRank);
            let critCount = 0;
            for (let c = 0; c < cyclesCompleted; c++) {
              if (Math.random() < critChance) critCount++;
            }
            const normalCycles = cyclesCompleted - critCount;
            produced = productionPerCycle.mul(gen.quantity).mul(normalCycles + critCount * critMult);
          } else {
            produced = productionPerCycle.mul(gen.quantity).mul(cyclesCompleted);
          }

          if (def.produces === "base") {
            baseResource = baseResource.add(produced);
            const ln = parseGeneratorId(gen.id).line;
            lineBaseDeltas.set(ln, (lineBaseDeltas.get(ln) ?? Decimal.dZero).add(produced));
          } else {
            const currentDelta = deltasMap.get(def.produces) || Decimal.dZero;
            deltasMap.set(def.produces, currentDelta.add(produced));
          }
        } else if (progress !== gen.cycleProgress) {
          generatorsChanged = true;
        }

        const cycleTimeMs = cycleTimeSec * 1000;
        const cycleStartTime = now - progress * cycleTimeMs;
        return { ...gen, cycleProgress: progress, cycleStartTime };
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
            state.ticketTradeMilestoneCount,
            state.upgradeTicketMultiplierRank
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

      let lineStats = state.lineStats;
      if (lineBaseDeltas.size > 0) {
        lineStats = { ...lineStats };
        for (const [ln, delta] of lineBaseDeltas) {
          const prev = lineStats[ln] ?? { baseResourceProduced: Decimal.dZero, milestoneCurrencyEarned: Decimal.dZero };
          lineStats[ln] = { ...prev, baseResourceProduced: prev.baseResourceProduced.add(delta) };
        }
      }

      return {
        ...state,
        baseResource,
        ticketCurrency,
        ticketAccumulator,
        lineStats,
        generators: generatorsWithGains,
        lastUpdateTimestamp: now,
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
      const ticketCostPerUnit = parseGeneratorId(action.id).line;
      const maxByBase = state.baseResource.div(effectiveCost).floor();
      const maxByTickets = state.ticketCurrency.div(ticketCostPerUnit).floor();
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
          const isFirstPurchase = !g.everOwned;
          const wasEmpty = g.everOwned && g.quantity.lte(Decimal.dZero);
          const cycleTimeSec = getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, g.upgradeCycleSpeedRank);
          const next = {
            ...g,
            quantity: g.quantity.add(Decimal.fromNumber(amountNum)),
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
        baseResource: state.baseResource.sub(totalCost),
        ticketCurrency: state.ticketCurrency.sub(Decimal.fromNumber(amountNum * ticketCostPerUnit)),
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
        const cardKey = getCardKey("cycleSpeed", gen.id);
        const needed = getCardsNeeded(gen.upgradeCycleSpeedRank);
        if ((state.cards[cardKey] || 0) < needed) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          cards: spendCards(state.cards, cardKey, needed),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeCycleSpeedRank: g.upgradeCycleSpeedRank + 1 } : g
          ),
        };
      }

      if (action.upgradeType === "production") {
        const cost = getUpgradeCostProduction(generatorNumber, gen.upgradeProductionRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        const cardKey = getCardKey("production", gen.id);
        const needed = getCardsNeeded(gen.upgradeProductionRank);
        if ((state.cards[cardKey] || 0) < needed) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          cards: spendCards(state.cards, cardKey, needed),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeProductionRank: g.upgradeProductionRank + 1 } : g
          ),
        };
      }

      if (action.upgradeType === "critChance") {
        if (gen.upgradeCritChanceRank >= MAX_CRIT_CHANCE_RANK) return state;
        const cost = getUpgradeCostCritChance(generatorNumber, gen.upgradeCritChanceRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        const cardKey = getCardKey("critChance", gen.id);
        const needed = getCardsNeeded(gen.upgradeCritChanceRank);
        if ((state.cards[cardKey] || 0) < needed) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          cards: spendCards(state.cards, cardKey, needed),
          generators: state.generators.map((g, i) =>
            i === genIndex ? { ...g, upgradeCritChanceRank: g.upgradeCritChanceRank + 1 } : g
          ),
        };
      }

      if (action.upgradeType === "critMultiplier") {
        const cost = getUpgradeCostCritMultiplier(generatorNumber, gen.upgradeCritMultiplierRank);
        if (state.milestoneCurrency.lt(cost)) return state;
        const cardKey = getCardKey("critMultiplier", gen.id);
        const needed = getCardsNeeded(gen.upgradeCritMultiplierRank);
        if ((state.cards[cardKey] || 0) < needed) return state;
        return {
          ...state,
          milestoneCurrency: state.milestoneCurrency.sub(cost),
          cards: spendCards(state.cards, cardKey, needed),
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
      const cardKey = getCardKey("ticketMultiplier");
      const needed = getCardsNeeded(state.upgradeTicketMultiplierRank);
      if ((state.cards[cardKey] || 0) < needed) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        cards: spendCards(state.cards, cardKey, needed),
        upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank + 1,
      };
    }

    case "BUY_GENERATOR_COST_HALF_UPGRADE": {
      const cost = getUpgradeCostGeneratorCostHalf(state.upgradeGeneratorCostHalfRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      const cardKey = getCardKey("generatorCostHalf");
      const needed = getCardsNeeded(state.upgradeGeneratorCostHalfRank);
      if ((state.cards[cardKey] || 0) < needed) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        cards: spendCards(state.cards, cardKey, needed),
        upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank + 1,
      };
    }

    case "BUY_MILESTONE_DOUBLER_UPGRADE": {
      const cost = getUpgradeCostMilestoneDoubler(state.upgradeMilestoneDoublerRank);
      if (state.milestoneCurrency.lt(cost)) return state;
      const cardKey = getCardKey("milestoneDoubler");
      const needed = getCardsNeeded(state.upgradeMilestoneDoublerRank);
      if ((state.cards[cardKey] || 0) < needed) return state;
      return {
        ...state,
        milestoneCurrency: state.milestoneCurrency.sub(cost),
        cards: spendCards(state.cards, cardKey, needed),
        upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank + 1,
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

    case "SET_SFX_STYLE": {
      return {
        ...state,
        options: { ...state.options, sfxStyle: action.style },
      };
    }

    case "SET_LOCALE": {
      return {
        ...state,
        options: { ...state.options, locale: action.locale },
      };
    }

    case "CLAIM_MISSION": {
      if (state.claimedMissions.includes(action.missionId)) return state;
      const mission = MISSIONS.find((m) => m.id === action.missionId);
      if (!mission) return state;

      let s = {
        ...state,
        claimedMissions: [...state.claimedMissions, mission.id],
        cards: addCards(state.cards, action.cards),
      };
      for (const reward of mission.rewards) {
        s = applyMissionReward(s, reward);
      }
      return s;
    }

    case "RANK_UP": {
      const currentRank = state.rank;
      if (currentRank > RANK_THRESHOLDS.length) return state;
      const threshold = RANK_THRESHOLDS[currentRank - 1];
      let accumulated = 0;
      for (let i = 0; i < currentRank - 1; i++) accumulated += RANK_THRESHOLDS[i];
      const xp = state.claimedMissions.length - accumulated;
      if (xp < threshold) return state;
      return { ...state, rank: currentRank + 1 };
    }

    case "SET_ACTIVE_LINE": {
      return { ...state, activeLine: action.line };
    }

    case "RESET_OPTIONS": {
      return {
        ...state,
        options: { showFPS: false, sfxEnabled: true, sfxVolume: 50, sfxStyle: "soft", locale: "pt-BR" },
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
