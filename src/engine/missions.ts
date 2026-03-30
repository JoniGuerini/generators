import { makeGeneratorId } from "./constants";
import type { GeneratorId } from "./constants";

export type MissionObjective =
  | { type: "generatorCount"; generatorId: GeneratorId; count: number }
  | { type: "milestoneCurrencyTotal"; count: number }
  | { type: "baseResourceTotal"; count: number };

export type MissionReward =
  | { type: "baseResource"; amount: number }
  | { type: "tickets"; amount: number }
  | { type: "milestoneCurrency"; amount: number }
  | { type: "generators"; generatorId: GeneratorId; amount: number };

export interface MissionDef {
  id: string;
  /** Ranque mínimo necessário para esta missão aparecer (1-based). */
  rank: number;
  objective: MissionObjective;
  rewards: MissionReward[];
}

/** Missões do ranque 1 → 2 (12 missões, 10 necessárias). */
export const MISSIONS: MissionDef[] = [
  {
    id: "mission_1",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 1), count: 10 },
    rewards: [{ type: "baseResource", amount: 100 }],
  },
  {
    id: "mission_2",
    rank: 1,
    objective: { type: "milestoneCurrencyTotal", count: 3 },
    rewards: [{ type: "milestoneCurrency", amount: 10 }],
  },
  {
    id: "mission_3",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 3), count: 1 },
    rewards: [{ type: "baseResource", amount: 10000 }],
  },
  {
    id: "mission_4",
    rank: 1,
    objective: { type: "baseResourceTotal", count: 50000 },
    rewards: [{ type: "tickets", amount: 50 }],
  },
  {
    id: "mission_5",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 2), count: 25 },
    rewards: [{ type: "milestoneCurrency", amount: 5 }],
  },
  {
    id: "mission_6",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 1), count: 50 },
    rewards: [{ type: "tickets", amount: 100 }],
  },
  {
    id: "mission_7",
    rank: 1,
    objective: { type: "milestoneCurrencyTotal", count: 10 },
    rewards: [{ type: "baseResource", amount: 50000 }],
  },
  {
    id: "mission_8",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 4), count: 1 },
    rewards: [{ type: "milestoneCurrency", amount: 15 }],
  },
  {
    id: "mission_9",
    rank: 1,
    objective: { type: "baseResourceTotal", count: 500000 },
    rewards: [{ type: "tickets", amount: 200 }],
  },
  {
    id: "mission_10",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 2), count: 100 },
    rewards: [{ type: "baseResource", amount: 100000 }],
  },
  {
    id: "mission_11",
    rank: 1,
    objective: { type: "generatorCount", generatorId: makeGeneratorId(1, 3), count: 10 },
    rewards: [{ type: "milestoneCurrency", amount: 20 }],
  },
  {
    id: "mission_12",
    rank: 1,
    objective: { type: "milestoneCurrencyTotal", count: 25 },
    rewards: [{ type: "tickets", amount: 300 }],
  },
];

/** XP necessário para subir do ranque N para N+1. */
export const RANK_THRESHOLDS = [10];

export function getRankProgress(rank: number, claimedCount: number): { rank: number; xp: number; xpNeeded: number; canRankUp: boolean } {
  let accumulated = 0;
  for (let i = 0; i < rank - 1 && i < RANK_THRESHOLDS.length; i++) {
    accumulated += RANK_THRESHOLDS[i];
  }
  const xp = claimedCount - accumulated;
  const xpNeeded = rank <= RANK_THRESHOLDS.length ? RANK_THRESHOLDS[rank - 1] : 0;
  const canRankUp = xpNeeded > 0 && xp >= xpNeeded;
  return { rank, xp, xpNeeded, canRankUp };
}

export function getActiveMissions(claimedIds: string[], rank: number): MissionDef[] {
  return MISSIONS.filter((m) => !claimedIds.includes(m.id) && m.rank === rank);
}

/** Missões visíveis na área principal (limitado a maxVisible). */
export function getVisibleMissions(claimedIds: string[], rank: number, maxVisible = 9): MissionDef[] {
  return getActiveMissions(claimedIds, rank).slice(0, maxVisible);
}
