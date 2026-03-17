import { createContext, useContext, useState, type ReactNode } from "react";

export type BuyMode = "1x" | "1%" | "10%" | "50%" | "100%" | "marco";

const BuyModeContext = createContext<
  { buyMode: BuyMode; setBuyMode: (m: BuyMode) => void } | null
>(null);

export function BuyModeProvider({ children }: { children: ReactNode }) {
  const [buyMode, setBuyMode] = useState<BuyMode>("1x");
  return (
    <BuyModeContext.Provider value={{ buyMode, setBuyMode }}>
      {children}
    </BuyModeContext.Provider>
  );
}

export function useBuyMode() {
  const ctx = useContext(BuyModeContext);
  if (!ctx) throw new Error("useBuyMode must be used within BuyModeProvider");
  return ctx;
}
