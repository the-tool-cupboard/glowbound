import type { LayoutId, RuneLayout, RunePoint } from "../types/game";

/**
 * Fraction of the no-overlap fit used for the layout cell.
 * 0.88 keeps a little air between cells while reading larger than 0.82.
 */
export const RUNE_SPACING_GAP = 0.88;

/** Prefer this pixel floor when the gapped fit would shrink below it, never past no-overlap. */
export const MIN_RUNE_CELL_SIZE = 32;

const AXIAL_DIRS: readonly [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export const STAGE_LAYOUT_IDS: readonly LayoutId[] = [
  "grid",
  "triangle",
  "diamond",
  "ring",
  "hex",
  "cross",
  "star",
  "petal",
  "octagon",
  "spiral",
];

export const LAYOUT_NAMES: Record<LayoutId, string> = {
  grid: "Lattice",
  triangle: "Triad",
  diamond: "Diamond",
  ring: "Ring",
  hex: "Hex",
  cross: "Cross",
  star: "Pentagon",
  petal: "Fan",
  octagon: "Octagon",
  spiral: "Spiral",
};

function roundCoord(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function normalizePoints(points: readonly RunePoint[], padding = 0.08): readonly RunePoint[] {
  if (points.length === 0) {
    return points;
  }

  if (points.length === 1) {
    return [{ x: 0.5, y: 0.5 }];
  }

  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }

  const spanX = Math.max(maxX - minX, 1e-6);
  const spanY = Math.max(maxY - minY, 1e-6);
  const usable = 1 - padding * 2;
  const scale = Math.min(usable / spanX, usable / spanY);
  const offsetX = 0.5 - ((minX + maxX) / 2) * scale;
  const offsetY = 0.5 - ((minY + maxY) / 2) * scale;

  return points.map((point) => ({
    x: roundCoord(point.x * scale + offsetX),
    y: roundCoord(point.y * scale + offsetY),
  }));
}

function takeCount(n: number): number {
  return Math.max(1, Math.floor(n));
}

function buildGridPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const cols = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const points: RunePoint[] = [];

  for (let row = 0; row < rows; row += 1) {
    const remaining = count - points.length;
    const rowCount = Math.min(cols, remaining);
    const startX = -(rowCount - 1) / 2;
    for (let col = 0; col < rowCount; col += 1) {
      points.push({ x: startX + col, y: row });
    }
  }

  return normalizePoints(points);
}

function buildTrianglePoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [];
  let row = 1;

  while (points.length < count) {
    const startX = -(row - 1) / 2;
    for (let col = 0; col < row && points.length < count; col += 1) {
      points.push({ x: startX + col, y: row });
    }
    row += 1;
  }

  return normalizePoints(points);
}

function buildDiamondPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [];
  let radius = 0;

  while (points.length < count) {
    for (let x = -radius; x <= radius && points.length < count; x += 1) {
      const y = radius - Math.abs(x);
      points.push({ x, y });
      if (y !== 0 && points.length < count) {
        points.push({ x, y: -y });
      }
    }
    radius += 1;
  }

  return normalizePoints(points);
}

function axialToPixel(q: number, r: number): RunePoint {
  return {
    x: Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r,
    y: 1.5 * r,
  };
}

function hexRing(radius: number): readonly [number, number][] {
  if (radius <= 0) {
    return [[0, 0]];
  }

  const results: [number, number][] = [];
  let q = AXIAL_DIRS[4]![0] * radius;
  let r = AXIAL_DIRS[4]![1] * radius;

  for (let dir = 0; dir < 6; dir += 1) {
    const step = AXIAL_DIRS[dir];
    if (step == null) {
      continue;
    }
    for (let i = 0; i < radius; i += 1) {
      results.push([q, r]);
      q += step[0];
      r += step[1];
    }
  }

  return results;
}

function buildHexPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [];
  let radius = 0;

  while (points.length < count) {
    for (const [q, r] of hexRing(radius)) {
      if (points.length >= count) {
        break;
      }
      points.push(axialToPixel(q, r));
    }
    radius += 1;
  }

  return normalizePoints(points);
}

function buildRingPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  if (count === 1) {
    return normalizePoints([{ x: 0, y: 0 }]);
  }

  const points: RunePoint[] = [{ x: 0, y: 0 }];
  let ring = 1;

  while (points.length < count) {
    const ringSlots = ring * 6;
    const remaining = count - points.length;
    const placed = Math.min(ringSlots, remaining);
    for (let i = 0; i < placed; i += 1) {
      const theta = (2 * Math.PI * i) / placed - Math.PI / 2;
      points.push({
        x: Math.cos(theta) * ring,
        y: Math.sin(theta) * ring,
      });
    }
    ring += 1;
  }

  return normalizePoints(points);
}

function buildCrossPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  let thickness = 0;
  let reach = 1;
  let points: RunePoint[] = [{ x: 0, y: 0 }];

  const collect = (): RunePoint[] => {
    const next: RunePoint[] = [];
    for (let y = -reach; y <= reach; y += 1) {
      for (let x = -reach; x <= reach; x += 1) {
        if (Math.abs(x) <= thickness || Math.abs(y) <= thickness) {
          next.push({ x, y });
        }
      }
    }
    return next;
  };

  points = collect();
  while (points.length < count && reach < 16) {
    if (thickness < reach) {
      thickness += 1;
    } else {
      reach += 1;
    }
    points = collect();
  }

  points.sort((a, b) => a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y));
  return normalizePoints(points.slice(0, count));
}

function buildStarPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [{ x: 0, y: 0 }];
  let ring = 1;

  while (points.length < count) {
    const slots = ring * 5;
    const remaining = count - points.length;
    const placed = Math.min(slots, remaining);
    for (let i = 0; i < placed; i += 1) {
      const theta = (2 * Math.PI * i) / placed - Math.PI / 2;
      points.push({
        x: Math.cos(theta) * ring,
        y: Math.sin(theta) * ring,
      });
    }
    ring += 1;
  }

  return normalizePoints(points);
}

function buildPetalPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [{ x: 0, y: 0 }];
  let ring = 1;

  while (points.length < count) {
    const slots = Math.max(2, ring * 4);
    const remaining = count - points.length;
    const placed = Math.min(slots, remaining);
    const span = Math.PI * 1.2;
    const start = -Math.PI / 2 - span / 2;
    for (let i = 0; i < placed; i += 1) {
      const theta = start + (span * i) / Math.max(placed - 1, 1);
      points.push({
        x: Math.cos(theta) * ring,
        y: Math.sin(theta) * ring,
      });
    }
    ring += 1;
  }

  return normalizePoints(points);
}

function buildOctagonPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const points: RunePoint[] = [];
  let ring = 1;

  while (points.length < count) {
    const remaining = count - points.length;
    const slots = Math.max(8, ring * 8);
    const placed = Math.min(slots, remaining);
    for (let i = 0; i < placed; i += 1) {
      const theta = (2 * Math.PI * i) / placed - Math.PI / 8;
      points.push({
        x: Math.cos(theta) * ring,
        y: Math.sin(theta) * ring,
      });
    }
    ring += 1;
  }

  return normalizePoints(points);
}

function buildSpiralPoints(n: number): readonly RunePoint[] {
  const count = takeCount(n);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const points: RunePoint[] = [];

  for (let i = 0; i < count; i += 1) {
    const radius = Math.sqrt((i + 1) / count);
    const theta = i * golden;
    points.push({
      x: Math.cos(theta) * radius,
      y: Math.sin(theta) * radius,
    });
  }

  return normalizePoints(points);
}

const BUILDERS: Record<LayoutId, (n: number) => readonly RunePoint[]> = {
  grid: buildGridPoints,
  triangle: buildTrianglePoints,
  diamond: buildDiamondPoints,
  ring: buildRingPoints,
  hex: buildHexPoints,
  cross: buildCrossPoints,
  star: buildStarPoints,
  petal: buildPetalPoints,
  octagon: buildOctagonPoints,
  spiral: buildSpiralPoints,
};

export function layoutIdForStage(stageIndex: number): LayoutId {
  if (!Number.isFinite(stageIndex)) {
    return "grid";
  }

  const index = Math.min(STAGE_LAYOUT_IDS.length, Math.max(1, Math.floor(stageIndex))) - 1;
  return STAGE_LAYOUT_IDS[index] ?? "grid";
}

export function getLayout(layoutId: LayoutId, runeCount: number): RuneLayout {
  const points = BUILDERS[layoutId](runeCount);
  return {
    id: layoutId,
    name: LAYOUT_NAMES[layoutId],
    runeCount: points.length,
    points,
  };
}

export function minNormalizedDistance(points: readonly RunePoint[]): number {
  if (points.length < 2) {
    return 1;
  }

  let min = Number.POSITIVE_INFINITY;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    if (a == null) {
      continue;
    }
    for (let j = i + 1; j < points.length; j += 1) {
      const b = points[j];
      if (b == null) {
        continue;
      }
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0 && distance < min) {
        min = distance;
      }
    }
  }

  return Number.isFinite(min) ? min : 1;
}

export interface RuneBoardMetrics {
  minDist: number;
  fitted: number;
  cellSize: number;
  neighborGap: number;
}

export function runeBoardMetrics(
  points: readonly RunePoint[],
  boardSize: number
): RuneBoardMetrics {
  if (boardSize <= 0 || points.length === 0) {
    return { minDist: 1, fitted: 0, cellSize: 0, neighborGap: 0 };
  }

  const minDist = minNormalizedDistance(points);
  const fitted = (minDist * boardSize) / (1 + minDist);
  if (fitted <= 0) {
    return { minDist, fitted: 0, cellSize: 0, neighborGap: 0 };
  }

  const gapped = fitted * RUNE_SPACING_GAP;
  const cellSize = Math.min(fitted, Math.max(gapped, MIN_RUNE_CELL_SIZE));
  const usable = Math.max(0, boardSize - cellSize);
  const neighborGap = Math.max(0, minDist * usable - cellSize);
  return { minDist, fitted, cellSize, neighborGap };
}

export function fittedRuneCellSize(points: readonly RunePoint[], boardSize: number): number {
  return runeBoardMetrics(points, boardSize).fitted;
}

export function runeCellSize(points: readonly RunePoint[], boardSize: number): number {
  return runeBoardMetrics(points, boardSize).cellSize;
}

export function runeNeighborGap(points: readonly RunePoint[], boardSize: number): number {
  return runeBoardMetrics(points, boardSize).neighborGap;
}

export function runeHitSlop(
  cellSize: number,
  neighborGap: number,
  minTapTarget: number
): number {
  if (cellSize <= 0 || minTapTarget <= cellSize) {
    return 0;
  }

  const needed = (minTapTarget - cellSize) / 2;
  const available = Math.max(0, neighborGap / 2);
  return Math.max(0, Math.min(needed, available));
}
