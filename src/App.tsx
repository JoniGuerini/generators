import { useState } from "react";
import { GameStoreProvider } from "@/store/useGameStore";
import { getInitialState } from "@/store/gameState";
import { loadGameState } from "@/hooks/usePersist";
import { loadSharedSettings } from "@/utils/sharedSettings";
import { setAppLocale } from "@/locale";
import type { Locale } from "@/locale";
import { GameScreen } from "@/components/GameScreen";

function initLocale() {
  const settings = loadSharedSettings();
  setAppLocale(settings.locale as Locale);
}

initLocale();

function App() {
  const [initialState] = useState(
    () => loadGameState() ?? getInitialState()
  );
  return (
    <GameStoreProvider initialState={initialState}>
      <GameScreen />
    </GameStoreProvider>
  );
}

export default App;
