import { useState } from "react";
import { useGameState, useGameDispatch } from "@/store/useGameStore";
import { useFPS } from "@/hooks/useFPS";
import { formatNumber } from "@/utils/format";
import { BuyModeSelect } from "./BuyModeSelect";
import { UpgradesModal } from "./UpgradesModal";

export function Header() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const fps = useFPS();
  const [showUpgrades, setShowUpgrades] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-700/80 bg-zinc-800 px-2 py-2 shadow">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400" aria-hidden>
              ●
            </span>
            <span className="text-xl font-semibold tabular-nums text-white">
              {formatNumber(state.baseResource)}
            </span>
          </div>
          <div className="flex items-center gap-2" title="Moeda por segundo (1 a cada 1s, para comprar geradores)">
            <span className="text-amber-400" aria-hidden>
              ▲
            </span>
            <span className="text-lg font-semibold tabular-nums text-amber-200">
              {formatNumber(state.ticketCurrency)}
            </span>
          </div>
          <div
            className="flex items-center gap-2"
            title="Moeda de marcos (melhorias)"
          >
            <span className="text-purple-400" aria-hidden>
              ◆
            </span>
            <span className="text-lg font-semibold tabular-nums text-purple-200">
              {formatNumber(state.milestoneCurrency)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BuyModeSelect />
        <span
          className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-3 font-mono text-sm tabular-nums text-zinc-200"
          title="Frames por segundo"
        >
          <span className={fps >= 55 ? "text-green-400" : fps >= 30 ? "text-amber-400" : "text-red-400"}>
            {fps}
          </span>
          <span className="ml-2">FPS</span>
        </span>
        <button
          type="button"
          onClick={() => setShowUpgrades(true)}
          className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 transition hover:bg-zinc-600"
        >
          Melhorias
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET_GAME" })}
          className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 transition hover:bg-zinc-600"
        >
          Resetar
        </button>
      </div>
    </header>
      {showUpgrades && (
        <UpgradesModal onClose={() => setShowUpgrades(false)} />
      )}
    </>
  );
}
