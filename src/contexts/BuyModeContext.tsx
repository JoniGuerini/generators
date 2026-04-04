import { createContext, useContext, useState, type ReactNode } from "react";

export type BuyMode = "1x" | "1%" | "10%" | "50%" | "100%" | "marco" | "proximo";

/** Multi-compra na página Melhorias (custos em ◆ escalonam por ranque). */
export type UpgradeBuyMode = "1x" | "10x" | "50x" | "100%";

const BuyModeContext = createContext<{
  buyMode: BuyMode;
  setBuyMode: (m: BuyMode) => void;
  upgradeBuyMode: UpgradeBuyMode;
  setUpgradeBuyMode: (m: UpgradeBuyMode) => void;
} | null>(null);

export function BuyModeProvider({ children }: { children: ReactNode }) {
  const [buyMode, setBuyMode] = useState<BuyMode>("1x");
  const [upgradeBuyMode, setUpgradeBuyMode] = useState<UpgradeBuyMode>("1x");
  return (
    <BuyModeContext.Provider
      value={{ buyMode, setBuyMode, upgradeBuyMode, setUpgradeBuyMode }}
    >
      {children}
    </BuyModeContext.Provider>
  );
}

export function useBuyMode() {
  const ctx = useContext(BuyModeContext);
  if (!ctx) throw new Error("useBuyMode must be used within BuyModeProvider");
  return ctx;
}
