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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="upgrades-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-zinc-600 bg-zinc-800 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-3">
          <h2 id="upgrades-title" className="text-lg font-bold text-white">
            Melhorias
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-purple-400" aria-hidden>◆</span>
            <span className="font-mono font-semibold tabular-nums text-purple-200">
              {formatNumber(state.milestoneCurrency)}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {/* Abas */}
        <div className="flex border-b border-zinc-700">
          <button
            type="button"
            onClick={() => setTab("geradores")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
              tab === "geradores"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            }`}
          >
            Geradores
          </button>
          <button
            type="button"
            onClick={() => setTab("tickets")}
            className={`flex-1 px-4 py-2.5 text-sm font-medium transition ${
              tab === "tickets"
                ? "border-b-2 border-amber-400 text-amber-400"
                : "text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-200"
            }`}
          >
            Tickets
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "tickets" ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-600 bg-zinc-700/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-amber-400" aria-hidden>▲</span>
                  <span className="font-medium text-white">Tickets por segundo</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-800/80 px-3 py-2">
                  <div>
                    <span className="text-sm text-zinc-300">
                      Produção: {ticketsPerSec} ▲/s
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      (ranque ◆ {state.upgradeTicketRateRank}
                      {state.ticketTradeMilestoneCount > 0
                        ? ` · trocas ● ${state.ticketTradeMilestoneCount}`
                        : ""}
                    )
                  </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "BUY_TICKET_RATE_UPGRADE" })}
                    disabled={!canBuyTicketRate}
                    title={`Custo: ◆ ${formatNumber(costTicketRate)}`}
                    className={`rounded px-3 py-1 text-sm font-medium transition ${
                      canBuyTicketRate
                        ? "bg-purple-600 text-white hover:bg-purple-500"
                        : "cursor-not-allowed bg-zinc-600 text-zinc-400"
                    }`}
                  >
                    Comprar ranque (◆ {formatNumber(costTicketRate)})
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Base 1 ▲/s; cada ranque ◆ adiciona +1 ▲/s (ranques infinitos).
                </p>
              </div>
              <div className="rounded-lg border border-zinc-600 bg-zinc-700/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-cyan-400" aria-hidden>●</span>
                  <span className="font-medium text-white">Trocar recurso base por +1 ▲/s</span>
                </div>
                <p className="mb-2 text-xs text-zinc-500">
                  Troca permanente: gasta ● e ganha +1 ▲/s. Marcos: 500 → 5k → 5M → 5B → 5T → 5Qa → …
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-800/80 px-3 py-2">
                  <div>
                    <span className="text-sm text-zinc-300">
                      Próximo marco: <span className="font-semibold text-cyan-300">● {formatNumber(tradeCost)}</span>
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      (trocas feitas: {state.ticketTradeMilestoneCount})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "TRADE_BASE_FOR_TICKET_RATE" })}
                    disabled={!canTrade}
                    title={`Trocar ● ${formatNumber(tradeCost)} por +1 ▲/s`}
                    className={`rounded px-3 py-1 text-sm font-medium transition ${
                      canTrade
                        ? "bg-cyan-600 text-white hover:bg-cyan-500"
                        : "cursor-not-allowed bg-zinc-600 text-zinc-400"
                    }`}
                  >
                    Trocar por +1 ▲/s
                  </button>
                </div>
              </div>
            </div>
          ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-600 bg-zinc-700/50 p-3">
              <div className="mb-2 font-medium text-white">
                Melhoria global: custo de compra ÷2
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Reduz o custo (● e gerador anterior) de todos os geradores pela metade. Cada ranque aplica ÷2 de novo.
              </p>
              {(() => {
                const rank = state.upgradeGeneratorCostHalfRank;
                const costHalf = getUpgradeCostGeneratorCostHalf(rank);
                const canBuyHalf = state.milestoneCurrency.gte(costHalf);
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-800/80 px-3 py-2">
                    <div>
                      <span className="text-sm text-zinc-300">
                        Ranque atual: {rank}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "BUY_GENERATOR_COST_HALF_UPGRADE" })}
                      disabled={!canBuyHalf}
                      title={`Custo: ◆ ${formatNumber(costHalf)}`}
                      className={`rounded px-3 py-1 text-sm font-medium transition ${
                        canBuyHalf
                          ? "bg-purple-600 text-white hover:bg-purple-500"
                          : "cursor-not-allowed bg-zinc-600 text-zinc-400"
                      }`}
                    >
                      Comprar ranque (◆ {formatNumber(costHalf)})
                    </button>
                  </div>
                );
              })()}
            </div>
            <ul className="space-y-4">
            {generatorIdsWithUnits.map((id) => {
              const def = GENERATOR_DEFS[id];
              const gen = state.generators.find((g) => g.id === id);
              if (!gen) return null;
              const generatorNumber = parseInt(id.replace("generator", ""), 10);
              const maxCycleRank = getMaxCycleSpeedRank(def.cycleTimeSeconds);
              const cycleRank = gen.upgradeCycleSpeedRank;
              const prodRank = gen.upgradeProductionRank;
              const costCycle =
                cycleRank < maxCycleRank
                  ? getUpgradeCostCycleSpeed(generatorNumber, cycleRank)
                  : null;
              const costProd = getUpgradeCostProduction(generatorNumber, prodRank);
              const canBuyCycle =
                costCycle != null && state.milestoneCurrency.gte(costCycle);
              const canBuyProd = state.milestoneCurrency.gte(costProd);
              const effectiveCycle = getEffectiveCycleTimeSeconds(
                def.cycleTimeSeconds,
                cycleRank
              );

              return (
                <li
                  key={id}
                  className="rounded-lg border border-zinc-600 bg-zinc-700/50 p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-600 text-sm font-bold text-white">
                      {generatorNumber}
                    </div>
                    <span className="font-medium text-white">{def.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-800/80 px-3 py-2">
                      <div>
                        <span className="text-sm text-zinc-300">
                          Tempo de ciclo: {effectiveCycle.toFixed(2)}s
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          (ranque {cycleRank}
                          {maxCycleRank > 0 ? ` / ${maxCycleRank}` : ""})
                        </span>
                      </div>
                      {cycleRank < maxCycleRank ? (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: "BUY_UPGRADE",
                              id,
                              upgradeType: "cycleSpeed",
                            })
                          }
                          disabled={!canBuyCycle}
                          title={
                            costCycle
                              ? `Custo: ◆ ${formatNumber(costCycle)}`
                              : undefined
                          }
                          className={`rounded px-3 py-1 text-sm font-medium transition ${
                            canBuyCycle
                              ? "bg-purple-600 text-white hover:bg-purple-500"
                              : "cursor-not-allowed bg-zinc-600 text-zinc-400"
                          }`}
                        >
                          Comprar ranque (◆ {costCycle ? formatNumber(costCycle) : "—"})
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">Máx.</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-zinc-800/80 px-3 py-2">
                      <div>
                        <span className="text-sm text-zinc-300">
                          Produção por ciclo ×2
                        </span>
                        <span className="ml-2 text-xs text-zinc-500">
                          (ranque {prodRank})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({
                            type: "BUY_UPGRADE",
                            id,
                            upgradeType: "production",
                          })
                        }
                        disabled={!canBuyProd}
                        title={`Custo: ◆ ${formatNumber(costProd)}`}
                        className={`rounded px-3 py-1 text-sm font-medium transition ${
                          canBuyProd
                            ? "bg-purple-600 text-white hover:bg-purple-500"
                            : "cursor-not-allowed bg-zinc-600 text-zinc-400"
                        }`}
                      >
                        Comprar ranque (◆ {formatNumber(costProd)})
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
            </ul>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
