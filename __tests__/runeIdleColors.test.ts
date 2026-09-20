import { getLayoutForLevel } from "../lib/gameConfig";
import { idleColorsForLayout, type IdleColors } from "../lib/runeIdleColors";
import { STAGE_LAYOUT_IDS } from "../lib/runeLayouts";
import { theme } from "../lib/theme";
import type { LayoutId } from "../types/game";

const WOODS_IDLE = {
  fill: theme.colors.idleWoods,
  border: theme.colors.idleWoodsBorder,
} as const;

const EXPECTED_IDLE: Record<LayoutId, IdleColors> = {
  grid: WOODS_IDLE,
  triangle: { fill: theme.colors.idleGate, border: theme.colors.idleGateBorder },
  diamond: { fill: theme.colors.idleMoonwell, border: theme.colors.idleMoonwellBorder },
  ring: { fill: theme.colors.idleCrystal, border: theme.colors.idleCrystalBorder },
  hex: { fill: theme.colors.idleEmber, border: theme.colors.idleEmberBorder },
  cross: { fill: theme.colors.idleTower, border: theme.colors.idleTowerBorder },
  star: { fill: theme.colors.idleStarfall, border: theme.colors.idleStarfallBorder },
  petal: { fill: theme.colors.idleCrown, border: theme.colors.idleCrownBorder },
  octagon: { fill: theme.colors.idleOrchard, border: theme.colors.idleOrchardBorder },
  spiral: { fill: theme.colors.idleBound, border: theme.colors.idleBoundBorder },
};

const CHAPTER_LEVELS: readonly { level: number; layoutId: LayoutId }[] = [
  { level: 1, layoutId: "grid" },
  { level: 11, layoutId: "triangle" },
  { level: 21, layoutId: "diamond" },
  { level: 31, layoutId: "ring" },
  { level: 41, layoutId: "hex" },
  { level: 51, layoutId: "cross" },
  { level: 61, layoutId: "star" },
  { level: 71, layoutId: "petal" },
  { level: 81, layoutId: "octagon" },
  { level: 91, layoutId: "spiral" },
];

describe("idleColorsForLayout", () => {
  it("keeps Sleeping Woods Lattice on richer moss with a deeper lantern-amber rim", () => {
    expect(idleColorsForLayout("grid")).toEqual(WOODS_IDLE);
    expect(WOODS_IDLE.fill).toBe("#243528");
    expect(WOODS_IDLE.border).toBe("rgba(210, 170, 90, 0.78)");
  });

  it("locks the remixed chapter mood palette", () => {
    expect(EXPECTED_IDLE).toEqual({
      grid: { fill: "#243528", border: "rgba(210, 170, 90, 0.78)" },
      triangle: { fill: "#2C3340", border: "rgba(255, 170, 90, 0.75)" },
      diamond: { fill: "#163040", border: "rgba(160, 220, 255, 0.75)" },
      ring: { fill: "#2A1A48", border: "rgba(120, 240, 230, 0.78)" },
      hex: { fill: "#3A1C14", border: "rgba(255, 120, 50, 0.80)" },
      cross: { fill: "#1E2830", border: "rgba(200, 210, 220, 0.70)" },
      star: { fill: "#121A38", border: "rgba(255, 230, 140, 0.78)" },
      petal: { fill: "#3A2030", border: "rgba(230, 200, 160, 0.70)" },
      octagon: { fill: "#1A3020", border: "rgba(255, 140, 90, 0.72)" },
      spiral: { fill: "#14101C", border: "rgba(180, 160, 255, 0.70)" },
    });
  });

  it("maps every layout to its chapter idle tint", () => {
    expect(STAGE_LAYOUT_IDS).toHaveLength(Object.keys(EXPECTED_IDLE).length);
    for (const layoutId of STAGE_LAYOUT_IDS) {
      expect(idleColorsForLayout(layoutId)).toEqual(EXPECTED_IDLE[layoutId]);
    }
  });

  it("gives each chapter a distinct idle fill and rim pair", () => {
    const fills = STAGE_LAYOUT_IDS.map((layoutId) => idleColorsForLayout(layoutId).fill);
    const rims = STAGE_LAYOUT_IDS.map((layoutId) => idleColorsForLayout(layoutId).border);

    expect(new Set(fills).size).toBe(STAGE_LAYOUT_IDS.length);
    expect(new Set(rims).size).toBe(STAGE_LAYOUT_IDS.length);
  });

  it("does not use cooled ember or active-state tokens for resting idle", () => {
    const reserved = new Set<string>([
      theme.colors.idleCooled,
      theme.colors.idleCooledBorder,
      theme.colors.preview,
      theme.colors.previewGlint,
      theme.colors.previewGhost,
      theme.colors.selected,
      theme.colors.correct,
      theme.colors.wrong,
    ]);

    for (const layoutId of STAGE_LAYOUT_IDS) {
      const colors = idleColorsForLayout(layoutId);
      expect(reserved.has(colors.fill)).toBe(false);
      expect(reserved.has(colors.border)).toBe(false);
    }
  });

  it("wires each chapter start level to that layout's idle tint", () => {
    for (const { level, layoutId } of CHAPTER_LEVELS) {
      expect(getLayoutForLevel(level).id).toBe(layoutId);
      expect(idleColorsForLayout(getLayoutForLevel(level).id)).toEqual(EXPECTED_IDLE[layoutId]);
    }
  });
});
