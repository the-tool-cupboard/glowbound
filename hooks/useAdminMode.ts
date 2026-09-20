import { useCallback, useEffect, useState } from "react";

import { getAdminUnlockAll, setAdminUnlockAll } from "@/lib/storage";

export function useAdminMode() {
  const [enabled, setEnabledState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void getAdminUnlockAll()
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
    await setAdminUnlockAll(next);
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
