import { useState, useEffect, useCallback } from "react";
import { useT } from "@/locale";
import { LOCALE_OPTIONS } from "@/locale";

interface SettingsOptions {
  showFPS: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  sfxStyle: string;
  locale: string;
}

interface SettingsMenuProps {
  options: SettingsOptions;
  dispatch: (action: any) => void;
  showDocsButton?: boolean;
  onDocsClick?: () => void;
}

type MenuTab = "geral" | "sons" | "jogo";

export function SettingsMenu({ options, dispatch, showDocsButton, onDocsClick }: SettingsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<MenuTab>("geral");
  const [confirmingReset, setConfirmingReset] = useState(false);
  const t = useT();

  const sfxStyleOptions = [
    { value: "soft", label: t.sound.soft },
    { value: "mechanical", label: t.sound.mechanical },
  ];

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
        {t.settings.menu}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={close} />

          <div className="relative z-10 flex h-[580px] w-[90vw] max-w-[480px] flex-col overflow-hidden rounded-xl border border-zinc-600/80 bg-zinc-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-700/80 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">{t.settings.menu}</h2>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 px-4 pt-3 pb-2">
              <TabButton active={tab === "geral"} onClick={() => { setTab("geral"); setConfirmingReset(false); }}>
                {t.settings.general}
              </TabButton>
              <TabButton active={tab === "sons"} onClick={() => { setTab("sons"); setConfirmingReset(false); }}>
                {t.settings.sounds}
              </TabButton>
              <TabButton active={tab === "jogo"} onClick={() => { setTab("jogo"); setConfirmingReset(false); }}>
                {t.settings.game}
              </TabButton>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              {tab === "geral" && (
                <>
                  <SelectOption
                    label={t.settings.language}
                    value={options.locale}
                    options={LOCALE_OPTIONS}
                    onChange={(v) => dispatch({ type: "SET_LOCALE", locale: v })}
                  />
                  <ToggleOption
                    label={t.settings.showFps}
                    description={t.settings.showFpsDesc}
                    checked={options.showFPS}
                    onChange={() => dispatch({ type: "TOGGLE_FPS" })}
                  />
                  {showDocsButton && onDocsClick && (
                    <MenuButton
                      label={t.settings.documentation}
                      description={t.settings.documentationDesc}
                      onClick={() => { onDocsClick(); close(); }}
                    />
                  )}
                  <div className="my-1 h-[1px] w-full bg-zinc-700/50" />
                  <MenuButton
                    label={t.settings.resetSettings}
                    description={t.settings.resetSettingsDesc}
                    onClick={() => dispatch({ type: "RESET_OPTIONS" })}
                  />
                </>
              )}

              {tab === "sons" && (
                <>
                  <ToggleOption
                    label={t.settings.sfxEnabled}
                    description={t.settings.sfxEnabledDesc}
                    checked={options.sfxEnabled}
                    onChange={() => dispatch({ type: "TOGGLE_SFX" })}
                  />
                  <SliderOption
                    label={t.settings.volume}
                    value={options.sfxVolume}
                    onChange={(v) => dispatch({ type: "SET_SFX_VOLUME", volume: v })}
                    disabled={!options.sfxEnabled}
                  />
                  <SelectOption
                    label={t.settings.style}
                    value={options.sfxStyle}
                    options={sfxStyleOptions}
                    onChange={(v) => dispatch({ type: "SET_SFX_STYLE", style: v })}
                    disabled={!options.sfxEnabled}
                  />
                </>
              )}

              {tab === "jogo" && (
                <>
                  {!confirmingReset ? (
                    <MenuButton
                      label={t.settings.resetGame}
                      description={t.settings.resetGameDesc}
                      variant="danger"
                      onClick={() => setConfirmingReset(true)}
                    />
                  ) : (
                    <div className="flex flex-col gap-2 rounded-lg border border-red-500/50 bg-red-950/40 p-4">
                      <span className="text-sm font-medium text-red-300">{t.settings.resetConfirmText}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { dispatch({ type: "RESET_GAME" }); close(); }}
                          className="btn-3d btn-3d--red flex-1 rounded-lg bg-red-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600"
                        >
                          {t.settings.confirm}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingReset(false)}
                          className="btn-3d btn-3d--zinc flex-1 rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-600"
                        >
                          {t.settings.cancel}
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

function SliderOption({ label, value, onChange, disabled }: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`btn-3d--zinc flex flex-col gap-2 rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-200">{label}</span>
        <span className="text-sm tabular-nums text-zinc-400">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-600 accent-violet-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-500"
      />
    </div>
  );
}

function SelectOption({ label, value, options, onChange, disabled }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const currentLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className={`flex flex-col gap-2 ${disabled ? "opacity-40 pointer-events-none" : ""}`}>
      <div className="group/sfx relative">
        <button
          type="button"
          disabled={disabled}
          className="btn-3d btn-3d--zinc flex w-full items-center justify-between rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-3 text-sm text-zinc-200 hover:bg-zinc-600"
        >
          <span className="font-medium">{label}</span>
          <span className="text-zinc-400">{currentLabel}</span>
        </button>
        <div className="pointer-events-none absolute top-full left-0 right-0 z-50 pt-2 opacity-0 transition-opacity duration-100 group-hover/sfx:pointer-events-auto group-hover/sfx:opacity-100">
          <div className="flex flex-col gap-2">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`btn-3d flex h-[40px] w-full items-center justify-center rounded-lg text-sm font-medium transition ${
                  value === opt.value
                    ? "btn-3d--violet bg-violet-600 text-white"
                    : "btn-3d--zinc bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
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
