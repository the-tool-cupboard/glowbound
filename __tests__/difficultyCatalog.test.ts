import { DIFFICULTIES } from "../lib/economyConfig";
import { theme } from "../lib/theme";

describe("difficulty catalog", () => {
  it("keeps path ids, names, and economy knobs while descriptions carry a use-when beat", () => {
    expect(
      DIFFICULTIES.map((option) => ({
        id: option.id,
        name: option.name,
        previewMsMultiplier: option.previewMsMultiplier,
        extraTargets: option.extraTargets,
        emberMultiplier: option.emberMultiplier,
      }))
    ).toEqual([
      {
        id: "calm",
        name: "Calm",
        previewMsMultiplier: 1.25,
        extraTargets: -1,
        emberMultiplier: 0.75,
      },
      {
        id: "standard",
        name: "Standard",
        previewMsMultiplier: 1,
        extraTargets: 0,
        emberMultiplier: 1,
      },
      {
        id: "harsh",
        name: "Harsh",
        previewMsMultiplier: 0.7,
        extraTargets: 1,
        emberMultiplier: 1.5,
      },
    ]);

    for (const option of DIFFICULTIES) {
      expect(option.description.toLowerCase()).toContain("use ");
    }
  });

  it("gives every path its own lantern metal and flame", () => {
    const metals = DIFFICULTIES.map((option) => theme.path[option.id].metal);
    const flames = DIFFICULTIES.map((option) => theme.path[option.id].flame);

    expect(new Set(metals).size).toBe(DIFFICULTIES.length);
    expect(new Set(flames).size).toBe(DIFFICULTIES.length);
  });
});
