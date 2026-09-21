import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  createLanternGhostBook,
  exportLanternGhostSeal,
  importLanternGhost,
  lanternGhostShareMessage,
  removeLanternGhost,
  setLanternGhostSelfName,
  type GhostImportResult,
  type LanternGhostBook,
  type LanternGhostSeal,
} from "@/lib/lanternGhosts";
import { lanternShareMessage } from "@/lib/nightLantern";
import { getLanternGhostBook, setLanternGhostBook } from "@/lib/storage";
import { createSyncedResource } from "@/lib/syncedResource";

const lanternGhostResource = createSyncedResource(createLanternGhostBook(), getLanternGhostBook);

export function useLanternGhosts() {
  const { value, ready } = useSyncExternalStore(
    lanternGhostResource.subscribe,
    lanternGhostResource.getSnapshot,
    lanternGhostResource.getServerSnapshot
  );

  const persist = useCallback(async (next: LanternGhostBook) => {
    lanternGhostResource.setValue(next);
    await setLanternGhostBook(next);
    return next;
  }, []);

  const saveSelfName = useCallback(
    async (name: string): Promise<LanternGhostBook> => {
      return persist(setLanternGhostSelfName(lanternGhostResource.value, name));
    },
    [persist]
  );

  const importSeal = useCallback(
    async (raw: string, today: string): Promise<GhostImportResult> => {
      const result = importLanternGhost(lanternGhostResource.value, raw, today);
      if (result.ok) {
        await persist(result.book);
      }
      return result;
    },
    [persist]
  );

  const removeSeal = useCallback(
    async (ghostId: string): Promise<LanternGhostBook> => {
      return persist(removeLanternGhost(lanternGhostResource.value, ghostId));
    },
    [persist]
  );

  const exportSeal = useCallback(
    (input: { streak: number; chapterTitle: string; stars: number; litDate: string }): LanternGhostSeal => {
      return exportLanternGhostSeal(lanternGhostResource.value, input);
    },
    []
  );

  const composeShare = useCallback(
    (input: {
      patternsCleared: number;
      chapterTitle: string;
      streak: number;
      stars: number;
      litDate: string;
    }): string => {
      const human = lanternShareMessage({
        patternsCleared: input.patternsCleared,
        chapterTitle: input.chapterTitle,
        streak: input.streak,
      });
      return lanternGhostShareMessage(human, exportLanternGhostSeal(lanternGhostResource.value, input));
    },
    []
  );

  const view = useMemo(
    () => ({
      book: value,
      ghosts: value.ghosts,
      selfName: value.selfName,
      selfId: value.selfId,
    }),
    [value]
  );

  return {
    ready,
    book: view.book,
    ghosts: view.ghosts,
    selfName: view.selfName,
    selfId: view.selfId,
    saveSelfName,
    importSeal,
    removeSeal,
    exportSeal,
    composeShare,
  };
}
