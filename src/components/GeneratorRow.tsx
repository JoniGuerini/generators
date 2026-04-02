import { useRef, useState, useCallback, memo } from "react";
import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { useBuyMode } from "@/contexts/BuyModeContext";
import { GENERATOR_DEFS, parseGeneratorId, getLineColor, LINE_COLOR_CLASSES, getUnlockRequirement } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getEffectiveGeneratorCost,
  getMilestoneRewardMultiplier,
} from "@/engine/upgrades";
import { formatNumber, formatTime } from "@/utils/format";
import { useSmoothCycleProgress } from "@/hooks/useSmoothCycleProgress";
import {
  getCurrentMilestoneCount,
  getProgressTowardTarget,
  getNextMilestoneThresholdFromTarget,
  getNextMilestoneFromQuantity,
  getCoinsFromClaiming,
} from "@/utils/milestones";
import { getBuyAmount, getNextGeneratorUnlockTarget, isLastGeneratorInLine } from "@/utils/computeGeneratorPurchase";
import { useHoldToBuyGenerator } from "@/hooks/useHoldToBuyGenerator";
import { useT } from "@/locale";

interface GeneratorRowProps {
  id: GeneratorId;
}

/** Igualdade ignorando cycleProgress — o RAF da barra não precisa de re-render a cada TICK. */
function genEqualIgnoreCycleProgress(
  a: import("@/store/gameState").GeneratorState,
  b: import("@/store/gameState").GeneratorState
): boolean {
  return (
    a.id === b.id &&
    a.quantity.equals(b.quantity) &&
    a.cycleStartTime === b.cycleStartTime &&
    a.everOwned === b.everOwned &&
    a.claimedMilestoneIndex === b.claimedMilestoneIndex &&
    a.currentMilestoneTargetIndex === b.currentMilestoneTargetIndex &&
    a.upgradeCycleSpeedRank === b.upgradeCycleSpeedRank &&
    a.upgradeProductionRank === b.upgradeProductionRank
  );
}

const TOOLTIP_ESTIMATED_WIDTH = 180;
const TOOLTIP_GAP = 6;

