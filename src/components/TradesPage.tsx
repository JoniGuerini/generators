import Decimal from "break_eternity.js";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import { isLineUnlocked, getLineUnlockRequirement } from "@/store/gameState";
import { getLineColor, LINE_COLOR_CLASSES, LINE_COUNT } from "@/engine/constants";
import { getTicketsPerSecond, getTicketTradeThreshold, getMaxAffordableTrades } from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";
import { useT } from "@/locale";

const BUTTON_WIDTH = 120;

export function TradesPage() {
  const dispatch = useGameDispatch();
  const t = useT();

  const { lineResources, lineTicketTradeCounts, upgradeTicketMultiplierRank, upgradeTicketTradeDoublerRank, unlockedLines } = useGameSelector((state) => ({
    lineResources: state.lineResources,
    lineTicketTradeCounts: state.lineTicketTradeCounts,
    upgradeTicketMultiplierRank: state.upgradeTicketMultiplierRank,
    upgradeTicketTradeDoublerRank: state.upgradeTicketTradeDoublerRank,
    unlockedLines: Array.from({ length: LINE_COUNT }, (_, i) => isLineUnlocked(state, i + 1)),
  }), (a, b) =>
    a.lineResources === b.lineResources &&
    a.lineTicketTradeCounts === b.lineTicketTradeCounts &&
    a.upgradeTicketMultiplierRank === b.upgradeTicketMultiplierRank &&
    a.upgradeTicketTradeDoublerRank === b.upgradeTicketTradeDoublerRank &&
    a.unlockedLines.every((v, i) => v === b.unlockedLines[i])
  );

  const totalTrades = Object.values(lineTicketTradeCounts).reduce((s, c) => s + c, 0);
  const ticketsPerSec = getTicketsPerSecond(totalTrades, upgradeTicketMultiplierRank, upgradeTicketTradeDoublerRank);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-3 pb-4 scrollbar-none">
        <div className="mx-auto max-w-5xl grid grid-cols-2 gap-2">
          {Array.from({ length: LINE_COUNT }, (_, i) => i + 1).map((ln) => {
            const lnColor = getLineColor(ln);
            const lnClasses = LINE_COLOR_CLASSES[lnColor];
            const unlocked = unlockedLines[ln - 1];

            if (!unlocked) {
              const req = getLineUnlockRequirement(ln);
              return (
                <div key={ln} className="flex items-center gap-2 opacity-60">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-zinc-500 bg-zinc-800/60 text-sm font-bold text-zinc-400">{ln}</div>
                  <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-dashed border-zinc-500 bg-zinc-900/40 px-3 py-3">
                    <span className="text-xs text-zinc-400">
                      {req ? t.upgradesPage.requiresGen(req.gen, req.line) : t.upgradesPage.tradeLineLockedDesc}
                    </span>
                  </div>
                </div>
              );
            }

            const lnTradeCount = lineTicketTradeCounts[ln] ?? 0;
            const lnResource = lineResources[ln] ?? Decimal.dZero;
            const lnTradeCost = getTicketTradeThreshold(lnTradeCount);
            const { trades: lnAffordable } = getMaxAffordableTrades(lnTradeCount, lnResource);
            const nextAfterTrade = getTicketsPerSecond(totalTrades + 1, upgradeTicketMultiplierRank, upgradeTicketTradeDoublerRank);
            return (
              <div key={ln} className="flex items-center gap-2">
                <div className={`btn-3d ${lnClasses.btn3d} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${lnClasses.bg} text-sm font-bold text-white`} aria-hidden>{ln}</div>
                <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-between gap-3 rounded-lg bg-zinc-900/70 px-3 py-1.5">
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{t.upgradesPage.tradeForTickets}</span>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <span className="text-zinc-400">{formatNumber(Decimal.fromNumber(ticketsPerSec))}</span>
                        <span className="text-amber-400/80">→</span>
                        <span className="text-white">{formatNumber(Decimal.fromNumber(nextAfterTrade))}</span>
                        <span className="text-amber-500/60 text-[10px]">▲/s</span>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-zinc-500">
                    {lnTradeCount}
                  </span>
                  <div className="relative shrink-0" style={{ minWidth: BUTTON_WIDTH }}>
                    {lnAffordable > 0 && (
                      <div
                        className="btn-3d--zinc absolute -right-1 -top-1.5 z-20 flex h-4 min-w-[14px] items-center justify-center rounded bg-white px-1"
                        aria-hidden
                      >
                        <span className={`text-[10px] font-bold tabular-nums ${lnClasses.textDark}`}>
                          {lnAffordable}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "TRADE_BASE_FOR_TICKET_RATE", line: ln })}
                      disabled={lnAffordable <= 0}
                      className={`btn-3d ${lnAffordable > 0 ? lnClasses.btn3d : "btn-3d--zinc"} relative flex h-9 w-full items-center justify-center overflow-hidden rounded-lg px-3 text-sm font-medium text-white whitespace-nowrap touch-manipulation select-none ${lnAffordable <= 0 ? "cursor-default" : ""}`}
                      style={{ minWidth: BUTTON_WIDTH }}
                    >
                      <div className="absolute inset-0 bg-zinc-700" />
                      <div
                        className={`absolute inset-y-0 left-0 ${lnClasses.bg} transition-[width] duration-300 ease-linear`}
                        style={{ width: `${Math.min(lnTradeCost.gt(0) ? lnResource.div(lnTradeCost).toNumber() * 100 : 0, 100)}%` }}
                      />
                      <span className="relative z-10 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                        {lnAffordable > 0 ? `+${lnAffordable} ▲/s` : "+1 ▲/s"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
