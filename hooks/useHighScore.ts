import { useCallback, useSyncExternalStore } from "react";

import { getHighScore, setHighScore } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const highScoreResource = createSyncedResource(0, getHighScore);

export function useHighScore() {
  const { value: highScore, ready } = useSyncExternalStore(
    highScoreResource.subscribe,
    highScoreResource.getSnapshot,
    highScoreResource.getServerSnapshot
  );

  const recordScore = useCallback(async (score: number) => {
    const safeScore = Number.isFinite(score) ? Math.max(0, Math.floor(score)) : 0;
    const next = Math.max(highScoreResource.value, safeScore);
    highScoreResource.setValue(next);

    try {
      const stored = await setHighScore(next);
      if (stored !== highScoreResource.value) {
        highScoreResource.setValue(Math.max(highScoreResource.value, stored));
      }
      return highScoreResource.value;
    } catch {
      return next;
    }
  }, []);

  return {
    highScore,
    ready,
    recordScore,
  };
}
