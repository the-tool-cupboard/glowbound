import { useCallback, useEffect, useSyncExternalStore } from "react";
import { useIsFocused } from "expo-router";

import {
  requestLanternReminderPermission,
  syncLanternReminders,
} from "@/lib/lanternReminderNotifications";
import { getLanternReminderEnabled, setLanternReminderEnabled } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const lanternReminderResource = createSyncedResource(false, getLanternReminderEnabled);

export function useLanternReminder() {
  const focused = useIsFocused();
  const { value: enabled, ready } = useSyncExternalStore(
    lanternReminderResource.subscribe,
    lanternReminderResource.getSnapshot,
    lanternReminderResource.getServerSnapshot
  );

  const setEnabled = useCallback(async (next: boolean): Promise<boolean> => {
    if (next) {
      const granted = await requestLanternReminderPermission();
      if (!granted) {
        lanternReminderResource.setValue(false);
        await setLanternReminderEnabled(false);
        await syncLanternReminders({ optedIn: false });
        return false;
      }
    }

    lanternReminderResource.setValue(next);
    await setLanternReminderEnabled(next);
    await syncLanternReminders({ optedIn: next });
    return next;
  }, []);

  const toggle = useCallback(() => {
    void setEnabled(!lanternReminderResource.value);
  }, [setEnabled]);

  useEffect(() => {
    if (!ready || !focused) {
      return;
    }
    void syncLanternReminders({ optedIn: enabled });
  }, [enabled, focused, ready]);

  return {
    enabled,
    ready,
    setEnabled,
    toggle,
  };
}
