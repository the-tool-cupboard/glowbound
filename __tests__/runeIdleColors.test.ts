import { getLayoutForLevel } from "../lib/gameConfig";
import { idleColorsForLayout } from "../lib/runeIdleColors";
import { STAGE_LAYOUT_IDS } from "../lib/runeLayouts";
import { theme } from "../lib/theme";
import type { LayoutId } from "../types/game";

const GLOBAL_IDLE = {
  fill: theme.colors.idle,
  border: theme.colors.idleBorder,
} as const;

const WOODS_IDLE = {
  fill: theme.colors.idleWoods,
  border: theme.colors.idleWoodsBorder,
} as const;

describe("idleColorsForLayout", () => {
  it("tints Sleeping Woods Lattice idle moss with a lantern-warm rim", () => {
    expect(idleColorsForLayout("grid")).toEqual(WOODS_IDLE);
    expect(WOODS_IDLE.fill).toBe("#2A3428");
    expect(WOODS_IDLE.border).toBe("rgba(232, 196, 120, 0.72)");
  });

  it("keeps the Woods idle tokens distinct from the global blue-grey idle", () => {
    expect(WOODS_IDLE.fill).not.toBe(GLOBAL_IDLE.fill);
    expect(WOODS_IDLE.border).not.toBe(GLOBAL_IDLE.border);
  });

  it("leaves every other chapter on the global idle fill and rim", () => {
    const others: readonly LayoutId[] = STAGE_LAYOUT_IDS.filter((layoutId) => layoutId !== "grid");

    expect(others.length).toBe(STAGE_LAYOUT_IDS.length - 1);
    for (const layoutId of others) {
      expect(idleColorsForLayout(layoutId)).toEqual(GLOBAL_IDLE);
    }
  });

  it("does not use cooled ember tokens for resting idle", () => {
    expect(idleColorsForLayout("grid").fill).not.toBe(theme.colors.idleCooled);
    expect(idleColorsForLayout("grid").border).not.toBe(theme.colors.idleCooledBorder);
    expect(idleColorsForLayout("hex").fill).not.toBe(theme.colors.idleCooled);
    expect(idleColorsForLayout("hex").border).not.toBe(theme.colors.idleCooledBorder);
  });

  it("wires Woods L1 to the tint and Gate plus a later chapter to global idle", () => {
    expect(idleColorsForLayout(getLayoutForLevel(1).id)).toEqual(WOODS_IDLE);
    expect(idleColorsForLayout(getLayoutForLevel(11).id)).toEqual(GLOBAL_IDLE);
    expect(idleColorsForLayout(getLayoutForLevel(41).id)).toEqual(GLOBAL_IDLE);
  });
});
