import { useCallback, useEffect, useState } from "react";

import { getHighestReachedLevel, setHighestReachedLevel } from "@/lib/storage";

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

  const recordReachedLevel = useCallback(async (level: number) => {
    const safeLevel = Math.max(1, Math.floor(level));

    try {
      const stored = await setHighestReachedLevel(safeLevel);
      setHighestReachedLevelState(stored);
      return stored;
    } catch {
      setHighestReachedLevelState((current) => Math.max(current, safeLevel));
      return Math.max(highestReachedLevel, safeLevel);
    }
  }, [highestReachedLevel]);

  return {
    highestReachedLevel,
    ready,
    recordReachedLevel,
  };
}
