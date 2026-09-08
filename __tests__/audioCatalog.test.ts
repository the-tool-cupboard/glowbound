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
});
