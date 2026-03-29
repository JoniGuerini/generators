import { useState, useEffect, useCallback } from "react";
import { useGameSelector, useGameDispatch } from "@/store/useGameStore";
import type { MainView } from "./GameScreen";

interface SettingsMenuProps {
  currentView: MainView;
  onNavigate: (view: MainView) => void;
}

type MenuTab = "geral" | "jogo";

export function SettingsMenu({ currentView, onNavigate }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>("geral");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const showFPS = useGameSelector((state) => state.options?.showFPS ?? false);
  const dispatch = useGameDispatch();

  const close = useCallback(() => { setIsOpen(false); setConfirmingReset(false); }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => { setIsOpen(true); setTab("geral"); }}
        className="btn-3d btn-3d--zinc flex h-[40px] w-[120px] items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
      >
        Menu
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={close} />

          <div className="relative z-10 flex h-[420px] w-[90vw] max-w-[480px] flex-col overflow-hidden rounded-xl border border-zinc-600/80 bg-zinc-800 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-700/80 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 px-4 pt-3 pb-2">
              <TabButton active={tab === "geral"} onClick={() => { setTab("geral"); setConfirmingReset(false); }}>
                Geral
              </TabButton>
              <TabButton active={tab === "jogo"} onClick={() => { setTab("jogo"); setConfirmingReset(false); }}>
                Jogo
              </TabButton>
            </div>

            {/* Conteúdo */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {tab === "geral" && (
                <>
                  <ToggleOption
                    label="Exibir FPS"
                    description="Mostra o contador de frames por segundo"
                    checked={showFPS}
                    onChange={() => dispatch({ type: "TOGGLE_FPS" })}
                  />
                  {currentView !== "docs" && (
                    <MenuButton
                      label="Documentação"
                      description="Regras e mecânicas do jogo"
                      onClick={() => { onNavigate("docs"); close(); }}
                    />
                  )}
                  <div className="my-1 h-[1px] w-full bg-zinc-700/50" />
                  <MenuButton
                    label="Resetar Configurações"
                    description="Restaura todas as opções para o padrão"
                    onClick={() => dispatch({ type: "RESET_OPTIONS" })}
                  />
                </>
              )}

              {tab === "jogo" && (
                <>
                  {!confirmingReset ? (
                    <MenuButton
                      label="Resetar Jogo"
                      description="Apaga todo o progresso e recomeça do zero"
                      variant="danger"
                      onClick={() => setConfirmingReset(true)}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 rounded-lg border border-red-500/50 bg-red-950/40 p-4">
                      <span className="text-sm font-medium text-red-300">Tem certeza? Todo o progresso será perdido.</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { dispatch({ type: "RESET_GAME" }); close(); }}
                          className="btn-3d btn-3d--red flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingReset(false)}
                          className="btn-3d btn-3d--zinc flex-1 rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({ active, onClick, children }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-3d flex-1 rounded-lg px-4 py-2.5 text-sm font-medium ${
        active
          ? "btn-3d--violet bg-violet-600 text-white"
          : "btn-3d--zinc bg-zinc-700 text-zinc-400 hover:bg-zinc-600 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

function ToggleOption({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="btn-3d btn-3d--zinc flex cursor-pointer items-center justify-between rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 hover:bg-zinc-600">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        {description && (
          <span className="text-xs text-zinc-500">{description}</span>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 cursor-pointer rounded border-zinc-500 bg-zinc-700 text-indigo-500 focus:ring-1 focus:ring-indigo-500"
      />
    </label>
  );
}

function MenuButton({ label, description, variant = "default", onClick }: {
  label: string;
  description?: string;
  variant?: "default" | "danger";
  onClick: () => void;
}) {
  const isDanger = variant === "danger";
  const classes = isDanger
    ? "btn-3d btn-3d--red bg-red-700 text-white hover:bg-red-600"
    : "btn-3d btn-3d--zinc bg-zinc-700 text-zinc-200 hover:bg-zinc-600";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full flex-col gap-0.5 rounded-lg border border-zinc-600 px-4 py-3 text-left ${classes}`}
    >
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className={`text-xs ${isDanger ? "text-red-100/80" : "text-zinc-500"}`}>{description}</span>
      )}
    </button>
  );
}
