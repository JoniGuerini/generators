import { useEffect, useRef } from "react";
import Decimal from "break_eternity.js";
import type { GameState } from "@/store/gameState";
import { getInitialState } from "@/store/gameState";
import { useRawGameStateForPersist } from "@/store/useGameStore";
import { advanceMilestoneTargetIndex } from "@/utils/milestones";
import { loadSharedSettings, saveSharedSettings } from "@/utils/sharedSettings";

const SAVE_KEY = "idle-game-save";
const SAVE_VERSION = 5;

interface SavedState {
  version: number;
  baseResource: string;
  ticketCurrency?: string;
  ticketAccumulator?: number;
  milestoneCurrency?: string;
  upgradeTicketRateRank?: number;
  ticketTradeMilestoneCount?: number;
  upgradeTicketMultiplierRank?: number;
  upgradeGeneratorCostHalfRank?: number;
  upgradeMilestoneDoublerRank?: number;
  prestigePoints?: string;
  prestigeThresholdsClaimed?: string | number;
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

function serialize(state: GameState): string {
  const saved: SavedState = {
    version: SAVE_VERSION,
    baseResource: state.baseResource.toString(),
    ticketCurrency: state.ticketCurrency.toString(),
    ticketAccumulator: state.ticketAccumulator,
    milestoneCurrency: state.milestoneCurrency.toString(),
    upgradeTicketRateRank: state.upgradeTicketRateRank,
    ticketTradeMilestoneCount: state.ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
    upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
    prestigePoints: state.prestigePoints.toString(),
    prestigeThresholdsClaimed: state.prestigeThresholdsClaimed.toString(),
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
    if (saved.version !== SAVE_VERSION && saved.version !== 1 && saved.version !== 2 && saved.version !== 3 && saved.version !== 4) return null;
    const initial = getInitialState();
    const now = Date.now();
    const shared = loadSharedSettings();
    const byId = new Map(
      saved.generators?.map((g) => {
        const q = Decimal.fromString(g.quantity);
        const everOwned = (g as { everOwned?: boolean }).everOwned ?? q.gte(Decimal.dOne);
        return [
          g.id,
          {
            id: g.id as GameState["generators"][0]["id"],
            quantity: q,
            everOwned,
            cycleProgress: Number(g.cycleProgress) || 0,
            cycleStartTime: Number(g.cycleStartTime) || now,
            claimedMilestoneIndex: Number(g.claimedMilestoneIndex) || 0,
            currentMilestoneTargetIndex: Number(g.currentMilestoneTargetIndex) || 0,
            upgradeCycleSpeedRank: Number((g as SavedState["generators"][0]).upgradeCycleSpeedRank) || 0,
            upgradeProductionRank: Number((g as SavedState["generators"][0]).upgradeProductionRank) || 0,
            upgradeCritChanceRank: Number((g as SavedState["generators"][0]).upgradeCritChanceRank) || 0,
            upgradeCritMultiplierRank: Number((g as SavedState["generators"][0]).upgradeCritMultiplierRank) || 0,
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
      const upgCycle = (loaded as { upgradeCycleSpeedRank?: number }).upgradeCycleSpeedRank ?? 0;
      const upgProd = (loaded as { upgradeProductionRank?: number }).upgradeProductionRank ?? 0;
      const upgCritChance = (loaded as { upgradeCritChanceRank?: number }).upgradeCritChanceRank ?? 0;
      const upgCritMult = (loaded as { upgradeCritMultiplierRank?: number }).upgradeCritMultiplierRank ?? 0;
      return { ...g, ...loaded, claimedMilestoneIndex: claimed, currentMilestoneTargetIndex, upgradeCycleSpeedRank: upgCycle, upgradeProductionRank: upgProd, upgradeCritChanceRank: upgCritChance, upgradeCritMultiplierRank: upgCritMult };
    });
    return {
      baseResource: Decimal.fromString(saved.baseResource ?? "0"),
      ticketCurrency: Decimal.fromString(saved.ticketCurrency ?? "0"),
      ticketAccumulator: Number(saved.ticketAccumulator) || 0,
      milestoneCurrency: Decimal.fromString(saved.milestoneCurrency ?? "0"),
      upgradeTicketRateRank: Number(saved.upgradeTicketRateRank) || 0,
      ticketTradeMilestoneCount: Number(saved.ticketTradeMilestoneCount) || 0,
      upgradeTicketMultiplierRank: Number(saved.upgradeTicketMultiplierRank) || 0,
      upgradeGeneratorCostHalfRank: Number(saved.upgradeGeneratorCostHalfRank) || 0,
      upgradeMilestoneDoublerRank: Number(saved.upgradeMilestoneDoublerRank) || 0,
      prestigePoints: Decimal.fromString(saved.prestigePoints ?? "0"),
      prestigeThresholdsClaimed: saved.prestigeThresholdsClaimed != null
        ? (typeof saved.prestigeThresholdsClaimed === "number"
          ? Decimal.fromNumber(saved.prestigeThresholdsClaimed)
          : Decimal.fromString(saved.prestigeThresholdsClaimed))
        : Decimal.dZero,
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

    // Auto-save every 30 seconds
    const interval = setInterval(() => {
      save();
    }, 30000);

    // Initial save listener for exit/visibility change
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
      // Final save on cleanup
      save();
    };
  }, []);
}
