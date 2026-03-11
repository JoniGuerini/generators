import { useRef, useState, useEffect } from "react";
import { useBuyMode } from "@/contexts/BuyModeContext";
import type { BuyMode } from "@/contexts/BuyModeContext";

const OPTIONS: { value: BuyMode; label: string }[] = [
  { value: "1x", label: "1x" },
  { value: "1%", label: "1%" },
  { value: "10%", label: "10%" },
  { value: "50%", label: "50%" },
  { value: "100%", label: "100%" },
];

export function BuyModeSelect() {
  const { buyMode, setBuyMode } = useBuyMode();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const currentLabel = OPTIONS.find((o) => o.value === buyMode)?.label ?? buyMode;

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="header-buy-select flex h-[40px] w-full min-w-0 items-center rounded-md border border-zinc-600 bg-zinc-700 pl-3 text-left text-sm text-zinc-200 transition hover:bg-zinc-600 focus:outline-none focus:ring-0"
        aria-label="Quantidade a comprar por clique"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentLabel}
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-zinc-600 bg-zinc-800 py-1 shadow-lg"
        >
          {OPTIONS.map(({ value, label }) => (
            <li
              key={value}
              role="option"
              aria-selected={buyMode === value}
              onClick={() => {
                setBuyMode(value);
                setOpen(false);
              }}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-600 ${buyMode === value ? "bg-zinc-700/80" : ""}`}
            >
              {buyMode === value ? (
                <span className="text-lime-400" aria-hidden>
                  ✓
                </span>
              ) : (
                <span className="w-[1ch]" aria-hidden />
              )}
              {label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
