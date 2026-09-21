import { useCallback, useSyncExternalStore } from "react";

import { getAdminUnlockAll, setAdminUnlockAll } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const adminUnlockResource = createSyncedResource(false, getAdminUnlockAll);

export function useAdminMode() {
  const { value: enabled, ready } = useSyncExternalStore(
    adminUnlockResource.subscribe,
    adminUnlockResource.getSnapshot,
    adminUnlockResource.getServerSnapshot
  );

  const setEnabled = useCallback(async (next: boolean) => {
    adminUnlockResource.setValue(next);
    await setAdminUnlockAll(next);
  }, []);

  const toggle = useCallback(() => {
    void setEnabled(!adminUnlockResource.value);
  }, [setEnabled]);

  return {
    enabled,
    ready,
    setEnabled,
    toggle,
  };
}
