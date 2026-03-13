import { useState, useEffect, useRef } from "react";
import { useGameLoop } from "@/hooks/useGameLoop";
import { usePersist } from "@/hooks/usePersist";
import { useWakeLock } from "@/hooks/useWakeLock";
import { BuyModeProvider } from "@/contexts/BuyModeContext";
import { useGameState, useGameDispatch } from "@/store/useGameStore";
import {
  simulateOfflineProgress,
  MIN_OFFLINE_MS,
} from "@/engine/offlineProgress";
import type { OfflineGains } from "@/engine/offlineProgress";
import { Header } from "./Header";
import { GeneratorList } from "./GeneratorList";
import { UpgradesPage } from "./UpgradesPage";
import { OfflineWelcomeCard } from "./OfflineWelcomeCard";

export type MainView = "game" | "upgrades";

let pendingOfflineGains: OfflineGains | null = null;
let initialLoadTimestamp: number | null = null;

function runOfflineCheck(
  state: import("@/store/gameState").GameState,
  now: number,
  dispatch: (a: { type: "REPLACE_STATE"; state: import("@/store/gameState").GameState }) => void,
  setOfflineGains: (g: OfflineGains | null) => void,
  /** true = usar state.lastUpdateTimestamp (ex.: pageshow/bfcache); false = usar timestamp do primeiro load */
  useCurrentStateTimestamp = false
): boolean {
  const refTs = useCurrentStateTimestamp
    ? state.lastUpdateTimestamp
    : (initialLoadTimestamp ?? (initialLoadTimestamp = state.lastUpdateTimestamp));
  const elapsed = now - refTs;
  if (elapsed < MIN_OFFLINE_MS) return false;
  const { newState, gains } = simulateOfflineProgress(state, elapsed, now);
  dispatch({ type: "REPLACE_STATE", state: newState });
  setOfflineGains(gains);
  pendingOfflineGains = gains;
  return true;
}

export function GameScreen() {
  useGameLoop();
  usePersist();
  useWakeLock();
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [view, setView] = useState<MainView>("game");
  const [offlineGains, setOfflineGains] = useState<OfflineGains | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (pendingOfflineGains !== null) {
      setOfflineGains(pendingOfflineGains);
      pendingOfflineGains = null;
      return;
    }
    const now = Date.now();
    if (runOfflineCheck(state, now, dispatch, setOfflineGains)) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      if (pendingOfflineGains !== null) {
        setOfflineGains(pendingOfflineGains);
        pendingOfflineGains = null;
        return;
      }
      const now = Date.now();
      const s = stateRef.current;
      runOfflineCheck(s, now, dispatch, setOfflineGains, true);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [dispatch]);

  return (
    <BuyModeProvider>
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-zinc-800 text-zinc-100">
        <Header currentView={view} onNavigate={setView} />
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden px-2 py-2">
          {view === "game" ? (
            <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden">
              <GeneratorList />
            </div>
          ) : (
            <UpgradesPage />
          )}
        </main>
      </div>
      {offlineGains && (
        <OfflineWelcomeCard
          gains={offlineGains}
          onClose={() => setOfflineGains(null)}
        />
      )}
    </BuyModeProvider>
  );
}
