import { useGameState, useGameDispatch } from "@/store/useGameStore";
import { useFPS } from "@/hooks/useFPS";
import { formatNumber } from "@/utils/format";
import { BuyModeSelect } from "./BuyModeSelect";
import type { MainView } from "./GameScreen";

interface HeaderProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

export function Header({ currentView, onNavigate }: HeaderProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const fps = useFPS();
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-zinc-700/80 bg-zinc-800 px-2 py-2 shadow">
        <div className="flex items-center gap-2">
          <div
            className="flex h-10 w-[8rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
            title="Recurso base"
          >
            <span className="shrink-0 text-cyan-400" aria-hidden>
              ●
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-white">
              {formatNumber(state.baseResource)}
            </span>
          </div>
          <div
            className="flex h-10 w-[8rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
            title="Moeda por segundo (1 a cada 1s, para comprar geradores)"
          >
            <span className="shrink-0 text-amber-400" aria-hidden>
              ▲
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-amber-200">
              {formatNumber(state.ticketCurrency)}
            </span>
          </div>
          <div
            className="flex h-10 w-[8rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
            title="Moeda de marcos (melhorias)"
          >
            <span className="shrink-0 text-purple-400" aria-hidden>
              ◆
            </span>
            <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-purple-200">
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
          onClick={() => onNavigate(currentView === "game" ? "upgrades" : "game")}
          className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 transition hover:bg-zinc-600"
        >
          {currentView === "game" ? "Melhorias" : "Voltar"}
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
  );
}
