import { CHECKPOINTS } from "../lib/gameConfig";
import {
  LANTERN_GHOST_CAP,
  LANTERN_GHOST_MARK,
  canonicalizeGhostChapter,
  createLanternGhostBook,
  encodeLanternGhostJson,
  encodeLanternGhostSeal,
  exportLanternGhostSeal,
  ghostImportFailureCopy,
  importLanternGhost,
  lanternGhostShareMessage,
  lanternGhostStatusCopy,
  parseLanternGhostSeal,
  removeLanternGhost,
  sanitizeGhostName,
  setLanternGhostSelfName,
} from "../lib/lanternGhosts";
import { lanternShareMessage } from "../lib/nightLantern";

const TODAY = "2026-09-21";

function bookWithId(selfId = "selfaa") {
  return createLanternGhostBook({ selfId, selfName: "Mae" }, { today: TODAY });
}

function sealCode(input: {
  id: string;
  name?: string | null;
  streak?: number;
  chapterTitle?: string;
  stars?: number;
  litDate?: string;
}): string {
  return encodeLanternGhostSeal({
    id: input.id,
    name: input.name ?? null,
    streak: input.streak ?? 4,
    chapterTitle: input.chapterTitle ?? "Moonwell",
    stars: (input.stars ?? 2) as 0 | 1 | 2 | 3,
    litDate: input.litDate ?? TODAY,
  });
}

describe("ghost seal encoding", () => {
  it("round-trips a compact GBG1 code including spaced chapter titles", () => {
    const seal = exportLanternGhostSeal(bookWithId(), {
      streak: 7,
      chapterTitle: "Sleeping Woods",
      stars: 3,
      litDate: TODAY,
    });
    const encoded = encodeLanternGhostSeal(seal);
    expect(encoded.startsWith(`${LANTERN_GHOST_MARK}|selfaa|`)).toBe(true);
    expect(parseLanternGhostSeal(encoded, TODAY)).toEqual(seal);
  });

  it("parses a compact code wrapped in share-sheet copy", () => {
    const code = sealCode({ id: "wisp7k", name: "Ren", streak: 12, stars: 1 });
    const message = lanternGhostShareMessage(
      lanternShareMessage({ patternsCleared: 3, chapterTitle: "Moonwell", streak: 12 }),
      parseLanternGhostSeal(code, TODAY)!
    );
    expect(message).toContain("A ghost seal for a friend");
    const parsed = parseLanternGhostSeal(message, TODAY);
    expect(parsed).toMatchObject({
      id: "wisp7k",
      name: "Ren",
      streak: 12,
      chapterTitle: "Moonwell",
      stars: 1,
      litDate: TODAY,
    });
  });

  it("parses the JSON payload form", () => {
    const json = encodeLanternGhostJson({
      id: "json01",
      name: "Bo",
      streak: 3,
      chapterTitle: "The Bound",
      stars: 0,
      litDate: "2026-09-20",
    });
    expect(parseLanternGhostSeal(`here you go\n${json}`, TODAY)).toMatchObject({
      id: "json01",
      name: "Bo",
      chapterTitle: "The Bound",
      stars: 0,
      litDate: "2026-09-20",
    });
  });

  it("maps chapter index 1–10 onto campaign titles", () => {
    expect(canonicalizeGhostChapter("3")).toBe("Moonwell");
    expect(canonicalizeGhostChapter("moonwell")).toBe("Moonwell");
    expect(canonicalizeGhostChapter("  Night Orchard ")).toBe("Night Orchard");
    expect(canonicalizeGhostChapter("")).toBe("the night");
    expect(CHECKPOINTS[2]?.title).toBe("Moonwell");
  });

  it("rejects empty, junk, and undersized ids", () => {
    expect(parseLanternGhostSeal("   ", TODAY)).toBeNull();
    expect(parseLanternGhostSeal("hello from camp", TODAY)).toBeNull();
    expect(parseLanternGhostSeal("GBG1|ab|Mae|3|Moonwell|2|2026-09-21", TODAY)).toBeNull();
    expect(sanitizeGhostName("  Mae   Glow  ")).toBe("Mae Glow");
    expect(sanitizeGhostName("this name is far too long for a seal")).toBe("this name is far");
  });
});

