import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  applyLanternResult,
  calendarDateInZone,
  createNightLanternState,
  lanternAttemptAvailability,
  lanternPlayLevel,
  lanternRelitLabel,
  lanternWeekdayBand,
  rollNightLanternDay,
  type LanternAttemptAvailability,
  type NightLanternState,
} from "@/lib/nightLantern";
import { getNightLanternState, setNightLanternState } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const nightLanternResource = createSyncedResource(createNightLanternState(), getNightLanternState);

export function useNightLantern() {
  const { value, ready } = useSyncExternalStore(
    nightLanternResource.subscribe,
    nightLanternResource.getSnapshot,
    nightLanternResource.getServerSnapshot
  );

  const persist = useCallback(async (next: NightLanternState) => {
    nightLanternResource.setValue(next);
    await setNightLanternState(next);
    return next;
  }, []);

  const recordResult = useCallback(
    async (stars: number): Promise<NightLanternState> => {
      const today = calendarDateInZone(new Date());
      const next = applyLanternResult(nightLanternResource.value, today, stars);
      return persist(next);
    },
    [persist]
  );

  const view = useMemo(() => {
    const now = new Date();
    const today = calendarDateInZone(now);
    const rolled = rollNightLanternDay(value, today);
    const availability: LanternAttemptAvailability = lanternAttemptAvailability(rolled, today);
    return {
      today,
      rolled,
      availability,
      playLevel: lanternPlayLevel(now),
      weekdayBand: lanternWeekdayBand(now),
      relitLabel: lanternRelitLabel(now),
    };
  }, [value]);

  return {
    ready,
    state: view.rolled,
    streak: view.rolled.streak,
    freezeOwned: view.rolled.freezeOwned,
    firstSeenDate: view.rolled.firstSeenDate,
    availability: view.availability,
    playLevel: view.playLevel,
    weekdayBand: view.weekdayBand,
    relitLabel: view.relitLabel,
    recordResult,
  };
}
