import { useCallback, useSyncExternalStore } from "react";

import { clampPlayLevel, didUnlockCheckpoint } from "@/lib/gameConfig";
import { getHighestReachedLevel, setHighestReachedLevel } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const progressResource = createSyncedResource(1, async () =>
  Math.max(1, await getHighestReachedLevel())
);

export interface RecordReachedLevelResult {
  previous: number;
  stored: number;
  unlockedCheckpoint: boolean;
}

export function useProgress() {
  const { value: highestReachedLevel, ready } = useSyncExternalStore(
    progressResource.subscribe,
    progressResource.getSnapshot,
    progressResource.getServerSnapshot
  );

  const recordReachedLevel = useCallback(async (level: number): Promise<RecordReachedLevelResult> => {
    const safeLevel = clampPlayLevel(level);
    const previous = progressResource.value;
    const next = Math.max(previous, safeLevel);
    progressResource.setValue(next);

    try {
      const stored = await setHighestReachedLevel(next);
      if (stored !== progressResource.value) {
        progressResource.setValue(Math.max(progressResource.value, stored));
      }
      const persisted = progressResource.value;
      return {
        previous,
        stored: persisted,
        unlockedCheckpoint: didUnlockCheckpoint(previous, persisted),
      };
    } catch {
      return {
        previous,
        stored: next,
        unlockedCheckpoint: didUnlockCheckpoint(previous, next),
      };
    }
  }, []);

  return {
    highestReachedLevel,
    ready,
    recordReachedLevel,
  };
}
