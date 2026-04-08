import { useEffect, useRef } from "react";
import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { getInitialState, getLineUnlockRequirement } from "@/store/gameState";
import { useRawGameStateForPersist } from "@/store/useGameStore";
import { advanceMilestoneTargetIndex } from "@/utils/milestones";
import { loadSharedSettings, saveSharedSettings } from "@/utils/sharedSettings";
import { makeGeneratorId, LINE_COUNT } from "@/engine/constants";

const SAVE_KEY = "idle-game-save";
const SAVE_VERSION = 9;

interface SavedState {
  version: number;
  baseResource?: string;
  lineResources?: Record<string, string>;
  ticketCurrency?: string;
  ticketAccumulator?: number;
  milestoneCurrency?: string;
  ticketTradeMilestoneCount?: number;
  lineTicketTradeCounts?: Record<string, number>;
  upgradeTicketMultiplierRank?: number;
  upgradeTicketTradeDoublerRank?: number;
  upgradeGeneratorCostHalfRank?: number;
  upgradeMilestoneDoublerRank?: number;
  upgradeGlobalProductionDoublerRank?: number;
  upgradeLineProductionDoublerRanks?: Record<string, number>;
  upgradeLineCostHalfRanks?: Record<string, number>;
  unlockedLines?: Record<string, boolean>;
  activeLine?: number;
  lineStats?: Record<string, { baseResourceProduced: string; milestoneCurrencyEarned: string }>;
  generators: {
    id: string;
    quantity: string;
    everOwned?: boolean;
    manualCycleActive?: boolean;
    cycleProgress: number;
    cycleStartTime: number;
    claimedMilestoneIndex?: number;
    currentMilestoneTargetIndex?: number;
    upgradeCycleSpeedRank?: number;
    upgradeProductionRank?: number;
    upgradeCritChanceRank?: number;
    upgradeCritMultiplierRank?: number;
  }[];
  lastUpdateTimestamp: number;
  options?: { showFPS?: boolean; sfxEnabled?: boolean; sfxVolume?: number; locale?: string };
}

function migrateGeneratorId(id: string): string {
  const match = id.match(/^generator(\d+)$/);
  if (match) return makeGeneratorId(1, parseInt(match[1], 10));
  return id;
}

function serialize(state: GameState): string {
  const saved: SavedState = {
    version: SAVE_VERSION,
    lineResources: Object.fromEntries(
      Object.entries(state.lineResources).map(([k, v]) => [k, v.toString()])
    ),
    ticketCurrency: state.ticketCurrency.toString(),
    ticketAccumulator: state.ticketAccumulator,
    milestoneCurrency: state.milestoneCurrency.toString(),
    lineTicketTradeCounts: state.lineTicketTradeCounts,
    upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
    upgradeTicketTradeDoublerRank: state.upgradeTicketTradeDoublerRank,
    upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
    upgradeGlobalProductionDoublerRank: state.upgradeGlobalProductionDoublerRank,
    upgradeLineProductionDoublerRanks: state.upgradeLineProductionDoublerRanks,
    upgradeLineCostHalfRanks: state.upgradeLineCostHalfRanks,
    unlockedLines: state.unlockedLines,
    activeLine: state.activeLine,
    lineStats: Object.fromEntries(
      Object.entries(state.lineStats).map(([k, v]) => [k, {
        baseResourceProduced: v.baseResourceProduced.toString(),
        milestoneCurrencyEarned: v.milestoneCurrencyEarned.toString(),
      }])
    ),
    generators: state.generators.map((g) => ({
      id: g.id,
      quantity: g.quantity.toString(),
      everOwned: g.everOwned,
      manualCycleActive: g.manualCycleActive,
      cycleProgress: g.cycleProgress,
      cycleStartTime: g.cycleStartTime,
      claimedMilestoneIndex: g.claimedMilestoneIndex,
      currentMilestoneTargetIndex: g.currentMilestoneTargetIndex,
      upgradeCycleSpeedRank: g.upgradeCycleSpeedRank,
      upgradeProductionRank: g.upgradeProductionRank,
      upgradeCritChanceRank: g.upgradeCritChanceRank,
      upgradeCritMultiplierRank: g.upgradeCritMultiplierRank,
    })),
    lastUpdateTimestamp: state.lastUpdateTimestamp,
    options: state.options,
  };
  return JSON.stringify(saved);
}

