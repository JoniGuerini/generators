import { useRef, useState, useCallback } from "react";
import Decimal from "break_eternity.js";
import { useGameState, useGameDispatch } from "@/store/useGameStore";
import { useBuyMode } from "@/contexts/BuyModeContext";
import { GENERATOR_DEFS } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getEffectiveGeneratorCost,
} from "@/engine/upgrades";
import { formatNumber, formatTime } from "@/utils/format";
import { useSmoothCycleProgress } from "@/hooks/useSmoothCycleProgress";
import {
  getCurrentMilestoneCount,
  getProgressTowardTarget,
  getNextMilestoneThresholdFromTarget,
  getCoinsFromClaiming,
} from "@/utils/milestones";
import type { BuyMode } from "@/contexts/BuyModeContext";

function getBuyAmount(mode: BuyMode, maxAffordable: Decimal): number {
  if (mode === "1x") return 1;
  const pct = mode === "1%" ? 0.01 : mode === "10%" ? 0.1 : mode === "50%" ? 0.5 : 1;
  const toBuyDecimal = maxAffordable.mul(pct).floor();
  const n = toBuyDecimal.toNumber();
  if (!Number.isFinite(n) || n < 0) return 0;
  const amount = Math.min(n, Number.MAX_SAFE_INTEGER);
  // Em modos %, se o cálculo deu 0 mas dá pra comprar pelo menos 1, comprar 1
  if (amount === 0 && Decimal.gte(maxAffordable, Decimal.dOne)) return 1;
  return amount;
}

interface GeneratorRowProps {
  id: GeneratorId;
}

const TOOLTIP_ESTIMATED_WIDTH = 180;
const TOOLTIP_GAP = 6;

