import { useCallback, useEffect, useState } from "react";

import { didUnlockCheckpoint } from "@/lib/gameConfig";
import { getHighestReachedLevel, setHighestReachedLevel } from "@/lib/storage";

export interface RecordReachedLevelResult {
  previous: number;
  stored: number;
  unlockedCheckpoint: boolean;
}

export function useProgress() {
  const [highestReachedLevel, setHighestReachedLevelState] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getHighestReachedLevel()
      .then((value) => {
        if (!cancelled) {
          setHighestReachedLevelState(Math.max(1, value));
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

  const recordReachedLevel = useCallback(async (level: number): Promise<RecordReachedLevelResult> => {
    const safeLevel = Math.max(1, Math.floor(level));

    try {
      const previous = await getHighestReachedLevel();
      const stored = await setHighestReachedLevel(safeLevel);
      setHighestReachedLevelState(stored);
      return {
        previous,
        stored,
        unlockedCheckpoint: didUnlockCheckpoint(previous, stored),
      };
    } catch {
      const previous = highestReachedLevel;
      const stored = Math.max(previous, safeLevel);
      setHighestReachedLevelState((current) => Math.max(current, safeLevel));
      return {
        previous,
        stored,
        unlockedCheckpoint: didUnlockCheckpoint(previous, stored),
      };
    }
  }, [highestReachedLevel]);

  return {
    highestReachedLevel,
    ready,
    recordReachedLevel,
  };
}
