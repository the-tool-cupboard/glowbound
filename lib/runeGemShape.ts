import type { LayoutId } from "../types/game";

/** Visible gem silhouette. Pilot layouts only; everyone else stays a soft square. */
export type RuneGemShape = "square" | "triangle" | "diamond" | "hex" | "circle";

export interface GemPoint {
  x: number;
  y: number;
}

const PILOT_GEM_SHAPES: Partial<Record<LayoutId, RuneGemShape>> = {
  triangle: "triangle",
  diamond: "diamond",
  hex: "hex",
  ring: "circle",
};

export function runeGemShapeForLayout(layoutId: LayoutId): RuneGemShape {
  return PILOT_GEM_SHAPES[layoutId] ?? "square";
}

/** Keep the SVG stroke inside the gem box (stroke is centered on the path). */
export function gemStrokeInset(borderWidth: number): number {
  return borderWidth / 2 + 0.5;
}

export function formatPolygonPoints(points: readonly GemPoint[]): string {
  return points.map((point) => `${roundCoord(point.x)},${roundCoord(point.y)}`).join(" ");
}

export function gemPolygonPoints(
  shape: Exclude<RuneGemShape, "square" | "circle">,
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
  }
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
