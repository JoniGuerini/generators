import { useState, useContext, useCallback } from "react";
import Decimal from "break_eternity.js";
import { StoreContext, useGameSelector } from "@/store/useGameStore";
import type { GameState } from "@/store/gameState";
import type { GameAction } from "@/store/reducer";
import { useBuyMode } from "@/contexts/BuyModeContext";
import {
  ABSOLUTE_CAP,
  dispatchUpgradeBulk,
  dispatchUpgradeFixedBatch,
} from "@/utils/upgradeBulkPurchase";
import * as purchaseTry from "@/utils/upgradePurchaseTry";
import {
  type UpgradeBulkCostInput,
  type BulkSpendPreview,
  computeTicketMultiplierBulkSpend,
  computeTicketTradeDoublerBulkSpend,
  computeGeneratorCostHalfBulkSpend,
  computeMilestoneDoublerBulkSpend,
  computeGlobalProductionDoublerBulkSpend,
  computeLineProductionDoublerBulkSpend,
  computeLineCostHalfBulkSpend,
  computeCycleSpeedBulkSpend,
  computeProductionBulkSpend,
  computeCritChanceBulkSpend,
  computeCritMultiplierBulkSpend,
  upgradePreviewCanBuy,
} from "@/utils/computeUpgradeBulkSpend";
import { getTotalTicketTrades, isLineUnlocked, getLineUnlockRequirement } from "@/store/gameState";
import { GENERATOR_DEFS, parseGeneratorId, getLineColor, LINE_COLOR_CLASSES, LINE_COUNT, GENERATORS_PER_LINE, makeGeneratorId } from "@/engine/constants";
import { useT } from "@/locale";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getTicketsPerSecond,
  getTicketTradeValue,
  getMilestoneRewardMultiplier,
  getCritChance,
  getCritMultiplier,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";
import { formatNumber, formatTime } from "@/utils/format";
import { useHoldToRepeat } from "@/hooks/useHoldToRepeat";

type UpgradesTab = "geral" | "geradores" | "tickets";

const UPGRADE_BUTTON_WIDTH = "10rem";

function HighlightCoin({ text }: { text: string }) {
  const parts = text.split("◆");
  if (parts.length === 1) return <>{text}</>;
  return <>{parts[0]}<span className="text-violet-400">◆</span>{parts[1]}</>;
}

