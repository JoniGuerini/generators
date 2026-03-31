import type { MainView } from "./GameScreen";
import { SettingsMenu } from "./SettingsMenu";
import { BuyModeSelect } from "./BuyModeSelect";
import { useT } from "@/locale";

interface BottomMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
  options: { showFPS: boolean; sfxEnabled: boolean; sfxVolume: number; locale: string };
  dispatch: (action: any) => void;
}

export function BottomMenu({ currentView, onNavigate, options, dispatch }: BottomMenuProps) {
  const t = useT();
  const isSubPage = currentView !== "game";

  return (
    <footer className="sticky bottom-0 z-20 flex items-center bg-[#0D0D0D] px-2 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex-1" />

      <div className="flex items-center justify-center gap-3">
        {isSubPage ? (
          <button
            type="button"
            onClick={() => onNavigate("game")}
            className="btn-3d btn-3d--violet flex h-[40px] w-[120px] items-center justify-center rounded-md bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
          >
            {t.footer.back}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onNavigate("trades")}
              className="btn-3d btn-3d--zinc flex h-[40px] w-[120px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
            >
              {t.footer.trades}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("upgrades")}
              className="btn-3d btn-3d--zinc flex h-[40px] w-[120px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
            >
              {t.footer.upgrades}
            </button>
          </>
        )}

        <SettingsMenu
          options={options}
          dispatch={dispatch}
          showDocsButton={currentView !== "docs"}
          onDocsClick={() => onNavigate("docs")}
        />
      </div>

      <div className="flex-1 flex justify-end">
        <BuyModeSelect />
      </div>
    </footer>
  );
}
