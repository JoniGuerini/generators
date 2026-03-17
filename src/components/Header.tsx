import { useGameSelector, shallowEqual } from "@/store/useGameStore";
import { useFPS } from "@/hooks/useFPS";
import { formatNumber } from "@/utils/format";
import { BuyModeSelect } from "./BuyModeSelect";

export function Header() {
  const fps = useFPS();
  const { baseResource, ticketCurrency, milestoneCurrency, showFPS } = useGameSelector((state) => ({
    baseResource: state.baseResource,
    ticketCurrency: state.ticketCurrency,
    milestoneCurrency: state.milestoneCurrency,
    showFPS: state.options?.showFPS !== false,
  }), shallowEqual);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-700/80 bg-zinc-800 px-2 py-3 shadow min-h-[64px]">
      {/* Lado esquerdo invisível flex-1 balanceia perfeitamente o título para o centro real */}
      <div className="flex-1"></div>
      
      {/* O centro assume flex-none para ter o tamanho exato dele e ficar esmagado no meio perfeito */}
      <div className="flex-none flex flex-wrap items-center justify-center gap-2 md:gap-4">
        <div
          className="flex h-10 w-[8rem] sm:w-[10rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
          title="Recurso base"
        >
          <span className="shrink-0 text-cyan-400" aria-hidden>
            ●
          </span>
          <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-white">
            {formatNumber(baseResource)}
          </span>
        </div>
        <div
          className="flex h-10 w-[8rem] sm:w-[10rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
          title="Moeda por segundo (1 a cada 1s, para comprar geradores)"
        >
          <span className="shrink-0 text-amber-400" aria-hidden>
            ▲
          </span>
          <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-amber-200">
            {formatNumber(ticketCurrency)}
          </span>
        </div>
        <div
          className="flex h-10 w-[8rem] sm:w-[10rem] items-center gap-2 overflow-hidden rounded-lg border border-zinc-600/80 bg-zinc-700/80 px-3 shadow-sm"
          title="Moeda de marcos (melhorias)"
        >
          <span className="shrink-0 text-purple-400" aria-hidden>
            ◆
          </span>
          <span className="min-w-0 flex-1 truncate text-right text-lg font-semibold tabular-nums text-purple-200">
            {formatNumber(milestoneCurrency)}
          </span>
        </div>
      </div>

      {/* Lado direito flex-1 com conteúdo alinhado à direita (justify-end) compensa o lado esquerdo */}
      <div className="flex-1 flex items-center justify-end gap-3 pr-2">
        {showFPS && (
          <span
            className="flex h-[32px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-3 font-mono text-xs tabular-nums text-zinc-200 sm:text-sm sm:h-[40px]"
            title="Frames por segundo"
          >
            <span className={fps >= 55 ? "text-green-400" : fps >= 30 ? "text-amber-400" : "text-red-400"}>
              {fps}
            </span>
            <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs">FPS</span>
          </span>
        )}
        <BuyModeSelect />
      </div>
    </header>
  );
}
