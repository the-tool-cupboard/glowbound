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
  it("keeps Sleeping Woods Lattice on moss fill with a lantern-warm rim", () => {
    expect(idleColorsForLayout("grid")).toEqual(WOODS_IDLE);
    expect(WOODS_IDLE.fill).toBe("#2A3428");
    expect(WOODS_IDLE.border).toBe("rgba(232, 196, 120, 0.72)");
  });

  it("locks the chapter mood palette", () => {
    expect(EXPECTED_IDLE).toEqual({
      grid: { fill: "#2A3428", border: "rgba(232, 196, 120, 0.72)" },
      triangle: { fill: "#2A3038", border: "rgba(232, 180, 110, 0.70)" },
      diamond: { fill: "#1E2E38", border: "rgba(180, 210, 230, 0.68)" },
      ring: { fill: "#242038", border: "rgba(140, 210, 230, 0.70)" },
      hex: { fill: "#302420", border: "rgba(230, 150, 80, 0.72)" },
      cross: { fill: "#262A32", border: "rgba(220, 200, 150, 0.65)" },
      star: { fill: "#1A2438", border: "rgba(230, 210, 140, 0.70)" },
      petal: { fill: "#2A2430", border: "rgba(210, 185, 130, 0.65)" },
      octagon: { fill: "#2A2230", border: "rgba(220, 160, 100, 0.68)" },
      spiral: { fill: "#1A1824", border: "rgba(200, 190, 255, 0.55)" },
    });
  });

  it("maps every layout to its chapter idle tint", () => {
    expect(STAGE_LAYOUT_IDS).toHaveLength(Object.keys(EXPECTED_IDLE).length);
    for (const layoutId of STAGE_LAYOUT_IDS) {
      expect(idleColorsForLayout(layoutId)).toEqual(EXPECTED_IDLE[layoutId]);
    }
  });

  it("gives each chapter a distinct idle fill and rim pair", () => {
    const serialized = STAGE_LAYOUT_IDS.map((layoutId) => {
      const colors = idleColorsForLayout(layoutId);
      return `${colors.fill}|${colors.border}`;
    });

    expect(new Set(serialized).size).toBe(STAGE_LAYOUT_IDS.length);
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
