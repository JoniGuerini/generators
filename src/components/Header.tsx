import Decimal from "break_eternity.js";
import { useGameSelector, shallowEqual } from "@/store/useGameStore";
import { useFPS } from "@/hooks/useFPS";
import { formatNumber } from "@/utils/format";
import { getTicketsPerSecond } from "@/engine/upgrades";
import { getTotalTicketTrades } from "@/store/gameState";
import { useT } from "@/locale";

export function Header() {
  const fps = useFPS();
  const t = useT();
  const { totalResources, ticketCurrency, milestoneCurrency, showFPS, ticketsPerSec } = useGameSelector((state) => ({
    totalResources: Object.values(state.lineResources).reduce((sum, v) => sum.add(v), Decimal.dZero),
    ticketCurrency: state.ticketCurrency,
    milestoneCurrency: state.milestoneCurrency,
    showFPS: state.options?.showFPS === true,
    ticketsPerSec: getTicketsPerSecond(
      getTotalTicketTrades(state),
      state.upgradeTicketMultiplierRank,
    ),
  }), shallowEqual);

  return (
    <header className="sticky top-0 z-20 relative flex items-center justify-center bg-[#0D0D0D] px-2 py-3 shadow min-h-[64px]">
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title={t.header.resourceTooltip}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-cyan-400 text-xs" aria-hidden>●</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.header.resource}</span>
          </div>
          <span className="truncate text-lg font-bold tabular-nums text-white">
            {formatNumber(totalResources)}
          </span>
        </div>

        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title={`${t.header.ticketsTooltip} — ${formatNumber(Decimal.fromNumber(ticketsPerSec))}/s`}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 text-xs" aria-hidden>▲</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.header.tickets}</span>
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

        <div
          className="flex w-[8rem] sm:w-[10rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title={t.header.upgradesTooltip}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-purple-400 text-xs" aria-hidden>◆</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.header.upgrades}</span>
          </div>
          <span className="truncate text-lg font-bold tabular-nums text-purple-200">
            {formatNumber(milestoneCurrency)}
          </span>
        </div>
      </div>

      {showFPS && (
        <div
          className="absolute right-2 top-1/2 -translate-y-1/2 flex w-[5rem] flex-col gap-0.5 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 py-1.5 shadow-sm"
          title={t.header.fpsTooltip}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{t.header.fps}</span>
          </div>
          <span className={`text-lg font-bold tabular-nums ${fps >= 55 ? "text-green-400" : fps >= 30 ? "text-amber-400" : "text-red-400"}`}>
            {fps}
          </span>
        </div>
      )}
    </header>
  );
}