export const GeneratorRow = memo(function GeneratorRow({ id }: GeneratorRowProps) {
  const def = GENERATOR_DEFS[id];
  const { buyMode } = useBuyMode();
  const t = useT();
  const {
    gen,
    lineResource,
    ticketCurrency,
    upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank,
    upgradeGlobalProductionDoublerRank,
    upgradeLineProductionDoublerRank,
    prevGenQuantity,
    canBuy,
    maxAffordable,
    isUnlocked,
    unlockPrevQty,
  } = useGameSelector((state) => {
    const generator = state.generators.find((g) => g.id === id);
    if (!generator) return { gen: null } as any;

    const genLine = parseGeneratorId(id).line;
    const lineResource = state.lineResources[genLine] ?? Decimal.dZero;
    const ticketCurrency = state.ticketCurrency;
    const upgradeGeneratorCostHalfRank = state.upgradeGeneratorCostHalfRank;
    const prevGenQuantity = def.produces !== "base" 
      ? state.generators.find((g) => g.id === def.produces)?.quantity 
      : undefined;

    const effectiveCost = getEffectiveGeneratorCost(def.cost, upgradeGeneratorCostHalfRank);
    const effectiveCostPrev = getEffectiveGeneratorCost(def.costPreviousGenerator, upgradeGeneratorCostHalfRank);

    // Calc max affordable
    const ticketCostPerUnit = parseGeneratorId(id).line;
    const maxByBase = lineResource.div(effectiveCost).floor();
    const maxByTickets = ticketCurrency.div(ticketCostPerUnit).floor();
    let maxByPrev = Decimal.fromNumber(Number.MAX_SAFE_INTEGER);
    if (effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base" && prevGenQuantity) {
      maxByPrev = prevGenQuantity.div(effectiveCostPrev).floor();
    }
    
    let maxAffordable = maxByBase;
    if (maxByTickets.lt(maxAffordable)) maxAffordable = maxByTickets;
    if (maxByPrev.lt(maxAffordable)) maxAffordable = maxByPrev;

    const hasEnoughPrev = effectiveCostPrev.lte(Decimal.dZero) || def.produces === "base" || (prevGenQuantity ? Decimal.gte(prevGenQuantity, effectiveCostPrev) : false);

    const unlock = getUnlockRequirement(id);
    const unlockPrevQty = unlock.previousGenId
      ? state.generators.find((g) => g.id === unlock.previousGenId)?.quantity ?? Decimal.dZero
      : Decimal.dZero;
    const isUnlocked = generator.everOwned || unlock.required.lte(Decimal.dZero) || unlockPrevQty.gte(unlock.required);

    const canBuy = isUnlocked && Decimal.gte(lineResource, effectiveCost) && Decimal.gte(ticketCurrency, Decimal.fromNumber(ticketCostPerUnit)) && hasEnoughPrev;

    return {
      gen: generator,
      lineResource,
      ticketCurrency,
      upgradeGeneratorCostHalfRank,
      upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
      upgradeGlobalProductionDoublerRank: state.upgradeGlobalProductionDoublerRank,
      upgradeLineProductionDoublerRank: state.upgradeLineProductionDoublerRanks[genLine] ?? 0,
      prevGenQuantity,
      canBuy,
      maxAffordable,
      isUnlocked,
      unlockPrevQty,
    };
  }, (a, b) => {
    if (!a.gen || !b.gen) return a.gen === b.gen;
    return (
      genEqualIgnoreCycleProgress(a.gen, b.gen) &&
      a.lineResource.equals(b.lineResource) &&
      a.ticketCurrency.equals(b.ticketCurrency) &&
      a.upgradeGeneratorCostHalfRank === b.upgradeGeneratorCostHalfRank &&
      a.upgradeMilestoneDoublerRank === b.upgradeMilestoneDoublerRank &&
      a.upgradeGlobalProductionDoublerRank === b.upgradeGlobalProductionDoublerRank &&
      a.upgradeLineProductionDoublerRank === b.upgradeLineProductionDoublerRank &&
      a.canBuy === b.canBuy &&
      a.isUnlocked === b.isUnlocked &&
      a.unlockPrevQty.equals(b.unlockPrevQty) &&
      a.maxAffordable.equals(b.maxAffordable) &&
      (a.prevGenQuantity && b.prevGenQuantity
        ? a.prevGenQuantity.equals(b.prevGenQuantity)
        : a.prevGenQuantity === b.prevGenQuantity)
    );
  });
  const dispatch = useGameDispatch();
  const holdBuy = useHoldToBuyGenerator(id);
  const milestoneTriggerRef = useRef<HTMLDivElement>(null);
  const buyTriggerRef = useRef<HTMLDivElement>(null);
  const [milestoneTooltipSide, setMilestoneTooltipSide] = useState<"left" | "right">("right");
  const [buyTooltipSide, setBuyTooltipSide] = useState<"left" | "right">("right");
  const [justClaimed, setJustClaimed] = useState(false);
  const claimTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showBuyTooltip, setShowBuyTooltip] = useState(false);
  const buyTooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateTooltipSide = useCallback((ref: React.RefObject<HTMLDivElement | null>, setSide: (s: "left" | "right") => void) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceRight = typeof window !== "undefined" ? window.innerWidth - (rect.right + TOOLTIP_GAP) : TOOLTIP_ESTIMATED_WIDTH;
    setSide(spaceRight >= TOOLTIP_ESTIMATED_WIDTH ? "right" : "left");
  }, []);

  const showAsUnaffordableRef = useRef(false);
  const onBuyMouseEnter = useCallback(() => {
    updateTooltipSide(buyTriggerRef, setBuyTooltipSide);
    if (showAsUnaffordableRef.current) {
      buyTooltipTimerRef.current = setTimeout(() => setShowBuyTooltip(true), 1000);
    }
  }, [updateTooltipSide]);

  const onBuyMouseLeave = useCallback(() => {
    if (buyTooltipTimerRef.current) {
      clearTimeout(buyTooltipTimerRef.current);
      buyTooltipTimerRef.current = null;
    }
    setShowBuyTooltip(false);
  }, []);

  const cycleTimeSecForBar = gen
    ? getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, gen.upgradeCycleSpeedRank)
    : 1;
  const showCycleTime = cycleTimeSecForBar >= 1;
  const hasQuantityForBar = gen ? (Decimal.gt(gen.quantity, Decimal.dZero) || gen.manualCycleActive) : false;
  const progressBarRef = useSmoothCycleProgress(
    gen?.cycleStartTime ?? 0,
    cycleTimeSecForBar,
    !!gen && showCycleTime && hasQuantityForBar,
    gen?.cycleProgress ?? 0
  );

  if (!gen) return null;

  const quantity = gen.quantity;
  const hasQuantity = Decimal.gt(quantity, Decimal.dZero);
  const cycleTimeSec = getEffectiveCycleTimeSeconds(
    def.cycleTimeSeconds,
    gen.upgradeCycleSpeedRank
  );
  const productionPerCycle = getEffectiveProductionPerCycle(
    def.productionPerCycle,
    gen.upgradeProductionRank,
    upgradeGlobalProductionDoublerRank,
    upgradeLineProductionDoublerRank
  );
  const effectiveCost = getEffectiveGeneratorCost(
    def.cost,
    upgradeGeneratorCostHalfRank
  );
  const effectiveCostPrev = getEffectiveGeneratorCost(
    def.costPreviousGenerator,
    upgradeGeneratorCostHalfRank
  );
  const producedPerCycle = productionPerCycle.mul(quantity);
  const producedPerSecond =
    cycleTimeSec > 0 ? producedPerCycle.div(cycleTimeSec) : Decimal.dZero;
  const isLastGenerator = isLastGeneratorInLine(id);
  const nextGenCost = buyMode === "proximo"
    ? getNextGeneratorUnlockTarget(id)
    : null;
  const buyAmount = getBuyAmount(buyMode, maxAffordable, quantity, nextGenCost);
  const amountNeededForMarco =
    buyMode === "marco"
      ? getNextMilestoneFromQuantity(quantity).sub(quantity).floor()
      : null;
  const canReachMarco =
    amountNeededForMarco == null || maxAffordable.gte(amountNeededForMarco);
  const amountNeededForProximo =
    buyMode === "proximo" && nextGenCost != null
      ? nextGenCost.sub(quantity).ceil()
      : null;
  const alreadyHasEnoughForNext =
    amountNeededForProximo != null && amountNeededForProximo.lte(Decimal.dZero);
  const canReachProximo =
    amountNeededForProximo == null || alreadyHasEnoughForNext || maxAffordable.gte(amountNeededForProximo);
  const showAsUnaffordable = !canBuy || (buyMode === "marco" && !canReachMarco) || (buyMode === "proximo" && !canReachProximo && !alreadyHasEnoughForNext);
  showAsUnaffordableRef.current = showAsUnaffordable;
  const canClickBuy = canBuy && buyAmount >= 1 && (buyMode !== "marco" || canReachMarco) && (buyMode !== "proximo" || canReachProximo);

  const amountForDisplay =
    buyMode === "marco" && amountNeededForMarco != null
      ? Math.min(amountNeededForMarco.toNumber(), Number.MAX_SAFE_INTEGER)
      : buyMode === "proximo" && amountNeededForProximo != null && amountNeededForProximo.gt(Decimal.dZero)
        ? Math.min(amountNeededForProximo.toNumber(), Number.MAX_SAFE_INTEGER)
        : buyAmount;

  const totalCost = buyAmount >= 1 ? effectiveCost.mul(buyAmount) : Decimal.dZero;
  const amountForCostCalc =
    buyMode === "marco" && amountNeededForMarco != null && amountNeededForMarco.gte(Decimal.dOne)
      ? amountNeededForMarco
      : buyMode === "proximo" && amountNeededForProximo != null && amountNeededForProximo.gt(Decimal.dZero)
        ? amountNeededForProximo
        : null;
  const costForDisplay =
    amountForCostCalc != null
      ? effectiveCost.mul(amountForCostCalc)
      : buyAmount >= 1 ? totalCost : effectiveCost;
  const prevCostForDisplay =
    amountForCostCalc != null && effectiveCostPrev.gt(Decimal.dZero)
      ? effectiveCostPrev.mul(amountForCostCalc)
      : buyAmount >= 1 && effectiveCostPrev.gt(Decimal.dZero)
        ? effectiveCostPrev.mul(buyAmount)
        : effectiveCostPrev;
  /* Quando % resulta em 0 (não pode comprar nenhum), mostramos valor padrão: custo de 1 unidade, sem número na quantidade */
  const displayCost = amountForDisplay >= 1 ? costForDisplay : effectiveCost;
  const displayPrevCost = prevCostForDisplay;
  const hasPrevCost = effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base";
  const ticketCostPerUnit = parseGeneratorId(id).line;
  const ticketsRequired = (amountForDisplay >= 1 ? amountForDisplay : 1) * ticketCostPerUnit;
  const lacksBase = lineResource.lt(displayCost);
  const lacksTickets = ticketCurrency.lt(Decimal.fromNumber(ticketsRequired));
  const lacksPrev = hasPrevCost && (
    prevGenQuantity
      ? prevGenQuantity.lt(displayPrevCost)
      : true
  );

  const currentMilestoneCount = getCurrentMilestoneCount(quantity);
  const pendingMilestones = Math.max(0, currentMilestoneCount - gen.claimedMilestoneIndex);
  const { line: lineNum, gen: generatorNumber } = parseGeneratorId(id);
  const lineColor = getLineColor(lineNum);
  const colorClasses = LINE_COLOR_CLASSES[lineColor];
  const baseCoins = getCoinsFromClaiming(generatorNumber, gen.claimedMilestoneIndex, currentMilestoneCount);
  const milestoneMultiplier = getMilestoneRewardMultiplier(upgradeMilestoneDoublerRank);
  const coinsToClaim = milestoneMultiplier > 1 ? baseCoins.mul(milestoneMultiplier) : baseCoins;
  const progressToNext = getProgressTowardTarget(quantity, gen.currentMilestoneTargetIndex);
  const nextThreshold = getNextMilestoneThresholdFromTarget(gen.currentMilestoneTargetIndex);
  const canClaim = pendingMilestones > 0;
  const isLocked = !gen.everOwned;

  const unlock = getUnlockRequirement(id);

  if (isLocked && !isUnlocked) {
    return (
      <div className="flex h-[40px] min-w-0 flex-nowrap items-center">
        <div className="flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-md border-2 border-dashed border-zinc-600 bg-zinc-800/60">
          <span className="flex items-center gap-1.5 text-center text-sm font-medium text-zinc-500">
            <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${colorClasses.bg} text-[9px] font-bold text-white`}>
              {unlock.previousGenId ? parseGeneratorId(unlock.previousGenId).gen : ""}
            </span>
            {formatNumber(unlockPrevQty)} / {formatNumber(unlock.required)}
          </span>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex h-[40px] min-w-0 flex-nowrap items-center gap-2">
        <button
          type="button"
          onClick={() => dispatch({ type: "MANUAL_CYCLE", id })}
          className={`btn-3d ${colorClasses.btn3d} flex h-[40px] w-[120px] shrink-0 cursor-pointer items-center justify-center rounded-md ${colorClasses.bg} text-sm font-bold text-white active:translate-y-[2px]`}
          aria-label={def.name}
          title={t.generator.clickToProduce}
        >
          {generatorNumber}
        </button>
        <div className="flex h-[40px] min-w-0 flex-1 items-center justify-center rounded-md border-2 border-dashed border-zinc-600 bg-zinc-800/60">
          <span className="text-center text-sm font-medium text-zinc-500">
            {t.generator.buyToUnlock}
          </span>
        </div>
        <div
          ref={buyTriggerRef}
          onMouseEnter={onBuyMouseEnter}
          onMouseLeave={onBuyMouseLeave}
          className={`buy-card-clickable group/buy relative flex h-[40px] w-[160px] shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium text-white ${!showAsUnaffordable ? "buy-card--affordable" : "buy-card--unaffordable"}`}
        >
          {showAsUnaffordable && (
            <div
              className={`pointer-events-none absolute top-1/2 z-20 w-max min-w-0 -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 shadow-xl transition-opacity duration-150 ${
                showBuyTooltip ? "opacity-100" : "opacity-0"
              } ${buyTooltipSide === "right" ? "left-full ml-1.5" : "right-full mr-1.5"}`}
              role="tooltip"
            >
              {buyTooltipSide === "right" ? (
                <>
                  <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-r-zinc-600" aria-hidden />
                  <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-800" aria-hidden />
                </>
              ) : (
                <>
                  <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-l-zinc-600" aria-hidden />
                  <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800" aria-hidden />
                </>
              )}
              <div className="flex flex-col gap-2">
                <div className="flex flex-row items-stretch gap-2">
                  <div className="flex w-[7rem] flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`${colorClasses.textVivid} text-sm`} aria-hidden>●</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.resource}</span>
                    </div>
                    <span className={`truncate text-sm font-bold tabular-nums ${lacksBase ? "text-red-400" : "text-white"}`}>
                      {formatNumber(displayCost)}
                    </span>
                  </div>
                  <div className="flex w-[7rem] flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-amber-400 text-xs" aria-hidden>▲</span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.tickets}</span>
                    </div>
                    <span className={`truncate text-sm font-bold tabular-nums ${lacksTickets ? "text-red-400" : "text-amber-200"}`}>
                      {formatNumber(Decimal.fromNumber(ticketsRequired))}
                    </span>
                  </div>
                </div>
                {hasPrevCost && def.produces !== "base" && (
                  <div className="flex w-full flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${colorClasses.bg} text-[8px] font-bold text-white`} aria-hidden>
                        {def.produces !== "base" ? parseGeneratorId(def.produces).gen : ""}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.generator}</span>
                    </div>
                    <span className={`truncate text-sm font-bold tabular-nums ${lacksPrev ? "text-red-400" : "text-white"}`}>
                      {formatNumber(displayPrevCost)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <span className="pointer-events-none shrink-0">
            {t.generator.buy}{amountForDisplay > 1 ? <> <span className="tabular-nums">{formatNumber(Decimal.fromNumber(amountForDisplay))}</span></> : null}
          </span>
          <button
            type="button"
            onPointerDown={holdBuy.onPointerDown}
            onPointerUp={holdBuy.onPointerUp}
            onPointerCancel={holdBuy.onPointerCancel}
            onLostPointerCapture={holdBuy.onLostPointerCapture}
            onKeyDown={holdBuy.onKeyDown}
            disabled={!canClickBuy}
            title={
              !showAsUnaffordable
                ? t.generator.holdToBuy
                : `Custo: ● ${formatNumber(displayCost)} · ▲ ${formatNumber(Decimal.fromNumber(ticketsRequired))}${hasPrevCost && def.produces !== "base" ? ` · ${formatNumber(displayPrevCost)} ${GENERATOR_DEFS[def.produces].name}` : ""}`
            }
            className="absolute inset-0 touch-manipulation rounded-md outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:ring-0"
            aria-label={t.generator.buyUnlockAria}
          />
        </div>
      </div>
    );
  }

  const canManualCycle = !hasQuantity && gen.everOwned && !gen.manualCycleActive;

  return (
    <div className="flex h-[40px] min-w-0 flex-nowrap items-center gap-2">
      {canManualCycle ? (
        <button
          type="button"
          onClick={() => dispatch({ type: "MANUAL_CYCLE", id })}
          className={`btn-3d ${colorClasses.btn3d} flex h-[40px] w-[40px] shrink-0 cursor-pointer items-center justify-center rounded-md ${colorClasses.bg} text-sm font-bold text-white active:translate-y-[2px]`}
          aria-label={def.name}
          title={t.generator.clickToProduce}
        >
          {generatorNumber}
        </button>
      ) : (
        <div
          className={`${colorClasses.btn3d} flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md ${colorClasses.bg} text-sm font-bold text-white`}
          aria-label={def.name}
        >
          {generatorNumber}
        </div>
      )}

      {/* Barra de progresso para próximo marco (10, 100, 1k…) — clicável para resgatar */}
      <div
        ref={milestoneTriggerRef}
        onMouseEnter={() => updateTooltipSide(milestoneTriggerRef, setMilestoneTooltipSide)}
        className="group relative h-[40px] w-[72px] shrink-0 overflow-visible rounded-md"
      >
        {/* Tooltip ao lado do card (direita ou esquerda conforme espaço) */}
        <div
          className={`pointer-events-none absolute top-1/2 z-20 min-w-[160px] -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 shadow-xl transition-opacity duration-150 ${
            justClaimed ? "opacity-0" : "opacity-0 group-hover:opacity-100"
          } ${milestoneTooltipSide === "right" ? "left-full ml-1.5" : "right-full mr-1.5"}`}
          role="tooltip"
        >
          {milestoneTooltipSide === "right" ? (
            <>
              <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-r-zinc-600" aria-hidden />
              <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-800" aria-hidden />
            </>
          ) : (
            <>
              <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-l-zinc-600" aria-hidden />
              <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800" aria-hidden />
            </>
          )}
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between gap-4 whitespace-nowrap">
              <span className="text-xs text-zinc-400">{t.generator.currentQty}</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {formatNumber(quantity)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 whitespace-nowrap">
              <span className="text-xs text-zinc-400">{t.generator.nextMilestone}</span>
              <span className="text-sm font-semibold tabular-nums text-purple-300">
                {formatNumber(nextThreshold)}
              </span>
            </div>
            {canClaim && (
              <div className="mt-0.5 border-t border-zinc-600 pt-1.5 text-center text-xs text-purple-300">
                {t.generator.claimMilestones(pendingMilestones, formatNumber(coinsToClaim))}
              </div>
            )}
          </div>
        </div>
        {canClaim && (
          <div
            className="btn-3d--zinc absolute -right-1 -top-1.5 z-10 flex h-4 min-w-[14px] items-center justify-center rounded bg-white px-1"
            aria-hidden
          >
            <span className="text-[10px] font-bold tabular-nums text-purple-700">
              {formatNumber(coinsToClaim)}
            </span>
          </div>
        )}
        <div className="milestone-bar btn-3d--purple-dark absolute inset-0 overflow-hidden rounded-md bg-purple-900">
          <div
            className="absolute inset-y-0 left-0 rounded-md bg-purple-600"
            style={{ width: `${progressToNext * 100}%` }}
          />
          <button
            type="button"
            onClick={() => {
              if (!canClaim) return;
              dispatch({ type: "CLAIM_MILESTONES", id });
              setJustClaimed(true);
              if (claimTimerRef.current) clearTimeout(claimTimerRef.current);
              claimTimerRef.current = setTimeout(() => setJustClaimed(false), 400);
            }}
            disabled={!canClaim}
            className="absolute inset-0 flex flex-col items-center justify-center gap-0 px-1 text-center outline-none focus:outline-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100 enabled:cursor-pointer enabled:active:opacity-90"
          >
            <span className="whitespace-nowrap text-sm font-semibold tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.9)]">
              {formatNumber(quantity)}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de progresso do gerador — 40px; ciclo < 1s: sempre 100% verde (rápido demais) */}
      <div className="relative flex h-[40px] min-w-0 flex-1">
        <div className="btn-3d--dark relative h-[40px] w-full overflow-hidden rounded-md bg-[#0D0D0D]">
          <div
            ref={showCycleTime ? progressBarRef : undefined}
            className={`absolute inset-y-0 left-0 ${
              showCycleTime
                ? "bg-zinc-600"
                : "w-full bg-green-600"
            }`}
          />
          {showCycleTime && (
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
              <span className="text-sm font-medium tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">
                {formatTime(cycleTimeSec)}
              </span>
            </div>
          )}
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {hasQuantity ? (
              <>
                <span className="text-sm font-medium tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">
                  +{formatNumber(showCycleTime ? producedPerCycle : producedPerSecond)}
                  {!showCycleTime && <span className="ml-0.5">/s</span>}
                </span>
                {def.produces === "base" ? (
                  <span className={`${colorClasses.textVivid} text-sm leading-none`} title="recurso" aria-hidden>
                    ●
                  </span>
                ) : (
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${colorClasses.bg} text-[10px] font-bold text-white`} title={GENERATOR_DEFS[def.produces].name}>
                    {parseGeneratorId(def.produces).gen}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-white/70">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Comprar: tooltip de custo quando sem recurso; no modo "marco", cinza se não der para atingir o marco. */}
      <div
        ref={buyTriggerRef}
        onMouseEnter={onBuyMouseEnter}
        onMouseLeave={onBuyMouseLeave}
        className={`buy-card-clickable group/buy relative flex h-[40px] w-[160px] shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium text-white ${!showAsUnaffordable ? "buy-card--affordable" : "buy-card--unaffordable"}`}
      >
        {showAsUnaffordable && (
          <div
            className={`pointer-events-none absolute top-1/2 z-20 w-max min-w-0 -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 shadow-xl transition-opacity duration-150 ${
              showBuyTooltip ? "opacity-100" : "opacity-0"
            } ${buyTooltipSide === "right" ? "left-full ml-1.5" : "right-full mr-1.5"}`}
            role="tooltip"
          >
            {buyTooltipSide === "right" ? (
              <>
                <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-r-zinc-600" aria-hidden />
                <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-800" aria-hidden />
              </>
            ) : (
              <>
                <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[7px] border-transparent border-l-zinc-600" aria-hidden />
                <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800" aria-hidden />
              </>
            )}
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-stretch gap-2">
                <div className="flex w-[7rem] flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`${colorClasses.textVivid} text-sm`} aria-hidden>●</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.resource}</span>
                  </div>
                  <span className={`truncate text-sm font-bold tabular-nums ${lacksBase ? "text-red-400" : "text-white"}`}>
                    {formatNumber(displayCost)}
                  </span>
                </div>
                <div className="flex w-[7rem] flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-amber-400 text-xs" aria-hidden>▲</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.tickets}</span>
                  </div>
                  <span className={`truncate text-sm font-bold tabular-nums ${lacksTickets ? "text-red-400" : "text-amber-200"}`}>
                    {formatNumber(Decimal.fromNumber(ticketsRequired))}
                  </span>
                </div>
              </div>
              {hasPrevCost && def.produces !== "base" && (
                <div className="flex w-full flex-col gap-0.5 rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${colorClasses.bg} text-[8px] font-bold text-white`} aria-hidden>
                      {def.produces !== "base" ? parseGeneratorId(def.produces).gen : ""}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">{t.generator.generator}</span>
                  </div>
                  <span className={`truncate text-sm font-bold tabular-nums ${lacksPrev ? "text-red-400" : "text-white"}`}>
                    {formatNumber(displayPrevCost)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <span className="pointer-events-none shrink-0">
          {buyMode === "proximo" && isLastGenerator
            ? t.generator.buy
            : buyMode === "proximo" && alreadyHasEnoughForNext
              ? t.generator.ready
              : <>{t.generator.buy}{amountForDisplay > 1 ? <> <span className="tabular-nums">{formatNumber(Decimal.fromNumber(amountForDisplay))}</span></> : null}</>}
        </span>
        <button
          type="button"
          onPointerDown={holdBuy.onPointerDown}
          onPointerUp={holdBuy.onPointerUp}
          onPointerCancel={holdBuy.onPointerCancel}
          onLostPointerCapture={holdBuy.onLostPointerCapture}
          onKeyDown={holdBuy.onKeyDown}
          disabled={!canClickBuy}
          title={
            !showAsUnaffordable
              ? t.generator.holdToBuy
              : `Custo: ● ${formatNumber(displayCost)} · ▲ ${formatNumber(Decimal.fromNumber(ticketsRequired))}${hasPrevCost && def.produces !== "base" ? ` · ${formatNumber(displayPrevCost)} ${GENERATOR_DEFS[def.produces].name}` : ""}`
          }
          className="absolute inset-0 touch-manipulation rounded-md outline-none select-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label={t.generator.buyGeneratorAria}
        />
      </div>
    </div>
  );
});
