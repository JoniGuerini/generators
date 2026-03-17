import { useState } from "react";
import { GameStoreProvider } from "@/store/useGameStore";
import { getInitialState } from "@/store/gameState";
import { loadGameState } from "@/hooks/usePersist";
import { GameScreen } from "@/components/GameScreen";

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
