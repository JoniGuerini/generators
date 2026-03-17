import { useState } from "react";
import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { GENERATOR_DEFS } from "@/engine/constants";
import {
  getEffectiveCycleTimeSeconds,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getTicketsPerSecond,
  getUpgradeCostTicketRate,
  getUpgradeCostTicketMultiplier,
  getTicketTradeThreshold,
} from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";

type UpgradesTab = "geradores" | "tickets";

/** Largura mínima do botão para caber "◆ 100" e "+1 ▲/s" em uma linha */
const UPGRADE_BUTTON_WIDTH = "10rem";
/** Largura base de cada bloco de upgrade para os geradores (lado a lado) */
const UPGRADE_ROW_WIDTH_GEN = "18.5rem";
/** Largura estendida para melhorias globais/tickets (linha única) */
const UPGRADE_ROW_WIDTH_WIDE = "26rem";

/** Card horizontal: ícone + título/descrição à esquerda, ações à direita */
function UpgradeCard({
  title,
  icon,
  iconBg,
  description,
  widthMode = "wide",
  children,
}: {
  title: string;
  icon: string;
  iconBg: string;
  description?: string;
  widthMode?: "wide" | "gen";
  children: React.ReactNode;
}) {
  const containerMinWidth = widthMode === "wide" ? UPGRADE_ROW_WIDTH_WIDE : UPGRADE_ROW_WIDTH_GEN;
  return (
    <div className="rounded-xl border border-zinc-600/80 bg-zinc-800/60 shadow-lg overflow-hidden">
      <div className="flex flex-nowrap items-center gap-4 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${iconBg}`}
          aria-hidden
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{title}</h3>
          {description && (
            <p className="text-xs text-zinc-500" title={description}>
              {description}
            </p>
          )}
        </div>
        <div
          className="flex shrink-0 flex-nowrap items-center gap-3"
          style={{ minWidth: containerMinWidth }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Uma linha de upgrade: área de info + botão do mesmo tamanho em todos os cards */
function UpgradeRow({
  label,
  sublabel,
  cost,
  canBuy,
  onBuy,
  buttonLabel,
  maxed,
  buttonVariant = "default",
  width,
}: {
  label: React.ReactNode;
  sublabel?: string;
  cost: string;
  canBuy: boolean;
  onBuy: () => void;
  buttonLabel: string;
  maxed?: boolean;
  /** "base" = cor da moeda base (●); "default" = roxo */
  buttonVariant?: "default" | "base";
  width?: string;
}) {
  const rowWidth = width || UPGRADE_ROW_WIDTH_GEN;
  const buttonActiveClass =
    buttonVariant === "base"
      ? "bg-cyan-600 text-white hover:bg-cyan-500 active:scale-[0.98]"
      : "bg-violet-600 text-white hover:bg-violet-500 active:scale-[0.98]";
  return (
    <div
      className="flex flex-nowrap items-center justify-between gap-3 rounded-lg bg-zinc-900/70 px-3 py-2"
      style={{ width: rowWidth, minWidth: rowWidth }}
    >
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <span className="text-sm text-zinc-300">{label}</span>
        {sublabel && (
          <span className="text-xs text-zinc-500">({sublabel})</span>
        )}
      </div>
      {maxed ? (
        <span
          className="flex h-9 shrink-0 items-center justify-center rounded-lg bg-zinc-700 px-3 text-xs font-medium text-zinc-400"
          style={{ minWidth: UPGRADE_BUTTON_WIDTH }}
        >
          Máx.
        </span>
      ) : (
        <button
          type="button"
          onClick={onBuy}
          disabled={!canBuy}
          title={cost ? `Custo: ${cost}` : undefined}
          style={{ minWidth: UPGRADE_BUTTON_WIDTH }}
          className={`flex h-9 shrink-0 items-center justify-center rounded-lg px-3 text-sm font-medium transition whitespace-nowrap ${
            canBuy ? buttonActiveClass : "cursor-not-allowed bg-zinc-700 text-zinc-500"
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
  const [tab, setTab] = useState<UpgradesTab>("geradores");

  // O UpgradesPage precisa de muitas coisas, mas a grande diferença é que ele _não_ precisa de:
  // state.generators (inteiro, que muda 100x por seg) nem state.baseResource (exceto para trade).
  // Iremos extrair do estado só as moedas de melhorias e ranks globais para evitar re-render por tick de produção.
  const {
    generatorIdsForUpgrades,
    milestoneCurrency,
    baseResource,
    ticketTradeMilestoneCount,
    upgradeTicketRateRank,
    upgradeTicketMultiplierRank,
    upgradeGeneratorCostHalfRank,
    generatorsData,
  } = useGameSelector((state) => {
    const everOwnedIds = state.generators.filter(g => g.everOwned).map(g => g.id);
    const generatorsData = state.generators.map(g => ({
      id: g.id,
      upgradeCycleSpeedRank: g.upgradeCycleSpeedRank,
      upgradeProductionRank: g.upgradeProductionRank,
    }));

    return {
      generatorIdsForUpgrades: everOwnedIds,
      milestoneCurrency: state.milestoneCurrency,
      baseResource: state.baseResource,
      ticketTradeMilestoneCount: state.ticketTradeMilestoneCount,
      upgradeTicketRateRank: state.upgradeTicketRateRank,
      upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
      upgradeGeneratorCostHalfRank: state.upgradeGeneratorCostHalfRank,
      generatorsData,
    };
  }, (a, b) => 
    a.milestoneCurrency.equals(b.milestoneCurrency) &&
    a.baseResource.equals(b.baseResource) &&
    a.ticketTradeMilestoneCount === b.ticketTradeMilestoneCount &&
    a.upgradeTicketRateRank === b.upgradeTicketRateRank &&
    a.upgradeTicketMultiplierRank === b.upgradeTicketMultiplierRank &&
    a.upgradeGeneratorCostHalfRank === b.upgradeGeneratorCostHalfRank &&
    a.generatorIdsForUpgrades.join() === b.generatorIdsForUpgrades.join() &&
    a.generatorsData.length === b.generatorsData.length &&
    a.generatorsData.every((g, i) => 
      g.upgradeCycleSpeedRank === b.generatorsData[i].upgradeCycleSpeedRank && 
      g.upgradeProductionRank === b.generatorsData[i].upgradeProductionRank
    )
  );

  const ticketsPerSec = getTicketsPerSecond(
    upgradeTicketRateRank,
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank
  );
  const nextTicketsRate = getTicketsPerSecond(
    upgradeTicketRateRank + 1,
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank
  );
  const nextTicketsMultiplier = getTicketsPerSecond(
    upgradeTicketRateRank,
    ticketTradeMilestoneCount,
    upgradeTicketMultiplierRank + 1
  );
  const nextTicketsTrade = getTicketsPerSecond(
    upgradeTicketRateRank,
    ticketTradeMilestoneCount + 1,
    upgradeTicketMultiplierRank
  );

  const costTicketRate = getUpgradeCostTicketRate(upgradeTicketRateRank);
  const canBuyTicketRate = milestoneCurrency.gte(costTicketRate);
  const costTicketMultiplier = getUpgradeCostTicketMultiplier(upgradeTicketMultiplierRank);
  const canBuyTicketMultiplier = milestoneCurrency.gte(costTicketMultiplier);
  const tradeCost = getTicketTradeThreshold(ticketTradeMilestoneCount);
  const canTrade = baseResource.gte(tradeCost);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Abas */}
      <div className="flex shrink-0 border-b border-zinc-700/80 bg-zinc-900/40">
        <button
          type="button"
          onClick={() => setTab("geradores")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            tab === "geradores"
              ? "border-b-2 border-amber-400 bg-zinc-800/50 text-amber-400"
              : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
          }`}
        >
          Geradores
        </button>
        <button
          type="button"
          onClick={() => setTab("tickets")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition ${
            tab === "tickets"
              ? "border-b-2 border-amber-400 bg-zinc-800/50 text-amber-400"
              : "text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200"
          }`}
        >
          Tickets
        </button>
      </div>

      {/* Conteúdo */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "tickets" ? (
          <div className="mx-auto max-w-4xl space-y-5">
            <UpgradeCard
              title="Tickets por segundo"
              icon="▲"
              iconBg="bg-amber-500/20 text-amber-400"
              description="Aumenta a produção base de tickets por segundo."
            >
              <UpgradeRow
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Produção de Tickets</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">{formatNumber(Decimal.fromNumber(nextTicketsRate))}</span>
                      <span className="text-amber-500/60 text-[10px]">▲/s</span>
                    </div>
                  </div>
                }
                sublabel={`ranque ◆ ${upgradeTicketRateRank}`}
                cost={`◆ ${formatNumber(costTicketRate)}`}
                canBuy={canBuyTicketRate}
                width={UPGRADE_ROW_WIDTH_WIDE}
                onBuy={() => dispatch({ type: "BUY_TICKET_RATE_UPGRADE" })}
                buttonLabel={`◆ ${formatNumber(costTicketRate)}`}
              />
            </UpgradeCard>
            <UpgradeCard
              title="Dobrar produção de tickets"
              icon="×2"
              iconBg="bg-amber-500/20 text-amber-400"
              description="Dobra a velocidade total de ganho de tickets."
              widthMode="wide"
            >
              <UpgradeRow
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Produção de Tickets</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">{formatNumber(Decimal.fromNumber(nextTicketsMultiplier))}</span>
                      <span className="text-amber-500/60 text-[10px]">▲/s</span>
                    </div>
                  </div>
                }
                sublabel={`ranque ×2: ${upgradeTicketMultiplierRank}`}
                cost={`◆ ${formatNumber(costTicketMultiplier)}`}
                canBuy={canBuyTicketMultiplier}
                width={UPGRADE_ROW_WIDTH_WIDE}
                onBuy={() => dispatch({ type: "BUY_TICKET_MULTIPLIER_UPGRADE" })}
                buttonLabel={`◆ ${formatNumber(costTicketMultiplier)}`}
              />
            </UpgradeCard>
            <UpgradeCard
              title="Trocar recurso base por +1 ▲/s"
              icon="●"
              iconBg="bg-cyan-500/20 text-cyan-400"
              description="Gasta recurso principal para aumentar a base de tickets permanentemente."
              widthMode="wide"
            >
              <UpgradeRow
                label={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Produção de Tickets</span>
                    <div className="flex items-center gap-1.5 text-sm font-medium">
                      <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                      <span className="text-amber-400/80">→</span>
                      <span className="text-white">{formatNumber(Decimal.fromNumber(nextTicketsTrade))}</span>
                      <span className="text-amber-500/60 text-[10px]">▲/s</span>
                    </div>
                  </div>
                }
                sublabel={`trocas feitas: ${ticketTradeMilestoneCount}`}
                cost={`● ${formatNumber(tradeCost)}`}
                canBuy={canTrade}
                width={UPGRADE_ROW_WIDTH_WIDE}
                onBuy={() => dispatch({ type: "TRADE_BASE_FOR_TICKET_RATE" })}
                buttonLabel="+1 ▲/s"
                buttonVariant="base"
              />
            </UpgradeCard>
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-5">
            <UpgradeCard
              title="Custo de compra ÷2 (todos os geradores)"
              icon="½"
              iconBg="bg-violet-500/20 text-violet-400"
              description="Reduz o custo de todos os geradores pela metade. Cada ranque aplica ÷2 de novo."
              widthMode="wide"
            >
              {(() => {
                const rank = upgradeGeneratorCostHalfRank;
                const costHalf = getUpgradeCostGeneratorCostHalf(rank);
                const canBuyHalf = milestoneCurrency.gte(costHalf);
                return (
                  <UpgradeRow
                    label={`Ranque atual: ${rank}`}
                    cost={`◆ ${formatNumber(costHalf)}`}
                    canBuy={canBuyHalf}
                    onBuy={() =>
                      dispatch({ type: "BUY_GENERATOR_COST_HALF_UPGRADE" })
                    }
                    buttonLabel={`◆ ${formatNumber(costHalf)}`}
                    width={UPGRADE_ROW_WIDTH_WIDE}
                  />
                );
              })()}
            </UpgradeCard>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Por gerador
              </h3>
              <ul className="space-y-4">
                {generatorIdsForUpgrades.map((id) => {
                  const def = GENERATOR_DEFS[id];
                  const gen = generatorsData.find((g) => g.id === id);
                  if (!gen) return null;
                  const generatorNumber = parseInt(
                    id.replace("generator", ""),
                    10
                  );
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
                  const effectiveCycle = getEffectiveCycleTimeSeconds(
                    def.cycleTimeSeconds,
                    cycleRank
                  );

                  return (
                    <li
                      key={id}
                      className="rounded-xl border border-zinc-600/80 bg-zinc-800/60 overflow-hidden"
                    >
                      <div className="flex flex-nowrap items-center gap-4 p-4">
                        <div className="flex shrink-0 items-center justify-center" title={def.name}>
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600/90 text-sm font-bold text-white">
                            {generatorNumber}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1" />
                        <div className="flex shrink-0 flex-nowrap items-center gap-3">
                          <UpgradeRow
                            label={`Tempo de ciclo: ${effectiveCycle.toFixed(2)}s`}
                            sublabel={`ranque ${cycleRank}${
                              maxCycleRank > 0 ? ` / ${maxCycleRank}` : ""
                            }`}
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
                          />
                          <UpgradeRow
                            label="Produção por ciclo ×2"
                            sublabel={`ranque ${prodRank}`}
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
                          />
                        </div>
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