export function GeneratorRow({ id }: GeneratorRowProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { buyMode } = useBuyMode();
  const def = GENERATOR_DEFS[id];
  const gen = state.generators.find((g) => g.id === id);
  const milestoneTriggerRef = useRef<HTMLDivElement>(null);
  const buyTriggerRef = useRef<HTMLDivElement>(null);
  const [milestoneTooltipSide, setMilestoneTooltipSide] = useState<"left" | "right">("right");
  const [buyTooltipSide, setBuyTooltipSide] = useState<"left" | "right">("right");

  const updateTooltipSide = useCallback((ref: React.RefObject<HTMLDivElement | null>, setSide: (s: "left" | "right") => void) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceRight = typeof window !== "undefined" ? window.innerWidth - (rect.right + TOOLTIP_GAP) : TOOLTIP_ESTIMATED_WIDTH;
    setSide(spaceRight >= TOOLTIP_ESTIMATED_WIDTH ? "right" : "left");
  }, []);

  if (!gen) return null;

  const quantity = gen.quantity;
  const hasQuantity = Decimal.gt(quantity, Decimal.dZero);
  const cycleTimeSec = getEffectiveCycleTimeSeconds(
    def.cycleTimeSeconds,
    gen.upgradeCycleSpeedRank
  );
  const productionPerCycle = getEffectiveProductionPerCycle(
    def.productionPerCycle,
    gen.upgradeProductionRank
  );
  const smoothProgress = useSmoothCycleProgress(
    gen.cycleStartTime,
    cycleTimeSec,
    hasQuantity
  );
  const effectiveCost = getEffectiveGeneratorCost(
    def.cost,
    state.upgradeGeneratorCostHalfRank
  );
  const effectiveCostPrev = getEffectiveGeneratorCost(
    def.costPreviousGenerator,
    state.upgradeGeneratorCostHalfRank
  );
  const maxByBase = state.baseResource.div(effectiveCost).floor();
  const maxByTickets = state.ticketCurrency.floor();
  let maxByPrev = Decimal.fromNumber(Number.MAX_SAFE_INTEGER);
  if (effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base") {
    const prevGen = state.generators.find((g) => g.id === def.produces);
    if (prevGen) {
      maxByPrev = prevGen.quantity.div(effectiveCostPrev).floor();
    }
  }
  let maxAffordable = maxByBase;
  if (maxByTickets.lt(maxAffordable)) maxAffordable = maxByTickets;
  if (maxByPrev.lt(maxAffordable)) maxAffordable = maxByPrev;
  const hasEnoughPrev =
    effectiveCostPrev.lte(Decimal.dZero) ||
    def.produces === "base" ||
    (() => {
      const prevGen = state.generators.find((g) => g.id === def.produces);
      return prevGen ? Decimal.gte(prevGen.quantity, effectiveCostPrev) : false;
    })();
  const canBuy =
    Decimal.gte(state.baseResource, effectiveCost) &&
    Decimal.gte(state.ticketCurrency, Decimal.dOne) &&
    hasEnoughPrev;
  const producedPerCycle = productionPerCycle.mul(quantity);
  const showCycleTime = cycleTimeSec >= 1;
  const producedPerSecond =
    cycleTimeSec > 0 ? producedPerCycle.div(cycleTimeSec) : Decimal.dZero;
  const buyAmount = getBuyAmount(buyMode, maxAffordable);
  const totalCost = buyAmount >= 1 ? effectiveCost.mul(buyAmount) : Decimal.dZero;
  /* Quando % resulta em 0 (não pode comprar nenhum), mostramos valor padrão: custo de 1 unidade, sem número na quantidade */
  const displayCost = buyAmount >= 1 ? totalCost : effectiveCost;
  const displayPrevCost =
    buyAmount >= 1 && effectiveCostPrev.gt(Decimal.dZero)
      ? effectiveCostPrev.mul(buyAmount)
      : effectiveCostPrev;
  const hasPrevCost = effectiveCostPrev.gt(Decimal.dZero) && def.produces !== "base";
  const ticketsRequired = buyAmount >= 1 ? buyAmount : 1;
  const lacksBase = state.baseResource.lt(displayCost);
  const lacksTickets = state.ticketCurrency.lt(Decimal.fromNumber(ticketsRequired));
  const lacksPrev = hasPrevCost && !hasEnoughPrev;

  const currentMilestoneCount = getCurrentMilestoneCount(quantity);
  const pendingMilestones = Math.max(0, currentMilestoneCount - gen.claimedMilestoneIndex);
  const generatorNumber = parseInt(id.replace("generator", ""), 10);
  const coinsToClaim = getCoinsFromClaiming(generatorNumber, gen.claimedMilestoneIndex, currentMilestoneCount);
  const progressToNext = getProgressTowardTarget(quantity, gen.currentMilestoneTargetIndex);
  const nextThreshold = getNextMilestoneThresholdFromTarget(gen.currentMilestoneTargetIndex);
  const canClaim = pendingMilestones > 0;

  return (
    <div className="flex h-[40px] min-w-0 flex-nowrap items-center gap-2">
      {/* Card do número do gerador — 40px (fundo vermelho, número em branco) */}
      <div
        className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-md bg-red-600 text-sm font-bold text-white"
        aria-label={def.name}
      >
        {id.replace("generator", "")}
      </div>

      {/* Barra de progresso para próximo marco (10, 100, 1k…) — clicável para resgatar */}
      <div
        ref={milestoneTriggerRef}
        onMouseEnter={() => updateTooltipSide(milestoneTriggerRef, setMilestoneTooltipSide)}
        className="group relative h-[40px] w-[72px] shrink-0 overflow-visible rounded-md"
      >
        {/* Tooltip ao lado do card (direita ou esquerda conforme espaço) */}
        <div
          className={`pointer-events-none absolute top-1/2 z-20 min-w-[160px] -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${
            milestoneTooltipSide === "right" ? "left-full ml-1.5" : "right-full mr-1.5"
          }`}
          role="tooltip"
        >
          {milestoneTooltipSide === "right" ? (
            <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-800" />
          ) : (
            <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800" />
          )}
          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between gap-4 whitespace-nowrap">
              <span className="text-xs text-zinc-400">Quantidade atual</span>
              <span className="text-sm font-semibold tabular-nums text-white">
                {formatNumber(quantity)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 whitespace-nowrap">
              <span className="text-xs text-zinc-400">Próximo marco</span>
              <span className="text-sm font-semibold tabular-nums text-purple-300">
                {formatNumber(nextThreshold)}
              </span>
            </div>
            {canClaim && (
              <div className="mt-0.5 border-t border-zinc-600 pt-1.5 text-center text-xs text-purple-300">
                Clique para resgatar {pendingMilestones} marco{pendingMilestones !== 1 ? "s" : ""} (◆ {formatNumber(coinsToClaim)})
              </div>
            )}
          </div>
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-md bg-purple-900">
          <div
            className="absolute inset-y-0 left-0 rounded-md bg-purple-600"
            style={{ width: `${progressToNext * 100}%` }}
          />
        </div>
        {canClaim && (
          <div
            className="absolute -right-1 -top-1.5 z-10 flex h-4 min-w-[14px] items-center justify-center rounded bg-white px-1 shadow-md ring-1 ring-purple-900/40"
            aria-hidden
          >
            <span className="text-[10px] font-bold tabular-nums text-purple-700">
              {formatNumber(coinsToClaim)}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => canClaim && dispatch({ type: "CLAIM_MILESTONES", id })}
          disabled={!canClaim}
          className="absolute inset-0 flex flex-col items-center justify-center gap-0 px-1 text-center outline-none focus:outline-none focus-visible:ring-0 disabled:cursor-default disabled:opacity-100 enabled:cursor-pointer enabled:active:opacity-90"
        >
          <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.9)]">
            {formatNumber(quantity)}
          </span>
        </button>
      </div>

      {/* Barra de progresso do gerador — 40px; ciclo < 1s: sempre 100% verde (rápido demais) */}
      <div className="relative flex h-[40px] min-w-0 flex-1">
        <div className="relative h-[40px] w-full overflow-hidden rounded-md bg-black">
          <div
            className={`absolute inset-y-0 left-0 rounded-md will-change-[width] ${
              showCycleTime ? "bg-zinc-600" : "bg-green-600"
            }`}
            style={{
              width: showCycleTime ? `${Math.min(100, smoothProgress * 100)}%` : "100%",
            }}
          />
          {showCycleTime && (
            <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center">
              <span className="text-xs font-medium tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">
                {formatTime(cycleTimeSec)}
              </span>
            </div>
          )}
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
            {hasQuantity ? (
              <>
                <span className="text-xs font-medium tabular-nums text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]">
                  +{formatNumber(showCycleTime ? producedPerCycle : producedPerSecond)}
                  {!showCycleTime && <span className="ml-0.5">/s</span>}
                </span>
                {def.produces === "base" ? (
                  <span className="text-cyan-400 text-[14px] leading-none" title="recurso" aria-hidden>
                    ●
                  </span>
                ) : (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white" title={GENERATOR_DEFS[def.produces].name}>
                    {def.produces.replace("generator", "")}
                  </div>
                )}
              </>
            ) : (
              <span className="text-xs text-white/70">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Card Comprar: tooltip de custo quando sem recurso; botão em absolute inset-0. */}
      <div
        ref={buyTriggerRef}
        onMouseEnter={() => updateTooltipSide(buyTriggerRef, setBuyTooltipSide)}
        className={`buy-card-clickable group/buy relative flex h-[40px] w-[160px] shrink-0 items-center justify-center rounded-md px-3 text-sm font-medium text-white transition-transform duration-100 ease-out ${canBuy ? "buy-card--affordable" : "buy-card--unaffordable"}`}
      >
        {!canBuy && (
          <div
            className={`pointer-events-none absolute top-1/2 z-20 min-w-[160px] -translate-y-1/2 rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 shadow-xl opacity-0 transition-opacity duration-150 group-hover/buy:opacity-100 ${
              buyTooltipSide === "right" ? "left-full ml-1.5" : "right-full mr-1.5"
            }`}
            role="tooltip"
          >
            {buyTooltipSide === "right" ? (
              <div className="absolute right-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-r-zinc-800" />
            ) : (
              <div className="absolute left-full top-1/2 h-0 w-0 -translate-y-1/2 border-[6px] border-transparent border-l-zinc-800" />
            )}
            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                <span className="text-cyan-400 text-sm" aria-hidden>●</span>
                <span className={`text-sm font-semibold tabular-nums ${lacksBase ? "text-red-400" : "text-white"}`}>
                  {formatNumber(displayCost)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                <span className="text-amber-400 text-sm" aria-hidden>▲</span>
                <span className={`text-sm font-semibold tabular-nums ${lacksTickets ? "text-red-400" : "text-white"}`}>
                  {ticketsRequired}
                </span>
              </div>
              {hasPrevCost && def.produces !== "base" && (
                <div className="flex items-center justify-between gap-3 whitespace-nowrap">
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-red-600 text-[10px] font-bold text-white"
                    aria-hidden
                  >
                    {def.produces.replace("generator", "")}
                  </span>
                  <span className={`text-sm font-semibold tabular-nums ${lacksPrev ? "text-red-400" : "text-white"}`}>
                    {formatNumber(displayPrevCost)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        <span className="pointer-events-none shrink-0">
          Comprar{buyAmount > 1 ? <> <span className="tabular-nums">{formatNumber(Decimal.fromNumber(buyAmount))}</span></> : null}
        </span>
        <button
          type="button"
          onClick={() => {
            if (buyAmount >= 1) dispatch({ type: "BUY_GENERATOR", id, amount: buyAmount });
          }}
          disabled={!canBuy || buyAmount < 1}
          title={canBuy ? undefined : `Custo: ● ${formatNumber(displayCost)} · ▲ ${ticketsRequired}${hasPrevCost && def.produces !== "base" ? ` · ${formatNumber(displayPrevCost)} ${GENERATOR_DEFS[def.produces].name}` : ""}`}
          className="absolute inset-0 rounded-md outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus-visible:outline-none focus-visible:ring-0"
          aria-label="Comprar gerador"
        />
      </div>
    </div>
  );
}
