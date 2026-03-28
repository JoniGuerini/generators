import type { MainView } from "./GameScreen";
import { SettingsMenu } from "./SettingsMenu";
import { BuyModeSelect } from "./BuyModeSelect";

interface BottomMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

export function BottomMenu({ currentView, onNavigate }: BottomMenuProps) {
  return (
    <footer className="sticky bottom-0 z-20 flex items-center bg-[#0D0D0D] px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <div className="flex-1" />

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => onNavigate(currentView === "game" ? "upgrades" : "game")}
          className="btn-3d btn-3d--zinc flex h-[40px] w-[120px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
        >
          {currentView === "game" ? "Melhorias" : "Voltar"}
        </button>

        <SettingsMenu currentView={currentView} onNavigate={onNavigate} />
      </div>

      <div className="flex-1 flex justify-end">
        <BuyModeSelect />
      </div>
    </footer>
  );
}
