import Decimal from "break_eternity.js";
import type { MainView } from "./GameScreen";
import { SettingsMenu } from "./SettingsMenu";
import { BuyModeSelect } from "./BuyModeSelect";
import { useT } from "@/locale";
import { useGameSelector } from "@/store/useGameStore";
import { isLineUnlocked } from "@/store/gameState";
import { LINE_COUNT } from "@/engine/constants";
import { getMaxAffordableTrades } from "@/engine/upgrades";
import { formatNumber } from "@/utils/format";

interface BottomMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
  options: { showFPS: boolean; sfxEnabled: boolean; sfxVolume: number; locale: string };
  dispatch: (action: any) => void;
}

export function BottomMenu({ currentView, onNavigate, options, dispatch }: BottomMenuProps) {
  const t = useT();

  const totalPendingTrades = useGameSelector((state) => {
    let total = 0;
    for (let ln = 1; ln <= LINE_COUNT; ln++) {
      if (!isLineUnlocked(state, ln)) continue;
      const count = state.lineTicketTradeCounts[ln] ?? 0;
      const resource = state.lineResources[ln] ?? Decimal.dZero;
      const { trades } = getMaxAffordableTrades(count, resource);
      total += trades;
    }
    return total;
  });

  return (
    <footer className="sticky bottom-0 z-20 flex items-center bg-[#0D0D0D] px-2 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex-1" />

      <div className="flex items-center justify-center gap-3">
        {currentView === "docs" && (
          <button
            type="button"
            onClick={() => onNavigate("game")}
            className="btn-3d btn-3d--violet flex h-[40px] w-[120px] items-center justify-center rounded-md bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
          >
            {t.footer.back}
          </button>
        )}
        <div className="relative">
          {totalPendingTrades > 0 && currentView !== "trades" && (
            <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1">
              <span className="text-[10px] font-bold tabular-nums text-white">
                {formatNumber(Decimal.fromNumber(totalPendingTrades))}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => onNavigate(currentView === "trades" ? "game" : "trades")}
            className={`btn-3d flex h-[40px] w-[120px] items-center justify-center rounded-md px-4 text-sm font-medium ${
              currentView === "trades"
                ? "btn-3d--violet bg-violet-600 text-white hover:bg-violet-500"
                : "btn-3d--zinc border border-zinc-600 bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
            }`}
          >
            {currentView === "trades" ? t.footer.back : t.footer.trades}
          </button>
        </div>
        <button
          type="button"
          onClick={() => onNavigate(currentView === "upgrades" ? "game" : "upgrades")}
          className={`btn-3d flex h-[40px] w-[120px] items-center justify-center rounded-md px-4 text-sm font-medium ${
            currentView === "upgrades"
              ? "btn-3d--violet bg-violet-600 text-white hover:bg-violet-500"
              : "btn-3d--zinc border border-zinc-600 bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
          }`}
        >
          {currentView === "upgrades" ? t.footer.back : t.footer.upgrades}
        </button>

        <SettingsMenu
          options={options}
          dispatch={dispatch}
          showDocsButton={currentView !== "docs"}
          onDocsClick={() => onNavigate("docs")}
        />
      </div>

      <div className="flex-1 flex justify-end">
        <BuyModeSelect variant={currentView === "upgrades" ? "upgrades" : "generators"} />
      </div>
    </footer>
  );
}
