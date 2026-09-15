import fs from "fs";
import path from "path";

import {
  AUDIO_OPPORTUNITIES,
  BGM_CATALOG,
  SFX_CATALOG,
  SFX_FILENAMES,
  SFX_SOURCES,
} from "../lib/audioCatalog";

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

  it("has a wav on disk for every catalog SFX filename", () => {
    const dir = path.join(__dirname, "..", "assets", "audio", "sfx");
    for (const entry of SFX_CATALOG) {
      expect(fs.existsSync(path.join(dir, entry.filename))).toBe(true);
    }
  });
});
