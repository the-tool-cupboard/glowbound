import { getLayoutForLevel } from "../lib/gameConfig";
import { STAGE_LAYOUT_IDS, getLayout, minNormalizedDistance, runeCellSize } from "../lib/runeLayouts";

function pointKey(point: { x: number; y: number }): string {
  return `${point.x},${point.y}`;
}

describe("getLayoutForLevel", () => {
  it("starts on a 9-rune lattice and grows a cell each level in stage 1", () => {
    const first = getLayoutForLevel(1);
    const second = getLayoutForLevel(2);
    const tenth = getLayoutForLevel(10);

    expect(first).toMatchObject({ id: "grid", name: "Lattice", runeCount: 9 });
    expect(second.runeCount).toBe(10);
    expect(tenth).toMatchObject({ id: "grid", runeCount: 18 });
  });

  it("changes shape at every new 10-level stage", () => {
    expect(getLayoutForLevel(11)).toMatchObject({ id: "triangle", runeCount: 11 });
    expect(getLayoutForLevel(21)).toMatchObject({ id: "diamond", runeCount: 13 });
    expect(getLayoutForLevel(31)).toMatchObject({ id: "ring", runeCount: 15 });
    expect(getLayoutForLevel(91)).toMatchObject({ id: "spiral", runeCount: 27 });
    expect(getLayoutForLevel(100)).toMatchObject({ id: "spiral", runeCount: 36 });
  });

  it("caps growth at the final spiral", () => {
    expect(getLayoutForLevel(100).runeCount).toBe(36);
    expect(getLayoutForLevel(140).id).toBe("spiral");
    expect(getLayoutForLevel(140).runeCount).toBe(36);
  });
});

describe("getLayout", () => {
  it.each(STAGE_LAYOUT_IDS)("keeps %s points unique and inside the board", (layoutId) => {
    for (const runeCount of [9, 18, 27, 36]) {
      const layout = getLayout(layoutId, runeCount);
      const keys = layout.points.map(pointKey);

      expect(layout.points).toHaveLength(runeCount);
      expect(new Set(keys).size).toBe(layout.points.length);
      expect(
        layout.points.every((point) => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1)
      ).toBe(true);
      expect(minNormalizedDistance(layout.points)).toBeGreaterThan(0.1);
      const cell = runeCellSize(layout.points, 1);
      const gap = minNormalizedDistance(layout.points) * (1 - cell);
      expect(gap).toBeGreaterThanOrEqual(cell);
    }
  });
});
