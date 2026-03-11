import { createContext, useContext, useReducer } from "react";
import type { GameState } from "./gameState";
import { gameReducer, type GameAction } from "./reducer";
import { getInitialState } from "./gameState";

type Dispatch = React.Dispatch<GameAction>;

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch | null>(null);

export function GameStoreProvider({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: GameState;
}) {
  const [state, dispatch] = useReducer(
    gameReducer,
    initialState ?? getInitialState()
  );
  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error("useGameState must be used within GameStoreProvider");
  return ctx;
}

export function useGameDispatch(): Dispatch {
  const ctx = useContext(GameDispatchContext);
  if (!ctx) throw new Error("useGameDispatch must be used within GameStoreProvider");
  return ctx;
}

export function useGameStore(): [GameState, Dispatch] {
  return [useGameState(), useGameDispatch()];
}
