import { useEffect, useRef } from "react";
import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { getInitialState } from "@/store/gameState";
import { useRawGameStateForPersist } from "@/store/useGameStore";
import { advanceMilestoneTargetIndex } from "@/utils/milestones";
import { loadSharedSettings, saveSharedSettings } from "@/utils/sharedSettings";
import { makeGeneratorId } from "@/engine/constants";

const SAVE_KEY = "idle-game-save";
const SAVE_VERSION = 6;

interface SavedState {
  version: number;
  baseResource: string;
  ticketCurrency?: string;
  ticketAccumulator?: number;
  milestoneCurrency?: string;
  ticketTradeMilestoneCount?: number;
  upgradeTicketMultiplierRank?: number;
  upgradeGeneratorCostHalfRank?: number;
  upgradeMilestoneDoublerRank?: number;
  claimedMissions?: string[];
  rank?: number;
  cards?: Record<string, number>;
  activeLine?: number;
  lineStats?: Record<string, { baseResourceProduced: string; milestoneCurrencyEarned: string }>;
  generators: {
    id: string;
    quantity: string;
    everOwned?: boolean;
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
  options?: { showFPS?: boolean; sfxEnabled?: boolean; sfxVolume?: number; sfxStyle?: string; locale?: string };
}

/** Migra IDs antigos "generator1" → "l1g1" */
function migrateGeneratorId(id: string): string {
  const match = id.match(/^generator(\d+)$/);
  if (match) return makeGeneratorId(1, parseInt(match[1], 10));
  return id;
}

/** Migra chaves de cartas: "cycleSpeed:generator1" → "cycleSpeed:l1g1" */
function migrateCardKeys(cards: Record<string, number>): Record<string, number> {
  const migrated: Record<string, number> = {};
  for (const [key, count] of Object.entries(cards)) {
    const colonIdx = key.indexOf(":");
    if (colonIdx === -1) {
      migrated[key] = count;
    } else {
      const type = key.slice(0, colonIdx);
      const genId = key.slice(colonIdx + 1);
      migrated[`${type}:${migrateGeneratorId(genId)}`] = count;
    }
  }
  return migrated;
}

function serialize(state: GameState): string {
  const saved: SavedState = {
    version: SAVE_VERSION,
    baseResource: state.baseResource.toString(),
    ticketCurrency: state.ticketCurrency.toString(),
    ticketAccumulator: state.ticketAccumulator,
    milestoneCurrency: state.milestoneCurrency.toString(),
    ticketTradeMilestoneCount: state.ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
    upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
    claimedMissions: state.claimedMissions,
    rank: state.rank,
    cards: state.cards,
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
    if (![1, 2, 3, 4, 5, 6].includes(saved.version)) return null;
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

    const rawCards = (saved.cards && typeof saved.cards === "object") ? saved.cards : {};
    const cards = needsMigration ? migrateCardKeys(rawCards) : rawCards;

    const lineStats: Record<number, { baseResourceProduced: Decimal; milestoneCurrencyEarned: Decimal }> = {};
    if (saved.lineStats && typeof saved.lineStats === "object") {
      for (const [k, v] of Object.entries(saved.lineStats)) {
        lineStats[Number(k)] = {
          baseResourceProduced: Decimal.fromString(v.baseResourceProduced ?? "0"),
          milestoneCurrencyEarned: Decimal.fromString(v.milestoneCurrencyEarned ?? "0"),
        };
      }
    }

    return {
      baseResource: Decimal.fromString(saved.baseResource ?? "0"),
      ticketCurrency: Decimal.fromString(saved.ticketCurrency ?? "0"),
      ticketAccumulator: Number(saved.ticketAccumulator) || 0,
      milestoneCurrency: Decimal.fromString(saved.milestoneCurrency ?? "0"),
      ticketTradeMilestoneCount: Number(saved.ticketTradeMilestoneCount) || 0,
      upgradeTicketMultiplierRank: Number(saved.upgradeTicketMultiplierRank) || 0,
      upgradeGeneratorCostHalfRank: Number(saved.upgradeGeneratorCostHalfRank) || 0,
      upgradeMilestoneDoublerRank: Number(saved.upgradeMilestoneDoublerRank) || 0,
      claimedMissions: Array.isArray(saved.claimedMissions) ? saved.claimedMissions : [],
      rank: Number(saved.rank) || 1,
      cards,
      activeLine: Number(saved.activeLine) || 1,
      lineStats,
      generators,
      options: {
        showFPS: shared.showFPS,
        sfxEnabled: shared.sfxEnabled,
        sfxVolume: shared.sfxVolume,
        sfxStyle: shared.sfxStyle,
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
