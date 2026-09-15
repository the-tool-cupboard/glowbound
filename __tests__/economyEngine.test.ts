import {
  applyDifficultyToConfig,
  calculateEmbersEarned,
  calculateLanternShards,
  canAfford,
  consumePowerUp,
  createEconomyState,
  isDifficultyId,
  isInventoryFull,
  purchaseItem,
} from "../lib/economyEngine";
import { EMPTY_INVENTORY, MAX_OWNED_PER_ITEM, STARTING_EMBERS } from "../lib/economyConfig";
import { MIN_PREVIEW_MS } from "../lib/gameConfig";

describe("createEconomyState", () => {
  it("starts with a grant of embers and an empty pack", () => {
    const state = createEconomyState();

    expect(state.embers).toBe(STARTING_EMBERS);
    expect(state.inventory).toEqual(EMPTY_INVENTORY);
    expect(state.difficulty).toBe("standard");
  });

  it("clamps negative embers to zero", () => {
    expect(createEconomyState({ embers: -40 }).embers).toBe(0);
  });

  it("clamps negative inventory counts from corrupt storage", () => {
    const state = createEconomyState({
      inventory: { ...EMPTY_INVENTORY, ward: -2 },
    });

    expect(state.inventory.ward).toBe(0);
  });

  it("rejects an unknown difficulty id", () => {
    expect(isDifficultyId("wanderer")).toBe(false);
    expect(createEconomyState({ difficulty: "wanderer" as never }).difficulty).toBe("standard");
  });
});

describe("canAfford", () => {
  it("allows a purchase only when embers cover the cost", () => {
    expect(canAfford(25, 25)).toBe(true);
    expect(canAfford(24, 25)).toBe(false);
  });
});

describe("purchaseItem", () => {
  it("spends embers and adds one owned power-up", () => {
    const result = purchaseItem(createEconomyState({ embers: 40 }), "pathHint");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.embers).toBe(15);
      expect(result.state.inventory.pathHint).toBe(1);
    }
  });

  it("rejects a purchase the player cannot afford", () => {
    const result = purchaseItem(createEconomyState({ embers: 10 }), "ward");

    expect(result).toEqual({ ok: false, reason: "cannotAfford" });
  });

  it("does not mutate the original economy state on success or failure", () => {
    const original = createEconomyState({ embers: 40, inventory: { ...EMPTY_INVENTORY, pathHint: 1 } });
    const snapshot = structuredClone(original);

    purchaseItem(original, "pathHint");
    purchaseItem(original, "ward");

    expect(original).toEqual(snapshot);
  });

  it("stops purchases at the owned cap", () => {
    let state = createEconomyState({ embers: 1000 });

    for (let i = 0; i < MAX_OWNED_PER_ITEM; i += 1) {
      const result = purchaseItem(state, "pathHint");
      expect(result.ok).toBe(true);
      if (result.ok) {
        state = result.state;
      }
    }

    expect(state.inventory.pathHint).toBe(MAX_OWNED_PER_ITEM);
    expect(isInventoryFull(state.inventory, "pathHint")).toBe(true);
    expect(purchaseItem(state, "pathHint")).toEqual({ ok: false, reason: "capReached" });
  });
});

describe("consumePowerUp", () => {
  it("removes one owned charge and refuses an empty slot", () => {
    expect(consumePowerUp({ ...EMPTY_INVENTORY, ward: 2 }, "ward")).toEqual({
      ok: true,
      inventory: { ...EMPTY_INVENTORY, ward: 1 },
    });
    expect(consumePowerUp(EMPTY_INVENTORY, "ward")).toEqual({
      ok: false,
      reason: "noneOwned",
    });
  });
});

describe("calculateLanternShards", () => {
  it("pays shards for a cleared level and more on harsh", () => {
    expect(calculateLanternShards(1, "standard")).toBe(10);
    expect(calculateLanternShards(1, "harsh")).toBe(15);
    expect(calculateLanternShards(1, "calm")).toBe(7);
  });

  it("follows floor((8 + level * 2) * multiplier) for later levels", () => {
    expect(calculateLanternShards(5, "standard")).toBe(18);
    expect(calculateLanternShards(10, "standard")).toBe(28);
    expect(calculateLanternShards(10, "harsh")).toBe(42);
    expect(calculateLanternShards(10, "calm")).toBe(21);
    expect(calculateLanternShards(20, "standard")).toBe(48);
    expect(calculateLanternShards(50, "standard")).toBe(108);
  });

  it("adds a lantern trial ember bump on level 100", () => {
    expect(calculateLanternShards(100, "standard")).toBe(258);
    expect(calculateLanternShards(100, "harsh")).toBe(362);
    expect(calculateLanternShards(99, "standard")).toBe(206);
  });
});

describe("calculateEmbersEarned", () => {
  it("pays more on harsh and less on calm", () => {
    expect(calculateEmbersEarned(40, 3, "standard")).toBe(18);
    expect(calculateEmbersEarned(40, 3, "harsh")).toBe(27);
    expect(calculateEmbersEarned(40, 3, "calm")).toBe(13);
  });

  it("awards nothing when the run never leaves level 1", () => {
    expect(calculateEmbersEarned(0, 1, "standard")).toBe(0);
  });
});

describe("applyDifficultyToConfig", () => {
  const base = {
    layoutId: "grid" as const,
    runeCount: 9,
    targetCount: 3,
    previewDurationMs: 1600,
    modifier: "none" as const,
  };

  it("softens calm and hardens harsh without exceeding the board", () => {
    expect(applyDifficultyToConfig(base, "calm")).toEqual({
      layoutId: "grid",
      runeCount: 9,
      targetCount: 2,
      previewDurationMs: 2000,
      modifier: "none",
    });
    expect(applyDifficultyToConfig(base, "harsh").targetCount).toBe(4);
    expect(
      applyDifficultyToConfig({ ...base, targetCount: 9 }, "harsh").targetCount
    ).toBe(9);
  });

  it("never shortens harsh previews below the 850ms config floor", () => {
    expect(
      applyDifficultyToConfig(
        {
          layoutId: "spiral",
          runeCount: 36,
          targetCount: 20,
          previewDurationMs: 850,
          modifier: "bound",
        },
        "harsh"
      ).previewDurationMs
    ).toBe(MIN_PREVIEW_MS);
    expect(
      applyDifficultyToConfig(
        {
          layoutId: "spiral",
          runeCount: 36,
          targetCount: 20,
          previewDurationMs: 600,
          modifier: "bound",
        },
        "harsh"
      ).previewDurationMs
    ).toBe(MIN_PREVIEW_MS);
  });
});
