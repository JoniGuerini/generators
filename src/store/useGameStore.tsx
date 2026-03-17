import { createContext, useContext, useSyncExternalStore, useRef, type ReactNode } from "react";
import type { GameState } from "./gameState";
import { gameReducer, type GameAction } from "./reducer";
import { getInitialState } from "./gameState";

// Store Pub/Sub customizado para não acoplar todo o re-render à raiz
class GameStore {
  private state: GameState;
  private listeners: Set<() => void> = new Set();

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  public getState = () => this.state;

  public dispatch = (action: GameAction) => {
    this.state = gameReducer(this.state, action);
    this.emitChange();
  };

  public subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emitChange() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

export const StoreContext = createContext<GameStore | null>(null);

export function GameStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: GameState;
}) {
  const storeRef = useRef<GameStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new GameStore(initialState ?? getInitialState());
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

// Hook de depacho nativo
export function useGameDispatch(): React.Dispatch<GameAction> {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useGameDispatch must be used within GameStoreProvider");
  return store.dispatch;
}

// Função auxiliar para comparar objetos rasamente
function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) return true;
  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i] as keyof T;
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is(objA[key], objB[key])) {
      return false;
    }
  }
  return true;
}

// Hook mágico do React 18
export function useGameSelector<T>(
  selector: (state: GameState) => T,
  equalityFn: (a: T, b: T) => boolean = Object.is
): T {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useGameSelector must be used within GameStoreProvider");

  // Para evitar que objetos recriados acionem re-renders (ou infinite loops do React),
  // memorizamos o seletor usando a função de igualdade.
  const memoizedSelector = useRef<{ state: GameState; selected: T } | null>(null);

  const getSnapshot = () => {
    const state = store.getState();
    if (memoizedSelector.current && memoizedSelector.current.state === state) {
      return memoizedSelector.current.selected;
    }
    const selected = selector(state);
    if (memoizedSelector.current && equalityFn(memoizedSelector.current.selected, selected)) {
      memoizedSelector.current.state = state;
      return memoizedSelector.current.selected;
    }
    memoizedSelector.current = { state, selected };
    return selected;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
}

export { shallowEqual };

// Retorna o State cru APENAS para lugares onde TUDO importa (como hooks de save/load)
export function useRawGameStateForPersist(): GameState {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useRawGameStateForPersist must be used within GameStoreProvider");
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}

