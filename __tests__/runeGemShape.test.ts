import { getLayoutForLevel } from "../lib/gameConfig";
import {
  formatPolygonPoints,
  gemPetalPath,
  gemPolygonPoints,
  gemStrokeInset,
  runeGemShapeForLayout,
  type PolygonGemShape,
  type RuneGemShape,
} from "../lib/runeGemShape";
import { STAGE_LAYOUT_IDS } from "../lib/runeLayouts";
import type { LayoutId } from "../types/game";

describe("runeGemShapeForLayout", () => {
  it("maps every layout to the full silhouette table", () => {
    expect(runeGemShapeForLayout("grid")).toBe("square");
    expect(runeGemShapeForLayout("triangle")).toBe("triangle");
    expect(runeGemShapeForLayout("diamond")).toBe("diamond");
    expect(runeGemShapeForLayout("hex")).toBe("hex");
    expect(runeGemShapeForLayout("ring")).toBe("circle");
    expect(runeGemShapeForLayout("cross")).toBe("cross");
    expect(runeGemShapeForLayout("star")).toBe("pentagon");
    expect(runeGemShapeForLayout("petal")).toBe("petal");
    expect(runeGemShapeForLayout("octagon")).toBe("octagon");
    expect(runeGemShapeForLayout("spiral")).toBe("circle");
  });

  it("covers the full layout set without leftovers", () => {
    const expected: Record<LayoutId, RuneGemShape> = {
      grid: "square",
      triangle: "triangle",
      diamond: "diamond",
      ring: "circle",
      hex: "hex",
      cross: "cross",
      star: "pentagon",
      petal: "petal",
      octagon: "octagon",
      spiral: "circle",
    };

    expect(STAGE_LAYOUT_IDS).toHaveLength(Object.keys(expected).length);
    for (const layoutId of STAGE_LAYOUT_IDS) {
      expect(runeGemShapeForLayout(layoutId)).toBe(expected[layoutId]);
    }
  });

  it("wires each chapter, leaving Lattice on the soft square and Bound on a circle", () => {
    expect(runeGemShapeForLayout(getLayoutForLevel(1).id)).toBe("square");
    expect(runeGemShapeForLayout(getLayoutForLevel(11).id)).toBe("triangle");
    expect(runeGemShapeForLayout(getLayoutForLevel(21).id)).toBe("diamond");
    expect(runeGemShapeForLayout(getLayoutForLevel(31).id)).toBe("circle");
    expect(runeGemShapeForLayout(getLayoutForLevel(41).id)).toBe("hex");
    expect(runeGemShapeForLayout(getLayoutForLevel(51).id)).toBe("cross");
    expect(runeGemShapeForLayout(getLayoutForLevel(61).id)).toBe("pentagon");
    expect(runeGemShapeForLayout(getLayoutForLevel(71).id)).toBe("petal");
    expect(runeGemShapeForLayout(getLayoutForLevel(81).id)).toBe("octagon");
    expect(runeGemShapeForLayout(getLayoutForLevel(91).id)).toBe("circle");
  });
});

function expectPointsInsideBox(points: readonly { x: number; y: number }[], size: number): void {
  expect(points.every((point) => point.x >= 0 && point.x <= size && point.y >= 0 && point.y <= size)).toBe(
    true
  );
  expect(new Set(points.map((point) => `${point.x},${point.y}`)).size).toBe(points.length);
}

describe("gemPolygonPoints", () => {
  const size = 32;
  const inset = gemStrokeInset(4);

  it("builds a truncated triangle, diamond, and hex that stay inside the gem box", () => {
    const triangle = gemPolygonPoints("triangle", size, inset);
    const diamond = gemPolygonPoints("diamond", size, inset);
    const hex = gemPolygonPoints("hex", size, inset);

    expect(triangle).toHaveLength(4);
    expect(diamond).toHaveLength(4);
    expect(hex).toHaveLength(6);

    for (const points of [triangle, diamond, hex]) {
      expectPointsInsideBox(points, size);
    }

    expect(triangle[0]!.y).toBeCloseTo(triangle[1]!.y);
    expect(triangle[0]!.y).toBeLessThan(triangle[2]!.y);
    expect(triangle[1]!.x - triangle[0]!.x).toBeLessThan(triangle[2]!.x - triangle[3]!.x);

    expect(diamond[0]!.x).toBeCloseTo(size / 2);
    expect(diamond[1]!.y).toBeCloseTo(size / 2);
  });

  it("builds a plus, pentagon, and octagon that stay inside the gem box", () => {
    const cross = gemPolygonPoints("cross", size, inset);
    const pentagon = gemPolygonPoints("pentagon", size, inset);
    const octagon = gemPolygonPoints("octagon", size, inset);

    expect(cross).toHaveLength(12);
    expect(pentagon).toHaveLength(5);
    expect(octagon).toHaveLength(8);

    for (const points of [cross, pentagon, octagon]) {
      expectPointsInsideBox(points, size);
    }

    const pad = Math.max(0.5, Math.min(inset, size * 0.22));
    expect(Math.min(...cross.map((point) => point.y))).toBeCloseTo(pad);
    expect(Math.max(...cross.map((point) => point.y))).toBeCloseTo(size - pad);
    expect(Math.min(...cross.map((point) => point.x))).toBeCloseTo(pad);
    expect(Math.max(...cross.map((point) => point.x))).toBeCloseTo(size - pad);
    expect(cross[1]!.x - cross[0]!.x).toBeLessThan((size - pad * 2) * 0.5);

    expect(pentagon[0]!.x).toBeCloseTo(size / 2);
    expect(pentagon[0]!.y).toBeLessThan(size / 2);

    expect(octagon[0]!.y).toBeCloseTo(octagon[1]!.y);
    expect(octagon[0]!.y).toBeLessThan(octagon[2]!.y);
    expect(octagon[2]!.x).toBeCloseTo(octagon[3]!.x);
  });

  it("formats SVG polygon strings from those points", () => {
    const points = gemPolygonPoints("diamond", size, inset);
    const serialized = formatPolygonPoints(points);
    expect(serialized.split(" ")).toHaveLength(4);
    expect(serialized).toMatch(/^\d+(\.\d+)?,\d+(\.\d+)? /);
  });

  it.each(["triangle", "diamond", "hex", "cross", "pentagon", "octagon"] as const)(
    "keeps %s vertices unique at the dense-board size",
    (shape: PolygonGemShape) => {
      expectPointsInsideBox(gemPolygonPoints(shape, size, inset), size);
    }
  );
});

describe("gemPetalPath", () => {
  const size = 32;
  const inset = gemStrokeInset(4);

  it("draws a closed point-up teardrop that stays inside the gem box", () => {
    const path = gemPetalPath(size, inset);

    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith(" Z")).toBe(true);
    expect(path).toContain(" C ");
    expect(path).toContain(" A ");

    const numbers = [...path.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    expect(numbers.length).toBeGreaterThan(8);
    expect(numbers.every((value) => value >= 0 && value <= size)).toBe(true);

    const move = path.match(/^M ([\d.]+) ([\d.]+)/);
    expect(move).not.toBeNull();
    expect(Number(move?.[1])).toBeCloseTo(size / 2);
    expect(Number(move?.[2])).toBeLessThan(size / 2);
  });
});
