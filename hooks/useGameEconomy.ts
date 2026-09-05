import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  consumePowerUp,
  createEconomyState,
  purchaseItem,
} from "@/lib/economyEngine";
import { getEconomyState, setEconomyState } from "@/lib/storage";
import type {
  ConsumeResult,
  DifficultyId,
  EconomyState,
  Inventory,
  PowerUpId,
  PurchaseResult,
} from "@/types/economy";

interface GameEconomyValue {
  ready: boolean;
  embers: number;
  inventory: Inventory;
  difficulty: DifficultyId;
  buyItem: (itemId: PowerUpId) => Promise<PurchaseResult>;
  consumeItem: (itemId: PowerUpId) => Promise<ConsumeResult>;
  addEmbers: (amount: number) => Promise<EconomyState>;
  setDifficulty: (difficulty: DifficultyId) => Promise<EconomyState>;
}

const GameEconomyContext = createContext<GameEconomyValue | null>(null);

export function GameEconomyProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EconomyState>(createEconomyState());
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  const writeChainRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    void getEconomyState()
      .then((loaded) => {
        if (!cancelled) {
          stateRef.current = loaded;
          setState(loaded);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: EconomyState) => {
    stateRef.current = next;
    setState(next);
    writeChainRef.current = writeChainRef.current
      .catch(() => undefined)
      .then(() => setEconomyState(next));
    return next;
  }, []);

  const buyItem = useCallback(
    async (itemId: PowerUpId) => {
      const result = purchaseItem(stateRef.current, itemId);
      if (!result.ok) {
        return result;
      }

      persist(result.state);
      await writeChainRef.current.catch(() => undefined);
      return result;
    },
    [persist]
  );

  const consumeItem = useCallback(
    async (itemId: PowerUpId) => {
      const result = consumePowerUp(stateRef.current.inventory, itemId);
      if (!result.ok) {
        return result;
      }

      persist({
        ...stateRef.current,
        inventory: result.inventory,
      });
      await writeChainRef.current.catch(() => undefined);
      return result;
    },
    [persist]
  );

  const addEmbers = useCallback(
    async (amount: number) => {
      const current = stateRef.current;
      const next = persist({
        ...current,
        embers: current.embers + Math.max(0, Math.floor(amount)),
      });
      await writeChainRef.current.catch(() => undefined);
      return next;
    },
    [persist]
  );

  const setDifficulty = useCallback(
    async (difficulty: DifficultyId) => {
      const next = persist({
        ...stateRef.current,
        difficulty,
      });
      await writeChainRef.current.catch(() => undefined);
      return next;
    },
    [persist]
  );

  const value = useMemo<GameEconomyValue>(
    () => ({
      ready,
      embers: state.embers,
      inventory: state.inventory,
      difficulty: state.difficulty,
      buyItem,
      consumeItem,
      addEmbers,
      setDifficulty,
    }),
    [addEmbers, buyItem, consumeItem, ready, setDifficulty, state.difficulty, state.embers, state.inventory]
  );

  return createElement(GameEconomyContext.Provider, { value }, children);
}

export function useGameEconomy(): GameEconomyValue {
  const value = useContext(GameEconomyContext);
  if (value == null) {
    throw new Error("useGameEconomy must be used within GameEconomyProvider");
  }

  return value;
}

export function hasAnyPowerUps(inventory: Inventory): boolean {
  return Object.values(inventory).some((count) => count > 0);
}