function UpgradeRow({
  label,
  sublabel,
  cost,
  canBuy,
  onBuy,
  buttonLabel,
  maxed,
  maxedLabel = "Máx.",
  buttonVariant = "default",
  width,
  flexible,
  holdTitle,
  progress,
  progressColor = "bg-cyan-600",
}: {
  label: React.ReactNode;
  sublabel?: string;
  cost: string;
  canBuy: boolean;
  onBuy: () => void;
  buttonLabel: string;
  maxed?: boolean;
  maxedLabel?: string;
  buttonVariant?: "default" | "base";
  width?: string;
  flexible?: boolean;
  holdTitle?: string;
  progress?: number;
  progressColor?: string;
}) {
  const rowWidth = width || "18.5rem";
  const buttonActiveClass =
    buttonVariant === "base"
      ? "btn-3d btn-3d--cyan bg-cyan-600 text-white hover:bg-cyan-500"
      : "btn-3d btn-3d--violet bg-violet-600 text-white hover:bg-violet-500";
  const effectiveCanBuy = canBuy;
  const hold = useHoldToRepeat(onBuy);
  const hasProgress = progress != null;
  const pct = hasProgress ? Math.min(progress * 100, 100) : 0;

  return (
    <div
      className={`flex flex-nowrap items-center justify-between gap-3 rounded-lg bg-zinc-900/70 px-3 py-1.5 ${flexible ? "min-w-0 flex-1" : ""}`}
      style={flexible ? undefined : { width: rowWidth, minWidth: rowWidth }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      {sublabel && (
        <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500">
          {sublabel}
        </span>
      )}
      {maxed ? (
        <span
          className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700 px-3 text-xs font-medium text-zinc-400"
          style={{ minWidth: UPGRADE_BUTTON_WIDTH }}
        >
          {maxedLabel}
        </span>
      ) : hasProgress ? (
        <button
          type="button"
          onPointerDown={hold.onPointerDown}
          onPointerUp={hold.onPointerUp}
          onPointerCancel={hold.onPointerCancel}
          onLostPointerCapture={hold.onLostPointerCapture}
          onKeyDown={hold.onKeyDown}
          disabled={!effectiveCanBuy}
          title={cost ? `${cost}${holdTitle ? ` — ${holdTitle}` : ""}` : undefined}
          style={{ minWidth: UPGRADE_BUTTON_WIDTH }}
          className={`relative flex h-9 shrink-0 items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-medium whitespace-nowrap touch-manipulation select-none ${
            effectiveCanBuy
              ? "btn-3d btn-3d--cyan text-white"
              : "btn-3d btn-3d--zinc cursor-default text-zinc-400"
          }`}
        >
          <div className="absolute inset-0 bg-zinc-700" />
          <div
            className={`absolute inset-y-0 left-0 ${progressColor} transition-[width] duration-300 ease-linear`}
            style={{ width: `${pct}%` }}
          />
          <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">{buttonLabel}</span>
        </button>
      ) : (
        <button
          type="button"
          onPointerDown={hold.onPointerDown}
          onPointerUp={hold.onPointerUp}
          onPointerCancel={hold.onPointerCancel}
          onLostPointerCapture={hold.onLostPointerCapture}
          onKeyDown={hold.onKeyDown}
          disabled={!effectiveCanBuy}
          title={cost ? `${cost}${holdTitle ? ` — ${holdTitle}` : ""}` : undefined}
          style={{ minWidth: UPGRADE_BUTTON_WIDTH }}
          className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium whitespace-nowrap touch-manipulation select-none ${
            effectiveCanBuy ? buttonActiveClass : "btn-3d btn-3d--zinc cursor-not-allowed bg-zinc-700 text-zinc-500"
          }`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

function upgradeBuyButtonLabel(p: BulkSpendPreview): string {
  if (p.count > 0) return `◆ ${formatNumber(p.total)}`;
  if (p.firstCost != null) return `◆ ${formatNumber(p.firstCost)}`;
  return "—";
}

function upgradeBuyCostTitle(p: BulkSpendPreview): string {
  if (p.count > 0) return `◆ ${formatNumber(p.total)}`;
  if (p.firstCost != null) return `◆ ${formatNumber(p.firstCost)}`;
  return "";
}

export function UpgradesPage() {
  const store = useContext(StoreContext);
  const { upgradeBuyMode } = useBuyMode();
  const t = useT();
  const [tab, setTab] = useState<UpgradesTab>("geradores");
  const [upgradeLine, setUpgradeLine] = useState(1);

  const bulk = useCallback(
    (tryGet: (s: GameState) => GameAction | null, preview: BulkSpendPreview) => {
      if (!store) return;
      if (preview.isFlexibleBatch) {
        dispatchUpgradeBulk(
          (a) => store.dispatch(a),
          () => store.getState(),
          ABSOLUTE_CAP,
          tryGet,
        );
      } else {
        const cur = store.getState().milestoneCurrency;
        if (!upgradePreviewCanBuy(preview, cur)) return;
        dispatchUpgradeFixedBatch(
          (a) => store.dispatch(a),
          () => store.getState(),
          preview.count,
          tryGet,
        );
      }
    },
    [store],
  );

  const {
    everOwnedSet,
    milestoneCurrency,
    totalTicketTrades,
    upgradeTicketMultiplierRank,
    upgradeTicketTradeDoublerRank,
    upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank,
    upgradeGlobalProductionDoublerRank,
    upgradeLineProductionDoublerRanks,
    upgradeLineCostHalfRanks,
    generatorsData,
    unlockedLines,
  } = useGameSelector((state) => {
    const everOwnedSet = new Set(
      state.generators.filter(g => g.everOwned).map(g => g.id)
    );
    const generatorsData = state.generators.map(g => ({
      id: g.id,
      upgradeCycleSpeedRank: g.upgradeCycleSpeedRank,
      upgradeProductionRank: g.upgradeProductionRank,
      upgradeCritChanceRank: g.upgradeCritChanceRank,
      upgradeCritMultiplierRank: g.upgradeCritMultiplierRank,
    }));

    return {
      everOwnedSet,
      milestoneCurrency: state.milestoneCurrency,
      totalTicketTrades: getTotalTicketTrades(state),
      upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
      upgradeTicketTradeDoublerRank: state.upgradeTicketTradeDoublerRank,
      upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
      upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
      upgradeGlobalProductionDoublerRank: state.upgradeGlobalProductionDoublerRank,
      upgradeLineProductionDoublerRanks: state.upgradeLineProductionDoublerRanks,
      upgradeLineCostHalfRanks: state.upgradeLineCostHalfRanks,
      generatorsData,
      unlockedLines: Array.from({ length: LINE_COUNT }, (_, i) => isLineUnlocked(state, i + 1)),
    };
  }, (a, b) => 
    a.milestoneCurrency.equals(b.milestoneCurrency) &&
    a.totalTicketTrades === b.totalTicketTrades &&
    a.upgradeTicketMultiplierRank === b.upgradeTicketMultiplierRank &&
    a.upgradeTicketTradeDoublerRank === b.upgradeTicketTradeDoublerRank &&
    a.upgradeGeneratorCostHalfRank === b.upgradeGeneratorCostHalfRank &&
    a.upgradeMilestoneDoublerRank === b.upgradeMilestoneDoublerRank &&
    a.upgradeGlobalProductionDoublerRank === b.upgradeGlobalProductionDoublerRank &&
    a.upgradeLineProductionDoublerRanks === b.upgradeLineProductionDoublerRanks &&
    a.upgradeLineCostHalfRanks === b.upgradeLineCostHalfRanks &&
    a.everOwnedSet.size === b.everOwnedSet.size &&
    [...a.everOwnedSet].every(id => b.everOwnedSet.has(id)) &&
    a.generatorsData.length === b.generatorsData.length &&
    a.generatorsData.every((g, i) => 
      g.upgradeCycleSpeedRank === b.generatorsData[i].upgradeCycleSpeedRank && 
      g.upgradeProductionRank === b.generatorsData[i].upgradeProductionRank &&
      g.upgradeCritChanceRank === b.generatorsData[i].upgradeCritChanceRank &&
      g.upgradeCritMultiplierRank === b.generatorsData[i].upgradeCritMultiplierRank
    ) &&
    a.unlockedLines.every((v, i) => v === b.unlockedLines[i])
  );

  const bulkInput: UpgradeBulkCostInput = {
    milestoneCurrency,
    upgradeTicketMultiplierRank,
    upgradeTicketTradeDoublerRank,
    upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank,
    upgradeGlobalProductionDoublerRank,
    upgradeLineProductionDoublerRanks,
    upgradeLineCostHalfRanks,
    generators: generatorsData,
  };

  const pGenHalf = computeGeneratorCostHalfBulkSpend(bulkInput, upgradeBuyMode);
  const pMileD = computeMilestoneDoublerBulkSpend(bulkInput, upgradeBuyMode);
  const pGlobP = computeGlobalProductionDoublerBulkSpend(bulkInput, upgradeBuyMode);
  const pTicketM = computeTicketMultiplierBulkSpend(bulkInput, upgradeBuyMode);
  const pTicketT = computeTicketTradeDoublerBulkSpend(bulkInput, upgradeBuyMode);
  const pLineProd = computeLineProductionDoublerBulkSpend(bulkInput, upgradeLine, upgradeBuyMode);
  const pLineHalf = computeLineCostHalfBulkSpend(bulkInput, upgradeLine, upgradeBuyMode);

  const allLineGeneratorIds = Array.from(
    { length: GENERATORS_PER_LINE },
    (_, i) => makeGeneratorId(upgradeLine, i + 1)
  );

  const ticketsPerSec = getTicketsPerSecond(totalTicketTrades, upgradeTicketMultiplierRank, upgradeTicketTradeDoublerRank);
  const nextTicketsMultiplier = getTicketsPerSecond(totalTicketTrades, upgradeTicketMultiplierRank + 1, upgradeTicketTradeDoublerRank);

  const currentTradeValue = getTicketTradeValue(upgradeTicketTradeDoublerRank);
  const nextTradeValue = getTicketTradeValue(upgradeTicketTradeDoublerRank + 1);

  const tabs: { key: UpgradesTab; label: string }[] = [
    { key: "geradores", label: t.upgradesPage.generators },
    { key: "geral", label: t.upgradesPage.general },
    { key: "tickets", label: t.upgradesPage.tickets },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-2 px-4 pt-3 pb-2">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`btn-3d flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${
              tab === key
                ? "btn-3d--violet bg-violet-600 text-white"
                : "btn-3d--zinc bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "geradores" && (
        <div className="flex shrink-0 gap-1.5 px-4 pb-2">
          {Array.from({ length: LINE_COUNT }, (_, i) => {
            const line = i + 1;
            const color = getLineColor(line);
            const classes = LINE_COLOR_CLASSES[color];
            const isActive = line === upgradeLine;
            const unlocked = unlockedLines[i];
            if (!unlocked) {
              return (
                <button
                  key={line}
                  type="button"
                  onClick={() => setUpgradeLine(line)}
                  className={`btn-3d btn-3d--zinc flex h-7 flex-1 items-center justify-center rounded text-xs font-bold ${
                    isActive ? "bg-zinc-600 text-zinc-300" : "bg-zinc-700 text-zinc-500 opacity-60 hover:opacity-80"
                  }`}
                >
                  {line}
                </button>
              );
            }
            return (
              <button
                key={line}
                type="button"
                onClick={() => setUpgradeLine(line)}
                className={`btn-3d flex h-7 flex-1 items-center justify-center rounded text-xs font-bold text-white ${
                  isActive
                    ? `${classes.btn3d} ${classes.bg}`
                    : "btn-3d--zinc bg-zinc-700 text-zinc-500 opacity-60 hover:opacity-100"
                }`}
              >
                {line}
              </button>
            );
          })}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-none">
        {tab === "geral" && (
          <div className="flex flex-wrap gap-2">
            {(() => {
              const rank = upgradeGeneratorCostHalfRank;
              return (
                <UpgradeRow
                  flexible
                  label={
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.halfCostAll}</span>
                  }
                  sublabel={`${rank}`}
                  cost={upgradeBuyCostTitle(pGenHalf)}
                  canBuy={upgradePreviewCanBuy(pGenHalf, milestoneCurrency)}
                  onBuy={() => bulk(purchaseTry.tryBuyGeneratorCostHalf, pGenHalf)}
                  buttonLabel={upgradeBuyButtonLabel(pGenHalf)}
                />
              );
            })()}
            {(() => {
              const rank = upgradeMilestoneDoublerRank;
              const currentMult = getMilestoneRewardMultiplier(rank);
              const nextMult = getMilestoneRewardMultiplier(rank + 1);
              return (
                <UpgradeRow
                  flexible
                  label={
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500"><HighlightCoin text={t.upgradesPage.doubleMilestoneReward} /></span>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="text-zinc-400">×{formatNumber(Decimal.fromNumber(currentMult))}</span>
                        <span className="text-violet-400/80">→</span>
                        <span className="text-white">×{formatNumber(Decimal.fromNumber(nextMult))}</span>
                      </div>
                    </div>
                  }
                  sublabel={`${rank}`}
                  cost={upgradeBuyCostTitle(pMileD)}
                  canBuy={upgradePreviewCanBuy(pMileD, milestoneCurrency)}
                  onBuy={() => bulk(purchaseTry.tryBuyMilestoneDoubler, pMileD)}
                  buttonLabel={upgradeBuyButtonLabel(pMileD)}
                />
              );
            })()}
            {(() => {
              const rank = upgradeGlobalProductionDoublerRank;
              const currentMult = 2 ** rank;
              const nextMult = 2 ** (rank + 1);
              return (
                <UpgradeRow
                  flexible
                  label={
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.doubleProductionGlobal}</span>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="text-zinc-400">×{formatNumber(Decimal.fromNumber(currentMult))}</span>
                        <span className="text-violet-400/80">→</span>
                        <span className="text-white">×{formatNumber(Decimal.fromNumber(nextMult))}</span>
                      </div>
                    </div>
                  }
                  sublabel={`${rank}`}
                  cost={upgradeBuyCostTitle(pGlobP)}
                  canBuy={upgradePreviewCanBuy(pGlobP, milestoneCurrency)}
                  onBuy={() => bulk(purchaseTry.tryBuyGlobalProductionDoubler, pGlobP)}
                  buttonLabel={upgradeBuyButtonLabel(pGlobP)}
                />
              );
            })()}
          </div>
        )}

        {tab === "tickets" && (
          <div className="mx-auto max-w-4xl space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-400" aria-hidden>×2</div>
              <UpgradeRow
                flexible
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.doubleProduction}</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">{formatNumber(Decimal.fromNumber(nextTicketsMultiplier))}</span>
                      <span className="text-amber-500/60 text-[10px]">▲/s</span>
                    </div>
                  </div>
                }
                sublabel={`×2: ${upgradeTicketMultiplierRank}`}
                cost={upgradeBuyCostTitle(pTicketM)}
                canBuy={upgradePreviewCanBuy(pTicketM, milestoneCurrency)}
                onBuy={() => bulk(purchaseTry.tryBuyTicketMultiplier, pTicketM)}
                buttonLabel={upgradeBuyButtonLabel(pTicketM)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-sm font-bold text-amber-400" aria-hidden>×2</div>
              <UpgradeRow
                flexible
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.doubleTradeValue}</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">+{formatNumber(Decimal.fromNumber(currentTradeValue))} ▲/s</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">+{formatNumber(Decimal.fromNumber(nextTradeValue))} ▲/s</span>
                      <span className="text-amber-500/60 text-[10px]">{t.upgradesPage.perTrade}</span>
                    </div>
                  </div>
                }
                sublabel={`×2: ${upgradeTicketTradeDoublerRank}`}
                cost={upgradeBuyCostTitle(pTicketT)}
                canBuy={upgradePreviewCanBuy(pTicketT, milestoneCurrency)}
                onBuy={() => bulk(purchaseTry.tryBuyTicketTradeDoubler, pTicketT)}
                buttonLabel={upgradeBuyButtonLabel(pTicketT)}
              />
            </div>
          </div>
        )}

        {tab === "geradores" && !unlockedLines[upgradeLine - 1] && (() => {
          const req = getLineUnlockRequirement(upgradeLine);
          return (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <p className="text-sm text-zinc-400">{t.upgradesPage.lineLockedDesc}</p>
              {req && (
                <p className="text-xs text-zinc-500">{t.upgradesPage.requiresLineResource(req.prevLine, formatNumber(req.threshold))}</p>
              )}
            </div>
          );
        })()}

        {tab === "geradores" && unlockedLines[upgradeLine - 1] && (
          <ul className="space-y-2">
            {(() => {
              const lineColor = getLineColor(upgradeLine);
              const lineClasses = LINE_COLOR_CLASSES[lineColor];
              const lineRank = upgradeLineProductionDoublerRanks[upgradeLine] ?? 0;
              const currentLineMult = 2 ** lineRank;
              const nextLineMult = 2 ** (lineRank + 1);
              return (
                <li className="flex items-center gap-2">
                  <div className={`btn-3d ${lineClasses.btn3d} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${lineClasses.bg} text-[10px] font-bold text-white`} aria-hidden>
                    L{upgradeLine}
                  </div>
                  <UpgradeRow
                    flexible
                    label={
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.doubleProductionLine}</span>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                          <span className="text-zinc-400">×{formatNumber(Decimal.fromNumber(currentLineMult))}</span>
                          <span className="text-violet-400/80">→</span>
                          <span className="text-white">×{formatNumber(Decimal.fromNumber(nextLineMult))}</span>
                        </div>
                      </div>
                    }
                    sublabel={`${lineRank}`}
                    cost={upgradeBuyCostTitle(pLineProd)}
                    canBuy={upgradePreviewCanBuy(pLineProd, milestoneCurrency)}
                    onBuy={() => bulk((s) => purchaseTry.tryBuyLineProductionDoubler(s, upgradeLine), pLineProd)}
                    buttonLabel={upgradeBuyButtonLabel(pLineProd)}
                  />
                  {(() => {
                    const costHalfRank = upgradeLineCostHalfRanks[upgradeLine] ?? 0;
                    const currentDiv = 2 ** costHalfRank;
                    const nextDiv = 2 ** (costHalfRank + 1);
                    return (
                      <UpgradeRow
                        flexible
                        label={
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.halfCostLine}</span>
                            <div className="flex items-center gap-1.5 text-sm font-medium">
                              <span className="text-zinc-400">÷{formatNumber(Decimal.fromNumber(currentDiv))}</span>
                              <span className="text-violet-400/80">→</span>
                              <span className="text-white">÷{formatNumber(Decimal.fromNumber(nextDiv))}</span>
                            </div>
                          </div>
                        }
                        sublabel={`${costHalfRank}`}
                        cost={upgradeBuyCostTitle(pLineHalf)}
                        canBuy={upgradePreviewCanBuy(pLineHalf, milestoneCurrency)}
                        onBuy={() => bulk((s) => purchaseTry.tryBuyLineCostHalf(s, upgradeLine), pLineHalf)}
                        buttonLabel={upgradeBuyButtonLabel(pLineHalf)}
                      />
                    );
                  })()}
                </li>
              );
            })()}
            {allLineGeneratorIds.map((id) => {
              const def = GENERATOR_DEFS[id];
              const gen = generatorsData.find((g) => g.id === id);
              if (!gen) return null;
              const { gen: generatorNumber, line: lineNum } = parseGeneratorId(id);
              const lineColor = getLineColor(lineNum);
              const colorClasses = LINE_COLOR_CLASSES[lineColor];
              const isOwned = everOwnedSet.has(id);

              if (!isOwned) {
                return (
                  <li key={id} className="flex items-center gap-2 opacity-60">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-500 bg-zinc-800/60 text-sm font-bold text-zinc-400">
                      {generatorNumber}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center rounded-lg border border-dashed border-zinc-500 bg-zinc-900/40 px-3 py-2.5">
                      <span className="text-xs text-zinc-400">{t.upgradesPage.genLockedDesc}</span>
                    </div>
                  </li>
                );
              }

              const maxCycleRank = getMaxCycleSpeedRank(def.cycleTimeSeconds);
              const cycleRank = gen.upgradeCycleSpeedRank;
              const prodRank = gen.upgradeProductionRank;
              const costCycle =
                cycleRank < maxCycleRank
                  ? getUpgradeCostCycleSpeed(generatorNumber, cycleRank)
                  : null;
              const costProd = getUpgradeCostProduction(generatorNumber, prodRank);
              const pCycle = computeCycleSpeedBulkSpend(bulkInput, id, upgradeBuyMode);
              const pProd = computeProductionBulkSpend(bulkInput, id, upgradeBuyMode);
              const pCritC = computeCritChanceBulkSpend(bulkInput, id, upgradeBuyMode);
              const pCritM = computeCritMultiplierBulkSpend(bulkInput, id, upgradeBuyMode);
              const canBuyCycle = upgradePreviewCanBuy(pCycle, milestoneCurrency);
              const canBuyProd = upgradePreviewCanBuy(pProd, milestoneCurrency);
              const currentCycle = getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, cycleRank);
              const nextCycle = cycleRank < maxCycleRank
                ? getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, cycleRank + 1)
                : currentCycle;
              const lineDoublerRank = upgradeLineProductionDoublerRanks[lineNum] ?? 0;
              const currentProd = getEffectiveProductionPerCycle(def.productionPerCycle, prodRank, upgradeGlobalProductionDoublerRank, lineDoublerRank);
              const nextProd = getEffectiveProductionPerCycle(def.productionPerCycle, prodRank + 1, upgradeGlobalProductionDoublerRank, lineDoublerRank);

              return (
                <li key={id} className="flex items-center gap-2">
                  <div className={`btn-3d ${colorClasses.btn3d} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClasses.bg} text-sm font-bold text-white`} title={def.name}>
                    {generatorNumber}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    <UpgradeRow
                      flexible
                      label={
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.cycleTime}</span>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="text-zinc-400">{formatTime(currentCycle)}</span>
                            {cycleRank < maxCycleRank && (
                              <>
                                <span className="text-violet-400/80">→</span>
                                <span className="text-white">{formatTime(nextCycle)}</span>
                              </>
                            )}
                          </div>
                        </div>
                      }
                      sublabel={maxCycleRank > 0 ? `${cycleRank}/${maxCycleRank}` : `${cycleRank}`}
                      cost={upgradeBuyCostTitle(pCycle) || (costCycle ? `◆ ${formatNumber(costCycle)}` : "")}
                      canBuy={canBuyCycle}
                      onBuy={() => bulk((s) => purchaseTry.tryBuyCycleSpeed(s, id), pCycle)}
                      buttonLabel={upgradeBuyButtonLabel(pCycle)}
                      maxed={cycleRank >= maxCycleRank}
                      maxedLabel={t.upgradesPage.maxed}
                    />
                    <UpgradeRow
                      flexible
                      label={
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.productionPerCycle}</span>
                          <div className="flex items-center gap-1.5 text-sm font-medium">
                            <span className="text-zinc-400">{formatNumber(currentProd)}</span>
                            <span className="text-violet-400/80">→</span>
                            <span className="text-white">{formatNumber(nextProd)}</span>
                          </div>
                        </div>
                      }
                      sublabel={`${prodRank}`}
                      cost={upgradeBuyCostTitle(pProd) || `◆ ${formatNumber(costProd)}`}
                      canBuy={canBuyProd}
                      onBuy={() => bulk((s) => purchaseTry.tryBuyProduction(s, id), pProd)}
                      buttonLabel={upgradeBuyButtonLabel(pProd)}
                    />
                    {(() => {
                      const critRank = gen.upgradeCritChanceRank;
                      const critMultRank = gen.upgradeCritMultiplierRank;
                      const costCrit = critRank < MAX_CRIT_CHANCE_RANK
                        ? getUpgradeCostCritChance(generatorNumber, critRank)
                        : null;
                      const costCritMult = getUpgradeCostCritMultiplier(generatorNumber, critMultRank);
                      const canBuyCrit = upgradePreviewCanBuy(pCritC, milestoneCurrency);
                      const canBuyCritMult = upgradePreviewCanBuy(pCritM, milestoneCurrency);
                      const currentChance = getCritChance(critRank);
                      const nextChance = getCritChance(critRank + 1);
                      const currentCritMult = getCritMultiplier(critMultRank);
                      const nextCritMult = getCritMultiplier(critMultRank + 1);
                      return (
                        <>
                          <UpgradeRow
                            flexible
                            label={
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.critChance}</span>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                  <span className="text-zinc-400">{(currentChance * 100).toFixed(1)}%</span>
                                  {critRank < MAX_CRIT_CHANCE_RANK && (
                                    <>
                                      <span className="text-violet-400/80">→</span>
                                      <span className="text-white">{(nextChance * 100).toFixed(1)}%</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            }
                            sublabel={MAX_CRIT_CHANCE_RANK > 0 ? `${critRank}/${MAX_CRIT_CHANCE_RANK}` : `${critRank}`}
                            cost={upgradeBuyCostTitle(pCritC) || (costCrit ? `◆ ${formatNumber(costCrit)}` : "")}
                            canBuy={canBuyCrit}
                            onBuy={() => bulk((s) => purchaseTry.tryBuyCritChance(s, id), pCritC)}
                            buttonLabel={upgradeBuyButtonLabel(pCritC)}
                            maxed={critRank >= MAX_CRIT_CHANCE_RANK}
                            maxedLabel={t.upgradesPage.maxed}
                          />
                          <UpgradeRow
                            flexible
                            label={
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.critEfficiency}</span>
                                <div className="flex items-center gap-1.5 text-sm font-medium">
                                  <span className="text-zinc-400">×{formatNumber(Decimal.fromNumber(currentCritMult))}</span>
                                  <span className="text-violet-400/80">→</span>
                                  <span className="text-white">×{formatNumber(Decimal.fromNumber(nextCritMult))}</span>
                                </div>
                              </div>
                            }
                            sublabel={`${critMultRank}`}
                            cost={upgradeBuyCostTitle(pCritM) || `◆ ${formatNumber(costCritMult)}`}
                            canBuy={canBuyCritMult}
                            onBuy={() => bulk((s) => purchaseTry.tryBuyCritMultiplier(s, id), pCritM)}
                            buttonLabel={upgradeBuyButtonLabel(pCritM)}
                          />
                        </>
                      );
                    })()}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
