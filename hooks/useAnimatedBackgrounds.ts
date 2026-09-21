import { useCallback, useSyncExternalStore } from "react";

import {
  getAnimatedBackgroundsEnabled,
  setAnimatedBackgroundsEnabled,
} from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const animatedBackgroundsResource = createSyncedResource(false, getAnimatedBackgroundsEnabled);

export function useAnimatedBackgrounds() {
  const { value: enabled, ready } = useSyncExternalStore(
    animatedBackgroundsResource.subscribe,
    animatedBackgroundsResource.getSnapshot,
    animatedBackgroundsResource.getServerSnapshot
  );

  const setEnabled = useCallback(async (next: boolean) => {
    animatedBackgroundsResource.setValue(next);
    await setAnimatedBackgroundsEnabled(next);
  }, []);

  const toggle = useCallback(() => {
    void setEnabled(!animatedBackgroundsResource.value);
  }, [setEnabled]);

  return {
    enabled,
    ready,
    setEnabled,
    toggle,
  };
}
