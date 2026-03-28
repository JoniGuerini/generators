import Decimal from "break_eternity.js";
import { useGameSelector, shallowEqual } from "@/store/useGameStore";
import { useFPS } from "@/hooks/useFPS";
import { formatNumber } from "@/utils/format";
import { getTicketsPerSecond } from "@/engine/upgrades";

export function Header() {
  const fps = useFPS();
  const { baseResource, ticketCurrency, milestoneCurrency, prestigePoints, showFPS, ticketsPerSec } = useGameSelector((state) => ({
    baseResource: state.baseResource,
    ticketCurrency: state.ticketCurrency,
    milestoneCurrency: state.milestoneCurrency,
    prestigePoints: state.prestigePoints,
    showFPS: state.options?.showFPS === true,
    ticketsPerSec: getTicketsPerSecond(
      state.upgradeTicketRateRank,
      state.ticketTradeMilestoneCount,
      state.upgradeTicketMultiplierRank
    ),
  }), shallowEqual);

  return (
    <header className="sticky top-0 z-20 flex items-center bg-[#0D0D0D] px-2 py-3 shadow min-h-[64px]">
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-2 md:gap-4">
        {/* Recurso base */}
        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title="Recurso base"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 text-xs" aria-hidden>●</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Recurso</span>
          </div>
          <span className="truncate text-lg font-bold tabular-nums text-white">
            {formatNumber(baseResource)}
          </span>
        </div>

        {/* Tickets */}
        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title={`Tickets — ${formatNumber(Decimal.fromNumber(ticketsPerSec))}/s`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-xs" aria-hidden>▲</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Tickets</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold tabular-nums text-amber-200">
              {formatNumber(ticketCurrency)}
            </span>
            <span className="text-xs font-semibold tabular-nums text-amber-400/80">
              +{formatNumber(Decimal.fromNumber(ticketsPerSec))}/s
            </span>
          </div>
        </div>

        {/* Moeda de marcos */}
        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title="Pontos de melhoria"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-xs" aria-hidden>◆</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Melhorias</span>
          </div>
          <span className="truncate text-lg font-bold tabular-nums text-purple-200">
            {formatNumber(milestoneCurrency)}
          </span>
        </div>

        {/* Pontos de prestígio */}
        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title="Pontos de prestígio (1 ponto a cada 1 Dc de recurso)"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-amber-500 text-xs" aria-hidden>★</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Prestígio</span>
          </div>
          <span className="truncate text-lg font-bold tabular-nums text-amber-100">
            {formatNumber(prestigePoints)}
          </span>
        </div>
      </div>

      {/* FPS — canto direito, mesmo estilo dos cards */}
      {showFPS && (
        <div
          className="ml-2 flex w-[8rem] shrink-0 flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title="Frames por segundo"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">FPS</span>
          </div>
          <span className={`text-lg font-bold tabular-nums ${fps >= 55 ? "text-green-400" : fps >= 30 ? "text-amber-400" : "text-red-400"}`}>
            {fps}
          </span>
        </div>
      )}
    </header>
  );
}