describe("ghost book storage helpers", () => {
  it("imports a friend, updates the same id, and ignores your own seal", () => {
    const empty = bookWithId();
    const first = importLanternGhost(empty, sealCode({ id: "pal001", name: "Ren", streak: 5 }), TODAY);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.updated).toBe(false);
    expect(first.book.ghosts).toHaveLength(1);
    expect(first.ghost.name).toBe("Ren");

    const updated = importLanternGhost(
      first.book,
      sealCode({ id: "pal001", name: "Ren", streak: 8, stars: 3, chapterTitle: "Starfall" }),
      TODAY
    );
    expect(updated.ok).toBe(true);
    if (!updated.ok) {
      return;
    }
    expect(updated.updated).toBe(true);
    expect(updated.book.ghosts).toHaveLength(1);
    expect(updated.ghost.streak).toBe(8);
    expect(updated.ghost.chapterTitle).toBe("Starfall");

    const self = importLanternGhost(updated.book, sealCode({ id: "selfaa" }), TODAY);
    expect(self).toEqual({ ok: false, reason: "self" });
    expect(ghostImportFailureCopy("self")).toBe("That's your own lantern.");
  });

  it("keeps only three ghosts and drops the oldest import", () => {
    let book = bookWithId();
    for (const [id, date] of [
      ["ghosta", "2026-09-01"],
      ["ghostb", "2026-09-10"],
      ["ghostc", "2026-09-18"],
    ] as const) {
      const result = importLanternGhost(
        book,
        sealCode({ id, litDate: TODAY }),
        date
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        book = result.book;
      }
    }
    expect(book.ghosts.map((ghost) => ghost.id)).toEqual(["ghosta", "ghostb", "ghostc"]);

    const overflow = importLanternGhost(book, sealCode({ id: "ghostd" }), "2026-09-21");
    expect(overflow.ok).toBe(true);
    if (!overflow.ok) {
      return;
    }
    expect(overflow.book.ghosts).toHaveLength(LANTERN_GHOST_CAP);
    expect(overflow.book.ghosts.map((ghost) => ghost.id)).toEqual(["ghostb", "ghostc", "ghostd"]);
  });

  it("persists an optional signer name and can remove a ghost", () => {
    const named = setLanternGhostSelfName(bookWithId(), "  Pixel  ");
    expect(named.selfName).toBe("Pixel");
    const imported = importLanternGhost(named, sealCode({ id: "pal002" }), TODAY);
    expect(imported.ok).toBe(true);
    if (!imported.ok) {
      return;
    }
    const cleared = removeLanternGhost(imported.book, "pal002");
    expect(cleared.ghosts).toHaveLength(0);
  });

  it("describes whether a friend lit tonight without ranking them", () => {
    expect(
      lanternGhostStatusCopy(
        {
          id: "pal003",
          name: "Ren",
          streak: 4,
          chapterTitle: "Moonwell",
          stars: 2,
          litDate: TODAY,
        },
        TODAY
      )
    ).toBe("Ren lit theirs");
    expect(
      lanternGhostStatusCopy(
        {
          id: "pal003",
          name: null,
          streak: 4,
          chapterTitle: "Moonwell",
          stars: 2,
          litDate: "2026-09-20",
        },
        TODAY
      )
    ).toBe("A friend lit last night");
  });

  it("loads a stored book and drops junk ghosts", () => {
    const loaded = createLanternGhostBook(
      {
        selfId: "okid01",
        selfName: "Mae",
        ghosts: [
          {
            id: "xx",
            name: "Bad",
            streak: 9,
            chapterTitle: "Moonwell",
            stars: 3,
            litDate: TODAY,
            importedAt: TODAY,
          },
          {
            id: "pal009",
            name: "Ren",
            streak: 4,
            chapterTitle: "Moonwell",
            stars: 2,
            litDate: TODAY,
            importedAt: TODAY,
          },
        ],
      },
      { today: TODAY }
    );
    expect(loaded.selfId).toBe("okid01");
    expect(loaded.ghosts).toHaveLength(1);
    expect(loaded.ghosts[0]?.id).toBe("pal009");
  });
});
