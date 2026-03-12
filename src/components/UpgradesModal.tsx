import { useState } from "react";
import Decimal from "break_eternity.js";
import { useGameState, useGameDispatch } from "@/store/useGameStore";
import { GENERATOR_DEFS, GENERATOR_IDS } from "@/engine/constants";
import type { GeneratorId } from "@/engine/constants";
import {
  getEffectiveCycleTimeSeconds,
  getMaxCycleSpeedRank,
  getUpgradeCostCycleSpeed,
  getUpgradeCostProduction,
  getUpgradeCostGeneratorCostHalf,
  getTicketsPerSecond,
  getUpgradeCostTicketRate,
  getTicketTradeThreshold,
} from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";

type UpgradesTab = "geradores" | "tickets";

interface UpgradesModalProps {
  onClose: () => void;
}

/** Largura mínima do botão para caber "◆ 100" e "Trocar por +1 ▲/s" em uma linha */
const UPGRADE_BUTTON_WIDTH = "12rem";
/** Largura de cada bloco de upgrade (área de info + botão) para texto não quebrar */
const UPGRADE_ROW_WIDTH = "22rem";

/** Card horizontal: ícone + título/descrição à esquerda, ações à direita */
function UpgradeCard({
  title,
  icon,
  iconBg,
  description,
  children,
}: {
  title: string;
  icon: string;
  iconBg: string;
  description?: string;
  children: React.ReactNode;
}) {
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
          style={{ minWidth: UPGRADE_ROW_WIDTH }}
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
}: {
  label: string;
  sublabel?: string;
  cost: string;
  canBuy: boolean;
  onBuy: () => void;
  buttonLabel: string;
  maxed?: boolean;
}) {
  return (
    <div
      className="flex flex-nowrap items-center justify-between gap-3 rounded-lg bg-zinc-900/70 px-3 py-2"
      style={{ width: UPGRADE_ROW_WIDTH, minWidth: UPGRADE_ROW_WIDTH }}
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
            canBuy
              ? "bg-violet-600 text-white hover:bg-violet-500 active:scale-[0.98]"
              : "cursor-not-allowed bg-zinc-700 text-zinc-500"
          }`}
        >
          {buttonLabel}
        </button>
      )}
    </div>
  );
}

export function UpgradesModal({ onClose }: UpgradesModalProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [tab, setTab] = useState<UpgradesTab>("geradores");
  const generatorIdsWithUnits = (GENERATOR_IDS as readonly GeneratorId[]).filter(
    (id) => {
      const gen = state.generators.find((g) => g.id === id);
      return gen && Decimal.gte(gen.quantity, Decimal.dOne);
    }
  );

  const ticketsPerSec = getTicketsPerSecond(
    state.upgradeTicketRateRank,
    state.ticketTradeMilestoneCount
  );
  const costTicketRate = getUpgradeCostTicketRate(state.upgradeTicketRateRank);
  const canBuyTicketRate = state.milestoneCurrency.gte(costTicketRate);
  const tradeCost = getTicketTradeThreshold(state.ticketTradeMilestoneCount);
  const canTrade = state.baseResource.gte(tradeCost);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      aria-labelledby="upgrades-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-2xl border border-zinc-600/90 bg-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-700/80 bg-zinc-800/95 px-5 py-4">
          <h2
            id="upgrades-title"
            className="text-xl font-bold tracking-tight text-white"
          >
            Melhorias
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900/80 px-3 py-1.5">
              <span className="text-violet-400" aria-hidden>
                ◆
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-violet-200">
                {formatNumber(state.milestoneCurrency)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              aria-label="Fechar"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-700/80 bg-zinc-900/40">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "tickets" ? (
            <div className="space-y-5">
              <UpgradeCard
                title="Tickets por segundo"
                icon="▲"
                iconBg="bg-amber-500/20 text-amber-400"
                description="Base 1 ▲/s; cada ranque ◆ adiciona +1 ▲/s (ranques infinitos)."
              >
                <UpgradeRow
                  label={`Produção: ${ticketsPerSec} ▲/s`}
                  sublabel={`ranque ◆ ${state.upgradeTicketRateRank}${
                    state.ticketTradeMilestoneCount > 0
                      ? ` · trocas ● ${state.ticketTradeMilestoneCount}`
                      : ""
                  }`}
                  cost={`◆ ${formatNumber(costTicketRate)}`}
                  canBuy={canBuyTicketRate}
                  onBuy={() => dispatch({ type: "BUY_TICKET_RATE_UPGRADE" })}
                  buttonLabel={`◆ ${formatNumber(costTicketRate)}`}
                />
              </UpgradeCard>
              <UpgradeCard
                title="Trocar recurso base por +1 ▲/s"
                icon="●"
                iconBg="bg-cyan-500/20 text-cyan-400"
                description="Troca permanente: gasta ● e ganha +1 ▲/s. Marcos: 500 → 5k → 5M → 5B → …"
              >
                <UpgradeRow
                  label={`Próximo marco: ● ${formatNumber(tradeCost)}`}
                  sublabel={`trocas feitas: ${state.ticketTradeMilestoneCount}`}
                  cost={`● ${formatNumber(tradeCost)}`}
                  canBuy={canTrade}
                  onBuy={() => dispatch({ type: "TRADE_BASE_FOR_TICKET_RATE" })}
                  buttonLabel="Trocar por +1 ▲/s"
                />
              </UpgradeCard>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Melhoria global */}
              <UpgradeCard
                title="Custo de compra ÷2 (todos os geradores)"
                icon="½"
                iconBg="bg-violet-500/20 text-violet-400"
                description="Reduz o custo (● e gerador anterior) de todos os geradores pela metade. Cada ranque aplica ÷2 de novo."
              >
                {(() => {
                  const rank = state.upgradeGeneratorCostHalfRank;
                  const costHalf = getUpgradeCostGeneratorCostHalf(rank);
                  const canBuyHalf = state.milestoneCurrency.gte(costHalf);
                  return (
                    <UpgradeRow
                      label={`Ranque atual: ${rank}`}
                      cost={`◆ ${formatNumber(costHalf)}`}
                      canBuy={canBuyHalf}
                      onBuy={() =>
                        dispatch({ type: "BUY_GENERATOR_COST_HALF_UPGRADE" })
                      }
                      buttonLabel={`◆ ${formatNumber(costHalf)}`}
                    />
                  );
                })()}
              </UpgradeCard>

              {/* Lista por gerador */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Por gerador
                </h3>
                <ul className="space-y-4">
                  {generatorIdsWithUnits.map((id) => {
                    const def = GENERATOR_DEFS[id];
                    const gen = state.generators.find((g) => g.id === id);
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
                      state.milestoneCurrency.gte(costCycle);
                    const canBuyProd =
                      state.milestoneCurrency.gte(costProd);
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
    </div>
  );
}
