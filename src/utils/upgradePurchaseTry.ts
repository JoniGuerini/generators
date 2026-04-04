import type { GameState } from "@/store/gameState";
import type { GameAction } from "@/store/reducer";
import { GENERATOR_DEFS, parseGeneratorId, type GeneratorId } from "@/engine/constants";
import {
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getUpgradeCostTicketMultiplier,
  getUpgradeCostTicketTradeDoubler,
  getUpgradeCostMilestoneDoubler,
  getUpgradeCostGlobalProductionDoubler,
  getUpgradeCostLineProductionDoubler,
  getUpgradeCostLineCostHalf,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";

/** Próxima compra possível ou null (espelha as guardas do reducer). */

export function tryBuyTicketMultiplier(s: GameState): GameAction | null {
  const cost = getUpgradeCostTicketMultiplier(s.upgradeTicketMultiplierRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_TICKET_MULTIPLIER_UPGRADE" };
}

export function tryBuyTicketTradeDoubler(s: GameState): GameAction | null {
  const cost = getUpgradeCostTicketTradeDoubler(s.upgradeTicketTradeDoublerRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_TICKET_TRADE_DOUBLER_UPGRADE" };
}

export function tryBuyGeneratorCostHalf(s: GameState): GameAction | null {
  const cost = getUpgradeCostGeneratorCostHalf(s.upgradeGeneratorCostHalfRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_GENERATOR_COST_HALF_UPGRADE" };
}

export function tryBuyMilestoneDoubler(s: GameState): GameAction | null {
  const cost = getUpgradeCostMilestoneDoubler(s.upgradeMilestoneDoublerRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_MILESTONE_DOUBLER_UPGRADE" };
}

export function tryBuyGlobalProductionDoubler(s: GameState): GameAction | null {
  const cost = getUpgradeCostGlobalProductionDoubler(s.upgradeGlobalProductionDoublerRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_GLOBAL_PRODUCTION_DOUBLER_UPGRADE" };
}

export function tryBuyLineProductionDoubler(s: GameState, line: number): GameAction | null {
  const currentRank = s.upgradeLineProductionDoublerRanks[line] ?? 0;
  const cost = getUpgradeCostLineProductionDoubler(currentRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_LINE_PRODUCTION_DOUBLER_UPGRADE", line };
}

export function tryBuyLineCostHalf(s: GameState, line: number): GameAction | null {
  const currentRank = s.upgradeLineCostHalfRanks[line] ?? 0;
  const cost = getUpgradeCostLineCostHalf(currentRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_LINE_COST_HALF_UPGRADE", line };
}

export function tryBuyCycleSpeed(s: GameState, id: GeneratorId): GameAction | null {
  const genIndex = s.generators.findIndex((g) => g.id === id);
  if (genIndex < 0) return null;
  const gen = s.generators[genIndex];
  const def = GENERATOR_DEFS[gen.id];
  const maxRank = getMaxCycleSpeedRank(def.cycleTimeSeconds);
  if (gen.upgradeCycleSpeedRank >= maxRank) return null;
  const generatorNumber = parseGeneratorId(gen.id).gen;
  const cost = getUpgradeCostCycleSpeed(generatorNumber, gen.upgradeCycleSpeedRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_UPGRADE", id, upgradeType: "cycleSpeed" };
}

export function tryBuyProduction(s: GameState, id: GeneratorId): GameAction | null {
  const genIndex = s.generators.findIndex((g) => g.id === id);
  if (genIndex < 0) return null;
  const gen = s.generators[genIndex];
  const generatorNumber = parseGeneratorId(gen.id).gen;
  const cost = getUpgradeCostProduction(generatorNumber, gen.upgradeProductionRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_UPGRADE", id, upgradeType: "production" };
}

export function tryBuyCritChance(s: GameState, id: GeneratorId): GameAction | null {
  const genIndex = s.generators.findIndex((g) => g.id === id);
  if (genIndex < 0) return null;
  const gen = s.generators[genIndex];
  if (gen.upgradeCritChanceRank >= MAX_CRIT_CHANCE_RANK) return null;
  const generatorNumber = parseGeneratorId(gen.id).gen;
  const cost = getUpgradeCostCritChance(generatorNumber, gen.upgradeCritChanceRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_UPGRADE", id, upgradeType: "critChance" };
}

export function tryBuyCritMultiplier(s: GameState, id: GeneratorId): GameAction | null {
  const genIndex = s.generators.findIndex((g) => g.id === id);
  if (genIndex < 0) return null;
  const gen = s.generators[genIndex];
  const generatorNumber = parseGeneratorId(gen.id).gen;
  const cost = getUpgradeCostCritMultiplier(generatorNumber, gen.upgradeCritMultiplierRank);
  if (s.milestoneCurrency.lt(cost)) return null;
  return { type: "BUY_UPGRADE", id, upgradeType: "critMultiplier" };
}
