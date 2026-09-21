import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  addFrostWick,
  applyFrostWickFreeze,
  applyLanternResult,
  calendarDateInZone,
  canOfferFrostWick,
  createNightLanternState,
  declineFrostWickFreeze,
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

  const grantFrostWick = useCallback(async (): Promise<NightLanternState | null> => {
    const next = addFrostWick(nightLanternResource.value);
    if (next == null) {
      return null;
    }
    return persist(next);
  }, [persist]);

  const applyFreeze = useCallback(async (): Promise<NightLanternState | null> => {
    const today = calendarDateInZone(new Date());
    const next = applyFrostWickFreeze(nightLanternResource.value, today);
    if (next == null) {
      return null;
    }
    return persist(next);
  }, [persist]);

  const declineFreeze = useCallback(async (): Promise<NightLanternState> => {
    const today = calendarDateInZone(new Date());
    return persist(declineFrostWickFreeze(nightLanternResource.value, today));
  }, [persist]);

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
      freezeOffer: canOfferFrostWick(value, today),
    };
  }, [value]);

  return {
    ready,
    state: view.rolled,
    streak: view.rolled.streak,
    freezeOwned: view.rolled.freezeOwned,
    freezeOffer: view.freezeOffer,
    firstSeenDate: view.rolled.firstSeenDate,
    availability: view.availability,
    playLevel: view.playLevel,
    weekdayBand: view.weekdayBand,
    relitLabel: view.relitLabel,
    recordResult,
    grantFrostWick,
    applyFreeze,
    declineFreeze,
  };
}
