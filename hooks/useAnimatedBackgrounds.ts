import { useCallback, useEffect, useState } from "react";

import {
  getAnimatedBackgroundsEnabled,
  setAnimatedBackgroundsEnabled,
} from "@/lib/storage";

export function useAnimatedBackgrounds() {
  const [enabled, setEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getAnimatedBackgroundsEnabled()
      .then((value) => {
        if (!cancelled) {
          setEnabledState(value);
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

  const setEnabled = useCallback(async (next: boolean) => {
    setEnabledState(next);
    await setAnimatedBackgroundsEnabled(next);
  }, []);

  const toggle = useCallback(() => {
    void setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return {
    enabled,
    ready,
    setEnabled,
    toggle,
  };
}
