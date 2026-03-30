import Decimal from "break_eternity.js";
import { GENERATOR_IDS, getLineGeneratorIds, makeGeneratorId, type GeneratorId } from "@/engine/constants";

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
  baseResource: Decimal;
  ticketCurrency: Decimal;
  ticketAccumulator: number;
  milestoneCurrency: Decimal;
  ticketTradeMilestoneCount: number;
  upgradeTicketMultiplierRank: number;
  upgradeGeneratorCostHalfRank: number;
  upgradeMilestoneDoublerRank: number;
  generators: GeneratorState[];
  claimedMissions: string[];
  rank: number;
  cards: Record<string, number>;
  activeLine: number;
  lineStats: Record<number, LineStats>;
  lastUpdateTimestamp: number;
  options: {
    showFPS: boolean;
    sfxEnabled: boolean;
    sfxVolume: number;
    sfxStyle: string;
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
    baseResource: Decimal.dZero,
    ticketCurrency: Decimal.dOne,
    ticketAccumulator: 0,
    milestoneCurrency: ZERO,
    ticketTradeMilestoneCount: 0,
    upgradeTicketMultiplierRank: 0,
    upgradeGeneratorCostHalfRank: 0,
    upgradeMilestoneDoublerRank: 0,
    generators: GENERATOR_IDS.map((id) => {
      const gen = initialGeneratorState(id);
      if (id === makeGeneratorId(1, 1)) return { ...gen, everOwned: true };
      return gen;
    }),
    claimedMissions: [],
    rank: 1,
    cards: {},
    activeLine: 1,
    lineStats: {},
    lastUpdateTimestamp: Date.now(),
    options: { showFPS: false, sfxEnabled: true, sfxVolume: 50, sfxStyle: "soft", locale: "pt-BR" },
  };
}
