import { getLayoutForLevel } from "../lib/gameConfig";
import {
  formatPolygonPoints,
  gemPolygonPoints,
  gemStrokeInset,
  runeGemShapeForLayout,
  type RuneGemShape,
} from "../lib/runeGemShape";
import { STAGE_LAYOUT_IDS } from "../lib/runeLayouts";
import type { LayoutId } from "../types/game";

describe("runeGemShapeForLayout", () => {
  it("maps only the Phase B pilot layouts to new silhouettes", () => {
    expect(runeGemShapeForLayout("triangle")).toBe("triangle");
    expect(runeGemShapeForLayout("diamond")).toBe("diamond");
    expect(runeGemShapeForLayout("hex")).toBe("hex");
    expect(runeGemShapeForLayout("ring")).toBe("circle");
  });

  it("keeps every other layout on today's soft square", () => {
    const expected: Record<LayoutId, RuneGemShape> = {
      grid: "square",
      triangle: "triangle",
      diamond: "diamond",
      ring: "circle",
      hex: "hex",
      cross: "square",
      star: "square",
      petal: "square",
      octagon: "square",
      spiral: "square",
    };

    expect(STAGE_LAYOUT_IDS).toHaveLength(Object.keys(expected).length);
    for (const layoutId of STAGE_LAYOUT_IDS) {
      expect(runeGemShapeForLayout(layoutId)).toBe(expected[layoutId]);
    }
  });

  it("wires the four pilot chapters and leaves Woods / Tower square", () => {
    expect(runeGemShapeForLayout(getLayoutForLevel(1).id)).toBe("square");
    expect(runeGemShapeForLayout(getLayoutForLevel(11).id)).toBe("triangle");
    expect(runeGemShapeForLayout(getLayoutForLevel(21).id)).toBe("diamond");
    expect(runeGemShapeForLayout(getLayoutForLevel(31).id)).toBe("circle");
    expect(runeGemShapeForLayout(getLayoutForLevel(41).id)).toBe("hex");
    expect(runeGemShapeForLayout(getLayoutForLevel(51).id)).toBe("square");
    expect(runeGemShapeForLayout(getLayoutForLevel(91).id)).toBe("square");
  });
});

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
      expect(points.every((point) => point.x >= 0 && point.x <= size && point.y >= 0 && point.y <= size)).toBe(
        true
      );
      expect(new Set(points.map((point) => `${point.x},${point.y}`)).size).toBe(points.length);
    }

    expect(triangle[0]!.y).toBeCloseTo(triangle[1]!.y);
    expect(triangle[0]!.y).toBeLessThan(triangle[2]!.y);
    expect(triangle[1]!.x - triangle[0]!.x).toBeLessThan(triangle[2]!.x - triangle[3]!.x);

    expect(diamond[0]!.x).toBeCloseTo(size / 2);
    expect(diamond[1]!.y).toBeCloseTo(size / 2);
  });

  it("formats SVG polygon strings from those points", () => {
    const points = gemPolygonPoints("diamond", size, inset);
    const serialized = formatPolygonPoints(points);
    expect(serialized.split(" ")).toHaveLength(4);
    expect(serialized).toMatch(/^\d+(\.\d+)?,\d+(\.\d+)? /);
  });
});
