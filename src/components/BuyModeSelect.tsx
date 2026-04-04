import { useRef, useCallback } from "react";
import { useBuyMode } from "@/contexts/BuyModeContext";
import type { BuyMode, UpgradeBuyMode } from "@/contexts/BuyModeContext";
import { useT } from "@/locale";

export type BuyModeSelectVariant = "generators" | "upgrades";

interface BuyModeSelectProps {
  variant?: BuyModeSelectVariant;
}

export function BuyModeSelect({ variant = "generators" }: BuyModeSelectProps) {
  const { buyMode, setBuyMode, upgradeBuyMode, setUpgradeBuyMode } = useBuyMode();
  const t = useT();

  const generatorOptions: { value: BuyMode; label: string }[] = [
    { value: "1x", label: "1x" },
    { value: "1%", label: "1%" },
    { value: "10%", label: "10%" },
    { value: "50%", label: "50%" },
    { value: "100%", label: "100%" },
    { value: "marco", label: t.buyMode.marco },
    { value: "proximo", label: t.buyMode.proximo },
  ];

  const upgradeOptions: { value: UpgradeBuyMode; label: string }[] = [
    { value: "1x", label: "1x" },
    { value: "10x", label: "10x" },
    { value: "50x", label: "50x" },
    { value: "100%", label: "100%" },
  ];

  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const isUpgrades = variant === "upgrades";
  const currentLabel = isUpgrades
    ? upgradeOptions.find((o) => o.value === upgradeBuyMode)?.label ?? upgradeBuyMode
    : generatorOptions.find((o) => o.value === buyMode)?.label ?? buyMode;
  const ariaLabel = isUpgrades ? t.upgradeBuyMode.ariaLabel : t.buyMode.ariaLabel;

  return (
    <div
      className="group/select relative inline-block w-[160px]"
      ref={containerRef}
      onMouseEnter={cancelClose}
      onMouseLeave={() => {
        closeTimerRef.current = setTimeout(() => {}, 150);
      }}
    >
      <button
        type="button"
        className="btn-3d btn-3d--zinc flex h-[40px] w-full min-w-0 items-center justify-center gap-2 rounded-md border border-zinc-600 bg-zinc-700 px-3 text-sm text-zinc-200 hover:bg-zinc-600 focus:outline-none focus:ring-0"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
      >
        {currentLabel}
      </button>
      <div className="pointer-events-none absolute bottom-full left-0 right-0 z-50 pb-2 opacity-0 transition-opacity duration-100 group-hover/select:pointer-events-auto group-hover/select:opacity-100">
        <ul role="listbox" className="flex flex-col-reverse gap-2">
          {isUpgrades
            ? upgradeOptions.map(({ value, label }) => (
                <li key={value} role="option" aria-selected={upgradeBuyMode === value}>
                  <button
                    type="button"
                    onClick={() => setUpgradeBuyMode(value)}
                    className={`btn-3d flex h-[40px] w-full items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                      upgradeBuyMode === value
                        ? "btn-3d--purple bg-purple-600 text-white"
                        : "btn-3d--zinc bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))
            : generatorOptions.map(({ value, label }) => (
                <li key={value} role="option" aria-selected={buyMode === value}>
                  <button
                    type="button"
                    onClick={() => setBuyMode(value)}
                    className={`btn-3d flex h-[40px] w-full items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                      buyMode === value
                        ? "btn-3d--purple bg-purple-600 text-white"
                        : "btn-3d--zinc bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                    }`}
                  >
                    {label}
                  </button>
                </li>
              ))}
        </ul>
      </div>
    </div>
  );
}
