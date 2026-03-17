import { useState, useRef, useEffect } from "react";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import type { MainView } from "./GameScreen";

interface SettingsMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

export function SettingsMenu({ currentView, onNavigate }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const showFPS = useGameSelector((state) => state.options?.showFPS ?? true);
  const dispatch = useGameDispatch();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu ao clicar fora dele
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-[40px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 transition hover:bg-zinc-600"
      >
        Menu
      </button>

      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] right-0 flex w-48 flex-col gap-2 rounded-lg border border-zinc-700/80 bg-zinc-800 p-2 shadow-lg">
          <label className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-700/50">
            <span>Exibir FPS</span>
            <input
              type="checkbox"
              checked={showFPS} // Fallback caso tenha state antigo sem options
              onChange={() => dispatch({ type: "TOGGLE_FPS" })}
              className="h-4 w-4 cursor-pointer rounded border-zinc-500 bg-zinc-700 text-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </label>

          <div className="my-1 h-[1px] w-full bg-zinc-700/50" />

          {currentView !== "docs" && (
            <button
              type="button"
              onClick={() => {
                onNavigate("docs");
                setIsOpen(false);
              }}
              className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-zinc-200 transition hover:bg-zinc-700/50"
            >
              Documentação
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              dispatch({ type: "RESET_GAME" });
              setIsOpen(false);
            }}
            className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm font-medium text-red-400 transition hover:bg-red-900/20"
          >
            Resetar Jogo
          </button>
        </div>
      )}
    </div>
  );
}
