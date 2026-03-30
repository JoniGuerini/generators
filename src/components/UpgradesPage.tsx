import { useState } from "react";
import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { GENERATOR_DEFS, parseGeneratorId, getLineColor, LINE_COLOR_CLASSES } from "@/engine/constants";
import { useT } from "@/locale";
import { getCardKey, getCardsNeeded, CARD_RARITY } from "@/engine/cards";
import type { CardRarity } from "@/engine/cards";
import {
  getEffectiveCycleTimeSeconds,
  getEffectiveProductionPerCycle,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getTicketsPerSecond,
  getUpgradeCostTicketMultiplier,
  getTicketTradeThreshold,
  getUpgradeCostMilestoneDoubler,
  getMilestoneRewardMultiplier,
  getCritChance,
  getCritMultiplier,
  getUpgradeCostCritChance,
  getUpgradeCostCritMultiplier,
  MAX_CRIT_CHANCE_RANK,
} from "@/engine/upgrades";
import { formatNumber, formatTime } from "@/utils/format";
import { useHoldToRepeat } from "@/hooks/useHoldToRepeat";

type UpgradesTab = "geradores" | "tickets";

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
  cardCount,
  cardsNeeded,
  cardRarity,
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
  cardCount?: number;
  cardsNeeded?: number;
  cardRarity?: CardRarity;
}) {
  const rowWidth = width || "18.5rem";
  const buttonActiveClass =
    buttonVariant === "base"
      ? "btn-3d btn-3d--cyan bg-cyan-600 text-white hover:bg-cyan-500"
      : "btn-3d btn-3d--violet bg-violet-600 text-white hover:bg-violet-500";
  const hasCards = cardsNeeded != null;
  const enoughCards = !hasCards || (cardCount ?? 0) >= cardsNeeded!;
  const effectiveCanBuy = canBuy && enoughCards;
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
      {hasCards && !maxed && (() => {
        const owned = cardCount ?? 0;
        const needed = cardsNeeded!;
        const pctCards = needed > 0 ? Math.min((owned / needed) * 100, 100) : 0;
        const full = owned >= needed;
        const fillColor = cardRarity === "rare"
          ? "bg-violet-500"
          : cardRarity === "uncommon"
            ? "bg-green-500"
            : "bg-zinc-400";
        const textColor = cardRarity === "rare"
          ? "text-violet-300"
          : cardRarity === "uncommon"
            ? "text-green-300"
            : "text-zinc-300";
        const glowClass = full
          ? cardRarity === "rare"
            ? "ring-1 ring-violet-500/50"
            : cardRarity === "uncommon"
              ? "ring-1 ring-green-500/50"
              : "ring-1 ring-zinc-400/50"
          : "";
        return (
          <div className={`relative flex h-6 w-12 shrink-0 items-center justify-center overflow-hidden rounded ${glowClass}`}>
            <div className="absolute inset-0 bg-zinc-800" />
            <div
              className={`absolute inset-y-0 left-0 ${fillColor} transition-[width] duration-300`}
              style={{ width: `${pctCards}%` }}
            />
            <span className={`relative z-10 text-[10px] font-bold tabular-nums drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${full ? "text-white" : textColor}`}>
              {owned}/{needed}
            </span>
          </div>
        );
      })()}
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

export function UpgradesPage() {
  const dispatch = useGameDispatch();
  const t = useT();
  const [tab, setTab] = useState<UpgradesTab>("geradores");

  // O UpgradesPage precisa de muitas coisas, mas a grande diferença é que ele _não_ precisa de:
  // state.generators (inteiro, que muda 100x por seg) nem state.baseResource (exceto para trade).
  // Iremos extrair do estado só as moedas de melhorias e ranks globais para evitar re-render por tick de produção.
  const {
    generatorIdsForUpgrades,
    milestoneCurrency,
    baseResource,
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank,
    upgradeGeneratorCostHalfRank,
    upgradeMilestoneDoublerRank,
    generatorsData,
    cards,
  } = useGameSelector((state) => {
    const everOwnedIds = state.generators
      .filter(g => g.everOwned && parseGeneratorId(g.id).line === state.activeLine)
      .map(g => g.id);
    const generatorsData = state.generators.map(g => ({
      id: g.id,
      upgradeCycleSpeedRank: g.upgradeCycleSpeedRank,
      upgradeProductionRank: g.upgradeProductionRank,
      upgradeCritChanceRank: g.upgradeCritChanceRank,
      upgradeCritMultiplierRank: g.upgradeCritMultiplierRank,
    }));

    return {
      generatorIdsForUpgrades: everOwnedIds,
      milestoneCurrency: state.milestoneCurrency,
      baseResource: state.baseResource,
      ticketTradeMilestoneCount: state.ticketTradeMilestoneCount,
      upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
      upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
      upgradeMilestoneDoublerRank: state.upgradeMilestoneDoublerRank,
      generatorsData,
      cards: state.cards,
    };
  }, (a, b) => 
    a.milestoneCurrency.equals(b.milestoneCurrency) &&
    a.baseResource.equals(b.baseResource) &&
    a.ticketTradeMilestoneCount === b.ticketTradeMilestoneCount &&
    a.upgradeTicketMultiplierRank === b.upgradeTicketMultiplierRank &&
    a.upgradeGeneratorCostHalfRank === b.upgradeGeneratorCostHalfRank &&
    a.upgradeMilestoneDoublerRank === b.upgradeMilestoneDoublerRank &&
    a.generatorIdsForUpgrades.join() === b.generatorIdsForUpgrades.join() &&
    a.cards === b.cards &&
    a.generatorsData.length === b.generatorsData.length &&
    a.generatorsData.every((g, i) => 
      g.upgradeCycleSpeedRank === b.generatorsData[i].upgradeCycleSpeedRank && 
      g.upgradeProductionRank === b.generatorsData[i].upgradeProductionRank &&
      g.upgradeCritChanceRank === b.generatorsData[i].upgradeCritChanceRank &&
      g.upgradeCritMultiplierRank === b.generatorsData[i].upgradeCritMultiplierRank
    )
  );

  const ticketsPerSec = getTicketsPerSecond(
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank
  );
  const nextTicketsMultiplier = getTicketsPerSecond(
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank + 1
  );
  const nextTicketsTrade = getTicketsPerSecond(
    ticketTradeMilestoneCount + 1,
    upgradeTicketMultiplierRank
  );

  const costTicketMultiplier = getUpgradeCostTicketMultiplier(upgradeTicketMultiplierRank);
  const canBuyTicketMultiplier = milestoneCurrency.gte(costTicketMultiplier);
  const tradeCost = getTicketTradeThreshold(ticketTradeMilestoneCount);
  const canTrade = baseResource.gte(tradeCost);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Abas */}
      <div className="flex shrink-0 gap-2 px-4 pt-3 pb-2">
        <button
          type="button"
          onClick={() => setTab("geradores")}
          className={`btn-3d flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${
            tab === "geradores"
              ? "btn-3d--violet bg-violet-600 text-white"
              : "btn-3d--zinc bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
          }`}
        >
          {t.upgradesPage.generators}
        </button>
        <button
          type="button"
          onClick={() => setTab("tickets")}
          className={`btn-3d flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${
            tab === "tickets"
              ? "btn-3d--violet bg-violet-600 text-white"
              : "btn-3d--zinc bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
          }`}
        >
          {t.upgradesPage.tickets}
        </button>
      </div>

      {/* Conteúdo */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "tickets" ? (
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
                cost={`◆ ${formatNumber(costTicketMultiplier)}`}
                canBuy={canBuyTicketMultiplier}
                onBuy={() => dispatch({ type: "BUY_TICKET_MULTIPLIER_UPGRADE" })}
                buttonLabel={`◆ ${formatNumber(costTicketMultiplier)}`}
                cardCount={cards[getCardKey("ticketMultiplier")] ?? 0}
                cardsNeeded={getCardsNeeded(upgradeTicketMultiplierRank)}
                cardRarity={CARD_RARITY.ticketMultiplier}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-lg text-cyan-400" aria-hidden>●</div>
              <UpgradeRow
                flexible
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.tradeForTickets}</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">{formatNumber(Decimal.fromNumber(nextTicketsTrade))}</span>
                      <span className="text-amber-500/60 text-[10px]">▲/s</span>
                    </div>
                  </div>
                }
                sublabel={`${ticketTradeMilestoneCount}`}
                cost={`● ${formatNumber(tradeCost)}`}
                canBuy={canTrade}
                onBuy={() => dispatch({ type: "TRADE_BASE_FOR_TICKET_RATE" })}
                buttonLabel="+1 ▲/s"
                buttonVariant="base"
                progress={tradeCost.gt(0) ? baseResource.div(tradeCost).toNumber() : 0}
                progressColor="bg-cyan-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-lg text-violet-400" aria-hidden>½</div>
                {(() => {
                  const rank = upgradeGeneratorCostHalfRank;
                  const costHalf = getUpgradeCostGeneratorCostHalf(rank);
                  const canBuyHalf = milestoneCurrency.gte(costHalf);
                  return (
                    <UpgradeRow
                      flexible
                      label={
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.halfCostAll}</span>
                      }
                      sublabel={`${rank}`}
                      cost={`◆ ${formatNumber(costHalf)}`}
                      canBuy={canBuyHalf}
                      onBuy={() =>
                        dispatch({ type: "BUY_GENERATOR_COST_HALF_UPGRADE" })
                      }
                      buttonLabel={`◆ ${formatNumber(costHalf)}`}
                      cardCount={cards[getCardKey("generatorCostHalf")] ?? 0}
                      cardsNeeded={getCardsNeeded(rank)}
                      cardRarity={CARD_RARITY.generatorCostHalf}
                    />
                  );
                })()}
              </div>

              <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-bold text-violet-400" aria-hidden>×2</div>
              {(() => {
                const rank = upgradeMilestoneDoublerRank;
                const costDoubler = getUpgradeCostMilestoneDoubler(rank);
                const canBuyDoubler = milestoneCurrency.gte(costDoubler);
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
                    cost={`◆ ${formatNumber(costDoubler)}`}
                    canBuy={canBuyDoubler}
                    onBuy={() =>
                      dispatch({ type: "BUY_MILESTONE_DOUBLER_UPGRADE" })
                    }
                    buttonLabel={`◆ ${formatNumber(costDoubler)}`}
                    cardCount={cards[getCardKey("milestoneDoubler")] ?? 0}
                    cardsNeeded={getCardsNeeded(rank)}
                    cardRarity={CARD_RARITY.milestoneDoubler}
                  />
                );
              })()}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {t.upgradesPage.perGenerator}
              </h3>
              <ul className="space-y-2">
                {generatorIdsForUpgrades.map((id) => {
                  const def = GENERATOR_DEFS[id];
                  const gen = generatorsData.find((g) => g.id === id);
                  if (!gen) return null;
                  const { gen: generatorNumber, line: lineNum } = parseGeneratorId(id);
                  const lineColor = getLineColor(lineNum);
                  const colorClasses = LINE_COLOR_CLASSES[lineColor];
                  const maxCycleRank = getMaxCycleSpeedRank(
                    def.cycleTimeSeconds
                  );
                  const cycleRank = gen.upgradeCycleSpeedRank;
                  const prodRank = gen.upgradeProductionRank;
                  const costCycle =
                    cycleRank < maxCycleRank
                      ? getUpgradeCostCycleSpeed(
                          generatorNumber,
                          cycleRank
                        )
                      : null;
                  const costProd = getUpgradeCostProduction(
                    generatorNumber,
                    prodRank
                  );
                  const canBuyCycle =
                    costCycle != null &&
                    milestoneCurrency.gte(costCycle);
                  const canBuyProd =
                    milestoneCurrency.gte(costProd);
                  const currentCycle = getEffectiveCycleTimeSeconds(
                    def.cycleTimeSeconds,
                    cycleRank
                  );
                  const nextCycle = cycleRank < maxCycleRank
                    ? getEffectiveCycleTimeSeconds(def.cycleTimeSeconds, cycleRank + 1)
                    : currentCycle;
                  const currentProd = getEffectiveProductionPerCycle(
                    def.productionPerCycle,
                    prodRank
                  );
                  const nextProd = getEffectiveProductionPerCycle(
                    def.productionPerCycle,
                    prodRank + 1
                  );

                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2"
                    >
                      <div className={`${colorClasses.btn3d} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClasses.bg}/90 text-sm font-bold text-white`} title={def.name}>
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
                          cost={
                            costCycle
                              ? `◆ ${formatNumber(costCycle)}`
                              : ""
                          }
                          canBuy={canBuyCycle ?? false}
                          onBuy={() =>
                            dispatch({
                              type: "BUY_UPGRADE",
                              id,
                              upgradeType: "cycleSpeed",
                            })
                          }
                          buttonLabel={costCycle ? `◆ ${formatNumber(costCycle)}` : "—"}
                          maxed={cycleRank >= maxCycleRank}
                          maxedLabel={t.upgradesPage.maxed}
                          cardCount={cards[getCardKey("cycleSpeed", id)] ?? 0}
                          cardsNeeded={getCardsNeeded(cycleRank)}
                          cardRarity={CARD_RARITY.cycleSpeed}
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
                          cost={`◆ ${formatNumber(costProd)}`}
                          canBuy={canBuyProd}
                          onBuy={() =>
                            dispatch({
                              type: "BUY_UPGRADE",
                              id,
                              upgradeType: "production",
                            })
                          }
                          buttonLabel={`◆ ${formatNumber(costProd)}`}
                          cardCount={cards[getCardKey("production", id)] ?? 0}
                          cardsNeeded={getCardsNeeded(prodRank)}
                          cardRarity={CARD_RARITY.production}
                        />
                        {(() => {
                          const critRank = gen.upgradeCritChanceRank;
                          const critMultRank = gen.upgradeCritMultiplierRank;
                          const costCrit = critRank < MAX_CRIT_CHANCE_RANK
                            ? getUpgradeCostCritChance(generatorNumber, critRank)
                            : null;
                          const costCritMult = getUpgradeCostCritMultiplier(generatorNumber, critMultRank);
                          const canBuyCrit = costCrit != null && milestoneCurrency.gte(costCrit);
                          const canBuyCritMult = milestoneCurrency.gte(costCritMult);
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
                                cost={costCrit ? `◆ ${formatNumber(costCrit)}` : ""}
                                canBuy={canBuyCrit ?? false}
                                onBuy={() => dispatch({ type: "BUY_UPGRADE", id, upgradeType: "critChance" })}
                                buttonLabel={costCrit ? `◆ ${formatNumber(costCrit)}` : "—"}
                                maxed={critRank >= MAX_CRIT_CHANCE_RANK}
                                maxedLabel={t.upgradesPage.maxed}
                                cardCount={cards[getCardKey("critChance", id)] ?? 0}
                                cardsNeeded={getCardsNeeded(critRank)}
                                cardRarity={CARD_RARITY.critChance}
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
                                cost={`◆ ${formatNumber(costCritMult)}`}
                                canBuy={canBuyCritMult}
                                onBuy={() => dispatch({ type: "BUY_UPGRADE", id, upgradeType: "critMultiplier" })}
                                buttonLabel={`◆ ${formatNumber(costCritMult)}`}
                                cardCount={cards[getCardKey("critMultiplier", id)] ?? 0}
                                cardsNeeded={getCardsNeeded(critMultRank)}
                                cardRarity={CARD_RARITY.critMultiplier}
                              />
                            </>
                          );
                        })()}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
