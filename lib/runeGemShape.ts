import type { LayoutId } from "../types/game";

/** Visible gem silhouette for each board layout. */
export type RuneGemShape =
  | "square"
  | "triangle"
  | "diamond"
  | "hex"
  | "circle"
  | "cross"
  | "pentagon"
  | "petal"
  | "octagon";

export type PolygonGemShape = Exclude<RuneGemShape, "square" | "circle" | "petal">;

export interface GemPoint {
  x: number;
  y: number;
}

/**
 * Full silhouette map. Lattice stays the Phase A soft square.
 * Spiral (The Bound) reuses Ring's circle — a notch is unreadable at ~32px.
 */
const LAYOUT_GEM_SHAPES: Record<LayoutId, RuneGemShape> = {
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

export function runeGemShapeForLayout(layoutId: LayoutId): RuneGemShape {
  return LAYOUT_GEM_SHAPES[layoutId];
}

/** Keep the SVG stroke inside the gem box (stroke is centered on the path). */
export function gemStrokeInset(borderWidth: number): number {
  return borderWidth / 2 + 0.5;
}

export function formatPolygonPoints(points: readonly GemPoint[]): string {
  return points.map((point) => `${roundCoord(point.x)},${roundCoord(point.y)}`).join(" ");
}

export function gemPolygonPoints(
  shape: PolygonGemShape,
  size: number,
  inset: number
): readonly GemPoint[] {
  switch (shape) {
    case "triangle":
      return truncatedTrianglePoints(size, inset);
    case "diamond":
      return diamondPoints(size, inset);
    case "hex":
      return hexagonPoints(size, inset);
    case "cross":
      return crossPoints(size, inset);
    case "pentagon":
      return pentagonPoints(size, inset);
    case "octagon":
      return octagonPoints(size, inset);
  }
}

/** Point-up teardrop. Cubic sides + bottom arc stay readable at ~32px. */
export function gemPetalPath(size: number, inset: number): string {
  const pad = clampInset(size, inset);
  const cx = size / 2;
  const top = pad;
  const bottom = size - pad;
  const height = bottom - top;
  const bulbCy = top + height * 0.62;
  const bulbR = Math.min((size - pad * 2) / 2, bottom - bulbCy);

  return [
    `M ${roundCoord(cx)} ${roundCoord(top)}`,
    `C ${roundCoord(cx + bulbR * 0.35)} ${roundCoord(top + height * 0.18)}, ${roundCoord(cx + bulbR)} ${roundCoord(bulbCy - bulbR * 0.55)}, ${roundCoord(cx + bulbR)} ${roundCoord(bulbCy)}`,
    `A ${roundCoord(bulbR)} ${roundCoord(bulbR)} 0 0 1 ${roundCoord(cx - bulbR)} ${roundCoord(bulbCy)}`,
    `C ${roundCoord(cx - bulbR)} ${roundCoord(bulbCy - bulbR * 0.55)}, ${roundCoord(cx - bulbR * 0.35)} ${roundCoord(top + height * 0.18)}, ${roundCoord(cx)} ${roundCoord(top)}`,
    "Z",
  ].join(" ");
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

function clampInset(size: number, inset: number): number {
  if (size <= 0) {
    return 0;
  }
  return Math.max(0.5, Math.min(inset, size * 0.22));
}

/** Soft truncated triangle: short flat top, wide base. Readable at ~32px. */
function truncatedTrianglePoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const inner = size - pad * 2;
  const topWidth = inner * 0.3;
  const cx = size / 2;
  return [
    { x: cx - topWidth / 2, y: pad },
    { x: cx + topWidth / 2, y: pad },
    { x: size - pad, y: size - pad },
    { x: pad, y: size - pad },
  ];
}

/** Rotated square: vertices at the mid-edges of the gem box. */
function diamondPoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const cx = size / 2;
  const cy = size / 2;
  return [
    { x: cx, y: pad },
    { x: size - pad, y: cy },
    { x: cx, y: size - pad },
    { x: pad, y: cy },
  ];
}

/** Pointy-top hexagon inscribed in the gem box. */
function hexagonPoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - pad;
  const points: GemPoint[] = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

/** Soft plus: chunky equal arms so the silhouette still reads at ~32px. */
function crossPoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const inner = size - pad * 2;
  const halfArm = (inner * 0.36) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const left = pad;
  const right = size - pad;
  const top = pad;
  const bottom = size - pad;
  const x0 = cx - halfArm;
  const x1 = cx + halfArm;
  const y0 = cy - halfArm;
  const y1 = cy + halfArm;

  return [
    { x: x0, y: top },
    { x: x1, y: top },
    { x: x1, y: y0 },
    { x: right, y: y0 },
    { x: right, y: y1 },
    { x: x1, y: y1 },
    { x: x1, y: bottom },
    { x: x0, y: bottom },
    { x: x0, y: y1 },
    { x: left, y: y1 },
    { x: left, y: y0 },
    { x: x0, y: y0 },
  ];
}

/** Pointy-top pentagon inscribed in the gem box. */
function pentagonPoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - pad;
  const points: GemPoint[] = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = ((2 * Math.PI) / 5) * i - Math.PI / 2;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return points;
}

/** Regular octagon cut from the gem square (flat top, like a stop sign). */
function octagonPoints(size: number, inset: number): readonly GemPoint[] {
  const pad = clampInset(size, inset);
  const inner = size - pad * 2;
  const cut = inner / (2 + Math.SQRT2);
  const left = pad;
  const right = size - pad;
  const top = pad;
  const bottom = size - pad;

  return [
    { x: left + cut, y: top },
    { x: right - cut, y: top },
    { x: right, y: top + cut },
    { x: right, y: bottom - cut },
    { x: right - cut, y: bottom },
    { x: left + cut, y: bottom },
    { x: left, y: bottom - cut },
    { x: left, y: top + cut },
  ];
}
