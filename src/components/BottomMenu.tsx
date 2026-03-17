import type { MainView } from "./GameScreen";
import { SettingsMenu } from "./SettingsMenu";

interface BottomMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

export function BottomMenu({ currentView, onNavigate }: BottomMenuProps) {
  return (
    <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-center gap-3 border-t border-zinc-700/80 bg-zinc-800 px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <button
        type="button"
        onClick={() => onNavigate(currentView === "game" ? "upgrades" : "game")}
        className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600"
      >
        {currentView === "game" ? "Melhorias" : "Voltar"}
      </button>

      <SettingsMenu currentView={currentView} onNavigate={onNavigate} />
    </footer>
  );
}
