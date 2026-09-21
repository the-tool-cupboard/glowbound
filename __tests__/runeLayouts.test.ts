import { getLayoutForLevel } from "../lib/gameConfig";
import {
  MIN_RUNE_CELL_SIZE,
  RUNE_SPACING_GAP,
  STAGE_LAYOUT_IDS,
  fittedRuneCellSize,
  getLayout,
  minNormalizedDistance,
  runeBoardMetrics,
  runeCellSize,
  runeHitSlop,
  runeNeighborGap,
} from "../lib/runeLayouts";
import { theme } from "../lib/theme";

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
      const boardSize = 280;
      const cell = runeCellSize(layout.points, boardSize);
      const gap = minNormalizedDistance(layout.points) * (boardSize - cell);
      expect(gap + 1e-9).toBeGreaterThanOrEqual(cell);
      expect(cell).toBeLessThanOrEqual(fittedRuneCellSize(layout.points, boardSize));
    }
  });
});

describe("runeBoardMetrics", () => {
  it("matches the dedicated cell-size and neighbor-gap helpers", () => {
    const points = getLayout("grid", 16).points;
    const boardSize = 280;
    const metrics = runeBoardMetrics(points, boardSize);

    expect(metrics.fitted).toBe(fittedRuneCellSize(points, boardSize));
    expect(metrics.cellSize).toBe(runeCellSize(points, boardSize));
    expect(metrics.neighborGap).toBe(runeNeighborGap(points, boardSize));
    expect(metrics.minDist).toBe(minNormalizedDistance(points));
  });
});

describe("runeCellSize", () => {
  it("uses the spacing gap when that still sits above the pixel floor", () => {
    const points = [
      { x: 0.1, y: 0.5 },
      { x: 0.9, y: 0.5 },
    ];
    const boardSize = 280;
    const fitted = fittedRuneCellSize(points, boardSize);
    const cell = runeCellSize(points, boardSize);

    expect(fitted).toBeGreaterThan(MIN_RUNE_CELL_SIZE / RUNE_SPACING_GAP);
    expect(cell).toBeCloseTo(fitted * RUNE_SPACING_GAP);
    expect(cell).toBeLessThanOrEqual(fitted);
  });

  it("raises a short gapped fit to MIN_RUNE_CELL_SIZE without overlapping", () => {
    const points = [
      { x: 0.43, y: 0.5 },
      { x: 0.57, y: 0.5 },
    ];
    const boardSize = 280;
    const fitted = fittedRuneCellSize(points, boardSize);
    const gapped = fitted * RUNE_SPACING_GAP;
    const cell = runeCellSize(points, boardSize);

    expect(gapped).toBeLessThan(MIN_RUNE_CELL_SIZE);
    expect(fitted).toBeGreaterThan(MIN_RUNE_CELL_SIZE);
    expect(cell).toBe(MIN_RUNE_CELL_SIZE);
    expect(cell).toBeLessThanOrEqual(fitted);
  });
});

describe("runeHitSlop", () => {
  it("stays at 0 when the cell already meets the tap floor", () => {
    expect(runeHitSlop(theme.minTapTarget, 12, theme.minTapTarget)).toBe(0);
    expect(runeHitSlop(72, 20, theme.minTapTarget)).toBe(0);
  });

  it("grows the pressable toward minTapTarget without crossing leftover air", () => {
    expect(runeHitSlop(40, 8, theme.minTapTarget)).toBe(4);
    expect(runeHitSlop(40, 24, theme.minTapTarget)).toBe(10);
  });

  it("expands toward minTapTarget using leftover air between cells, not neighbor overlap", () => {
    const points = getLayout("grid", 9).points;
    const boardSize = 280;
    const cell = runeCellSize(points, boardSize);
    const neighborGap = runeNeighborGap(points, boardSize);
    const slop = runeHitSlop(cell, neighborGap, theme.minTapTarget);

    expect(slop * 2).toBeLessThanOrEqual(neighborGap + 1e-9);
    expect(cell + slop * 2).toBeLessThanOrEqual(Math.max(cell, theme.minTapTarget) + 1e-9);
  });
});