function deserialize(raw: string): GameState | null {
  try {
    const saved = JSON.parse(raw) as SavedState;
    if (saved.version < 1 || saved.version > SAVE_VERSION) return null;
    const initial = getInitialState();
    const now = Date.now();
    const shared = loadSharedSettings();
    const needsMigration = saved.version < 6;

    const byId = new Map(
      saved.generators?.map((g) => {
        const q = Decimal.fromString(g.quantity);
        const everOwned = g.everOwned ?? q.gte(Decimal.dOne);
        const migratedId = needsMigration ? migrateGeneratorId(g.id) : g.id;
        return [
          migratedId,
          {
            id: migratedId as GameState["generators"][0]["id"],
            quantity: q,
            everOwned,
            manualCycleActive: !!g.manualCycleActive,
            cycleProgress: Number(g.cycleProgress) || 0,
            cycleStartTime: Number(g.cycleStartTime) || now,
            claimedMilestoneIndex: Number(g.claimedMilestoneIndex) || 0,
            currentMilestoneTargetIndex: Number(g.currentMilestoneTargetIndex) || 0,
            upgradeCycleSpeedRank: Number(g.upgradeCycleSpeedRank) || 0,
            upgradeProductionRank: Number(g.upgradeProductionRank) || 0,
            upgradeCritChanceRank: Number(g.upgradeCritChanceRank) || 0,
            upgradeCritMultiplierRank: Number(g.upgradeCritMultiplierRank) || 0,
          },
        ];
      }) ?? []
    );
    const generators = initial.generators.map((g) => {
      const loaded = byId.get(g.id);
      if (!loaded) return g;
      const claimed = loaded.claimedMilestoneIndex ?? 0;
      const rawTarget = loaded.currentMilestoneTargetIndex;
      const currentMilestoneTargetIndex =
        rawTarget != null && rawTarget >= 1
          ? rawTarget
          : advanceMilestoneTargetIndex(loaded.quantity, 1);
      return { ...g, ...loaded, claimedMilestoneIndex: claimed, currentMilestoneTargetIndex };
    });

    const lineStats: Record<number, { baseResourceProduced: Decimal; milestoneCurrencyEarned: Decimal }> = {};
    if (saved.lineStats && typeof saved.lineStats === "object") {
      for (const [k, v] of Object.entries(saved.lineStats)) {
        lineStats[Number(k)] = {
          baseResourceProduced: Decimal.fromString(v.baseResourceProduced ?? "0"),
          milestoneCurrencyEarned: Decimal.fromString(v.milestoneCurrencyEarned ?? "0"),
        };
      }
    }

    let lineResources: Record<number, Decimal>;
    if (saved.lineResources && typeof saved.lineResources === "object") {
      lineResources = {};
      for (const [k, v] of Object.entries(saved.lineResources)) {
        lineResources[Number(k)] = Decimal.fromString(v ?? "0");
      }
    } else {
      lineResources = { ...initial.lineResources };
      if (saved.baseResource) {
        lineResources[1] = Decimal.fromString(saved.baseResource);
      }
    }

    return {
      lineResources,
      ticketCurrency: Decimal.fromString(saved.ticketCurrency ?? "0"),
      ticketAccumulator: Number(saved.ticketAccumulator) || 0,
      milestoneCurrency: Decimal.fromString(saved.milestoneCurrency ?? "0"),
      lineTicketTradeCounts: (() => {
        if (saved.lineTicketTradeCounts && typeof saved.lineTicketTradeCounts === "object") {
          const counts: Record<number, number> = {};
          for (const [k, v] of Object.entries(saved.lineTicketTradeCounts)) {
            counts[Number(k)] = Number(v) || 0;
          }
          return counts;
        }
        const oldCount = Number(saved.ticketTradeMilestoneCount) || 0;
        const counts: Record<number, number> = { ...initial.lineTicketTradeCounts };
        if (oldCount > 0) counts[1] = oldCount;
        return counts;
      })(),
      upgradeTicketMultiplierRank: Number(saved.upgradeTicketMultiplierRank) || 0,
      upgradeTicketTradeDoublerRank: Number(saved.upgradeTicketTradeDoublerRank) || 0,
      upgradeGeneratorCostHalfRank: Number(saved.upgradeGeneratorCostHalfRank) || 0,
      upgradeMilestoneDoublerRank: Number(saved.upgradeMilestoneDoublerRank) || 0,
      upgradeGlobalProductionDoublerRank: Number(saved.upgradeGlobalProductionDoublerRank) || 0,
      upgradeLineProductionDoublerRanks: (() => {
        if (saved.upgradeLineProductionDoublerRanks && typeof saved.upgradeLineProductionDoublerRanks === "object") {
          const ranks: Record<number, number> = {};
          for (const [k, v] of Object.entries(saved.upgradeLineProductionDoublerRanks)) {
            ranks[Number(k)] = Number(v) || 0;
          }
          return ranks;
        }
        return { ...initial.upgradeLineProductionDoublerRanks };
      })(),
      upgradeLineCostHalfRanks: (() => {
        if (saved.upgradeLineCostHalfRanks && typeof saved.upgradeLineCostHalfRanks === "object") {
          const ranks: Record<number, number> = {};
          for (const [k, v] of Object.entries(saved.upgradeLineCostHalfRanks)) {
            ranks[Number(k)] = Number(v) || 0;
          }
          return ranks;
        }
        return { ...initial.upgradeLineCostHalfRanks };
      })(),
      unlockedLines: (() => {
        if (saved.unlockedLines && typeof saved.unlockedLines === "object") {
          const lines: Record<number, boolean> = { 1: true };
          for (const [k, v] of Object.entries(saved.unlockedLines)) {
            if (v) lines[Number(k)] = true;
          }
          return lines;
        }
        const migrated: Record<number, boolean> = { 1: true };
        for (let ln = 2; ln <= LINE_COUNT; ln++) {
          const req = getLineUnlockRequirement(ln);
          if (!req) continue;
          const ls = lineStats[req.prevLine];
          if (ls && ls.baseResourceProduced.gte(req.threshold)) migrated[ln] = true;
        }
        return migrated;
      })(),
      activeLine: Number(saved.activeLine) || 1,
      lineStats,
      generators,
      options: {
        showFPS: shared.showFPS,
        sfxEnabled: shared.sfxEnabled,
        sfxVolume: shared.sfxVolume,
        locale: shared.locale,
      },
      lastUpdateTimestamp: saved.lastUpdateTimestamp ?? Date.now(),
    };
  } catch {
    return null;
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return deserialize(raw);
  } catch {
    return null;
  }
}

export function usePersist() {
  const state = useRawGameStateForPersist();
  const lastSaveTimeRef = useRef(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const save = () => {
      const s = stateRef.current;
      localStorage.setItem(SAVE_KEY, serialize(s));
      saveSharedSettings(s.options);
      lastSaveTimeRef.current = Date.now();
    };

    const interval = setInterval(() => {
      save();
    }, 30000);

    const onBeforeUnload = () => save();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") save();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      save();
    };
  }, []);
}
