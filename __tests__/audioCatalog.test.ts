import fs from "fs";
import path from "path";

import {
  AUDIO_OPPORTUNITIES,
  BGM_CATALOG,
  BGM_SOURCES,
  CHAPTER_BED_BGM_IDS,
  CHAPTER_ENTER_SFX_IDS,
  chapterBedForLevel,
  chapterEnterSfxForLevel,
  FALLBACK_CHAPTER_BED_ID,
  SFX_CATALOG,
  SFX_FILENAMES,
  SFX_SOURCES,
  shouldPlayChapterEnterSfx,
} from "../lib/audioCatalog";
import { CHECKPOINTS, STAGE_COUNT } from "../lib/gameConfig";

describe("audioCatalog", () => {
  it("keeps SFX catalog IDs unique", () => {
    const ids = SFX_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps BGM catalog IDs unique", () => {
    const ids = BGM_CATALOG.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("maps every SFX id to a bundled source and filename", () => {
    for (const entry of SFX_CATALOG) {
      expect(SFX_SOURCES[entry.id]).toBeDefined();
      expect(SFX_FILENAMES[entry.id]).toBe(entry.filename);
    }
  });

  it("documents future audio opportunities", () => {
    expect(AUDIO_OPPORTUNITIES.length).toBeGreaterThan(0);
    const ids = AUDIO_OPPORTUNITIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps shipped SFX out of the future-opportunity list", () => {
    const catalogIds = new Set<string>(SFX_CATALOG.map((entry) => entry.id));
    for (const opportunity of AUDIO_OPPORTUNITIES) {
      expect(catalogIds.has(opportunity.id)).toBe(false);
    }
  });

  it("ships phase 3C cues with kebab-case wav filenames", () => {
    expect(SFX_FILENAMES.chapterUnlock).toBe("chapter-unlock.wav");
    expect(SFX_FILENAMES.lastChanceSting).toBe("last-chance-sting.wav");
    expect(SFX_FILENAMES.lanternTrialClear).toBe("lantern-trial-clear.wav");
    expect(SFX_SOURCES.chapterUnlock).toBeDefined();
    expect(SFX_SOURCES.lastChanceSting).toBeDefined();
    expect(SFX_SOURCES.lanternTrialClear).toBeDefined();
  });

  it("ships one chapter-enter sting per checkpoint stage", () => {
    expect(CHAPTER_ENTER_SFX_IDS).toHaveLength(STAGE_COUNT);
    expect(CHAPTER_ENTER_SFX_IDS).toHaveLength(CHECKPOINTS.length);
    expect(new Set(CHAPTER_ENTER_SFX_IDS).size).toBe(CHAPTER_ENTER_SFX_IDS.length);

    const expected: { level: number; id: (typeof CHAPTER_ENTER_SFX_IDS)[number]; file: string }[] = [
      { level: 1, id: "chapterEnterSleepingWoods", file: "chapter-enter-sleeping-woods.wav" },
      { level: 11, id: "chapterEnterCastleGate", file: "chapter-enter-castle-gate.wav" },
      { level: 21, id: "chapterEnterMoonwell", file: "chapter-enter-moonwell.wav" },
      { level: 31, id: "chapterEnterCrystalAscent", file: "chapter-enter-crystal-ascent.wav" },
      { level: 41, id: "chapterEnterEmberBridge", file: "chapter-enter-ember-bridge.wav" },
      { level: 51, id: "chapterEnterTheTower", file: "chapter-enter-the-tower.wav" },
      { level: 61, id: "chapterEnterStarfall", file: "chapter-enter-starfall.wav" },
      { level: 71, id: "chapterEnterHollowCrown", file: "chapter-enter-hollow-crown.wav" },
      { level: 81, id: "chapterEnterNightOrchard", file: "chapter-enter-night-orchard.wav" },
      { level: 91, id: "chapterEnterTheBound", file: "chapter-enter-the-bound.wav" },
    ];

    expected.forEach((entry, index) => {
      expect(CHECKPOINTS[index]?.startLevel).toBe(entry.level);
      expect(CHAPTER_ENTER_SFX_IDS[index]).toBe(entry.id);
      expect(chapterEnterSfxForLevel(entry.level)).toBe(entry.id);
      expect(chapterEnterSfxForLevel(entry.level + 9)).toBe(entry.id);
      expect(SFX_FILENAMES[entry.id]).toBe(entry.file);
      expect(SFX_SOURCES[entry.id]).toBeDefined();
    });
  });

  it("plays chapter-enter on run start at a chapter and when stage index increases", () => {
    expect(shouldPlayChapterEnterSfx(null, 1)).toBe(true);
    expect(shouldPlayChapterEnterSfx(null, 11)).toBe(true);
    expect(shouldPlayChapterEnterSfx(null, 91)).toBe(true);
    expect(shouldPlayChapterEnterSfx(null, 5)).toBe(false);
    expect(shouldPlayChapterEnterSfx(null, 12)).toBe(false);

    expect(shouldPlayChapterEnterSfx(10, 11)).toBe(true);
    expect(shouldPlayChapterEnterSfx(20, 21)).toBe(true);
    expect(shouldPlayChapterEnterSfx(90, 91)).toBe(true);
    expect(shouldPlayChapterEnterSfx(11, 12)).toBe(false);
    expect(shouldPlayChapterEnterSfx(1, 10)).toBe(false);
    expect(shouldPlayChapterEnterSfx(11, 11)).toBe(false);
  });

  it("keeps chapter unlock, lantern trial, and enter stings as distinct cues", () => {
    expect(SFX_FILENAMES.chapterUnlock).not.toBe(SFX_FILENAMES.chapterEnterCastleGate);
    expect(SFX_FILENAMES.lanternTrialClear).not.toBe(SFX_FILENAMES.chapterEnterTheBound);
    expect(CHAPTER_ENTER_SFX_IDS).not.toContain("chapterUnlock");
    expect(CHAPTER_ENTER_SFX_IDS).not.toContain("lanternTrialClear");
  });

  it("has a wav on disk for every catalog SFX filename", () => {
    const dir = path.join(__dirname, "..", "assets", "audio", "sfx");
    for (const entry of SFX_CATALOG) {
      expect(fs.existsSync(path.join(dir, entry.filename))).toBe(true);
    }
  });

  it("ships one looping chapter bed per checkpoint stage", () => {
    expect(CHAPTER_BED_BGM_IDS).toHaveLength(STAGE_COUNT);
    expect(CHAPTER_BED_BGM_IDS).toHaveLength(CHECKPOINTS.length);
    expect(new Set(CHAPTER_BED_BGM_IDS).size).toBe(CHAPTER_BED_BGM_IDS.length);
    expect(FALLBACK_CHAPTER_BED_ID).toBe("playTheme");

    const expected: { level: number; id: (typeof CHAPTER_BED_BGM_IDS)[number]; file: string }[] = [
      { level: 1, id: "chapterBedSleepingWoods", file: "chapter-bed-sleeping-woods.wav" },
      { level: 11, id: "chapterBedCastleGate", file: "chapter-bed-castle-gate.wav" },
      { level: 21, id: "chapterBedMoonwell", file: "chapter-bed-moonwell.wav" },
      { level: 31, id: "chapterBedCrystalAscent", file: "chapter-bed-crystal-ascent.wav" },
      { level: 41, id: "chapterBedEmberBridge", file: "chapter-bed-ember-bridge.wav" },
      { level: 51, id: "chapterBedTheTower", file: "chapter-bed-the-tower.wav" },
      { level: 61, id: "chapterBedStarfall", file: "chapter-bed-starfall.wav" },
      { level: 71, id: "chapterBedHollowCrown", file: "chapter-bed-hollow-crown.wav" },
      { level: 81, id: "chapterBedNightOrchard", file: "chapter-bed-night-orchard.wav" },
      { level: 91, id: "chapterBedTheBound", file: "chapter-bed-the-bound.wav" },
    ];

    expected.forEach((entry, index) => {
      expect(CHECKPOINTS[index]?.startLevel).toBe(entry.level);
      expect(CHAPTER_BED_BGM_IDS[index]).toBe(entry.id);
      expect(chapterBedForLevel(entry.level)).toBe(entry.id);
      expect(chapterBedForLevel(entry.level + 9)).toBe(entry.id);
      const catalog = BGM_CATALOG.find((item) => item.id === entry.id);
      expect(catalog?.filename).toBe(entry.file);
      expect(BGM_SOURCES[entry.id]).toBeDefined();
    });
  });

  it("clamps play levels onto a mapped chapter bed and keeps playTheme as source fallback", () => {
    expect(chapterBedForLevel(0)).toBe("chapterBedSleepingWoods");
    expect(chapterBedForLevel(100)).toBe("chapterBedTheBound");
    expect(chapterBedForLevel(Number.NaN)).toBe("chapterBedSleepingWoods");
    expect(FALLBACK_CHAPTER_BED_ID).toBe("playTheme");
    expect(BGM_SOURCES[FALLBACK_CHAPTER_BED_ID]).toBeDefined();
  });

  it("keeps chapter beds distinct from enter-stingers and does not reuse sting files", () => {
    const musicDir = path.join(__dirname, "..", "assets", "audio", "music");
    const sfxDir = path.join(__dirname, "..", "assets", "audio", "sfx");

    for (const bedId of CHAPTER_BED_BGM_IDS) {
      expect(CHAPTER_ENTER_SFX_IDS).not.toContain(bedId);
      const bed = BGM_CATALOG.find((entry) => entry.id === bedId);
      expect(bed).toBeDefined();
      expect(bed?.filename.startsWith("chapter-bed-")).toBe(true);
      expect(fs.existsSync(path.join(musicDir, bed?.filename ?? ""))).toBe(true);
    }

    for (const stingId of CHAPTER_ENTER_SFX_IDS) {
      expect(fs.existsSync(path.join(sfxDir, SFX_FILENAMES[stingId]))).toBe(true);
    }
  });

  it("has a wav on disk for every catalog BGM filename", () => {
    const dir = path.join(__dirname, "..", "assets", "audio", "music");
    for (const entry of BGM_CATALOG) {
      expect(fs.existsSync(path.join(dir, entry.filename))).toBe(true);
    }
  });
});
