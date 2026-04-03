import Decimal from "break_eternity.js";
import { GENERATOR_IDS, getLineGeneratorIds, parseGeneratorId, makeGeneratorId, LINE_COUNT, type GeneratorId } from "@/engine/constants";

export interface GeneratorState {
  id: GeneratorId;
  quantity: Decimal;
  everOwned: boolean;
  manualCycleActive: boolean;
  cycleProgress: number;
  cycleStartTime: number;
  claimedMilestoneIndex: number;
  currentMilestoneTargetIndex: number;
  upgradeCycleSpeedRank: number;
  upgradeProductionRank: number;
  upgradeCritChanceRank: number;
  upgradeCritMultiplierRank: number;
}

export interface LineStats {
  baseResourceProduced: Decimal;
  milestoneCurrencyEarned: Decimal;
}

export interface GameState {
  lineResources: Record<number, Decimal>;
  ticketCurrency: Decimal;
  ticketAccumulator: number;
  milestoneCurrency: Decimal;
  lineTicketTradeCounts: Record<number, number>;
  upgradeTicketMultiplierRank: number;
  upgradeTicketTradeDoublerRank: number;
  upgradeGeneratorCostHalfRank: number;
  upgradeMilestoneDoublerRank: number;
  upgradeGlobalProductionDoublerRank: number;
  upgradeLineProductionDoublerRanks: Record<number, number>;
  upgradeLineCostHalfRanks: Record<number, number>;
  generators: GeneratorState[];
  activeLine: number;
  lineStats: Record<number, LineStats>;
  lastUpdateTimestamp: number;
  options: {
    showFPS: boolean;
    sfxEnabled: boolean;
    sfxVolume: number;
    locale: string;
  };
}

const ZERO = Decimal.dZero;

function initialGeneratorState(id: GeneratorId): GeneratorState {
  const now = Date.now();
  return {
    id,
    quantity: ZERO,
    everOwned: false,
    manualCycleActive: false,
    cycleProgress: 0,
    cycleStartTime: now,
    claimedMilestoneIndex: 0,
    currentMilestoneTargetIndex: 1,
    upgradeCycleSpeedRank: 0,
    upgradeProductionRank: 0,
    upgradeCritChanceRank: 0,
    upgradeCritMultiplierRank: 0,
  };
}

export function getTotalTicketTrades(state: GameState): number {
  return Object.values(state.lineTicketTradeCounts).reduce((sum, c) => sum + c, 0);
}

/**
 * Line N requires Generator N of Line N-1 to be owned.
 * E.g. Line 2 needs l1g2, Line 3 needs l2g3, Line 10 needs l9g10.
 */
export function getLineUnlockRequirement(line: number): { genId: GeneratorId; line: number; gen: number } | null {
  if (line <= 1) return null;
  const prevLine = line - 1;
  const genNum = line;
  return { genId: makeGeneratorId(prevLine, genNum), line: prevLine, gen: genNum };
}

export function isLineUnlocked(state: GameState, line: number): boolean {
  if (line <= 1) return true;
  const req = getLineUnlockRequirement(line);
  if (!req) return true;
  const gen = state.generators.find(g => g.id === req.genId);
  return gen?.everOwned === true;
}

export function getLineResource(state: GameState, line: number): Decimal {
  return state.lineResources[line] ?? Decimal.dZero;
}

export function getVisibleGeneratorIds(state: GameState, line?: number): GeneratorId[] {
  const targetLine = line ?? state.activeLine;
  const lineIds = getLineGeneratorIds(targetLine);
  const ids: GeneratorId[] = [];
  let nextAdded = false;
  for (const id of lineIds) {
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
    lineResources: Object.fromEntries(
      Array.from({ length: LINE_COUNT }, (_, i) => [i + 1, Decimal.dZero])
    ),
    ticketCurrency: Decimal.dOne,
    ticketAccumulator: 0,
    milestoneCurrency: ZERO,
    lineTicketTradeCounts: Object.fromEntries(
      Array.from({ length: LINE_COUNT }, (_, i) => [i + 1, 0])
    ),
    upgradeTicketMultiplierRank: 0,
    upgradeTicketTradeDoublerRank: 0,
    upgradeGeneratorCostHalfRank: 0,
    upgradeMilestoneDoublerRank: 0,
    upgradeGlobalProductionDoublerRank: 0,
    upgradeLineProductionDoublerRanks: Object.fromEntries(
      Array.from({ length: LINE_COUNT }, (_, i) => [i + 1, 0])
    ),
    upgradeLineCostHalfRanks: Object.fromEntries(
      Array.from({ length: LINE_COUNT }, (_, i) => [i + 1, 0])
    ),
    generators: GENERATOR_IDS.map((id) => {
      const gen = initialGeneratorState(id);
      if (parseGeneratorId(id).gen === 1) return { ...gen, everOwned: true };
      return gen;
    }),
    activeLine: 1,
    lineStats: {},
    lastUpdateTimestamp: Date.now(),
    options: { showFPS: false, sfxEnabled: true, sfxVolume: 50, locale: "pt-BR" },
  };
}
