import type { RuneLayout } from "../types/game";
import { getLayoutForLevel } from "./gameConfig";
import { minNormalizedDistance, runeCellSize } from "./runeLayouts";

export interface ClosestPair {
  a: number;
  b: number;
  distance: number;
}

export interface RuneLayoutAuditFinding {
  level: number;
  layoutId: string;
  name: string;
  runeCount: number;
  unique: boolean;
  inBounds: boolean;
  minDistance: number;
  closest: ClosestPair | null;
  cellSizeAt280: number;
  overlapsAt280: boolean;
  issues: string[];
}

export const AUDIT_BOARD_SIZE = 280;
export const MIN_NORMALIZED_DISTANCE = 0.1;

const AUDIT_LEVELS = [
  1, 5, 10, 11, 15, 20, 21, 30, 31, 40, 41, 50, 51, 60, 61, 70, 71, 80, 81, 90, 91, 100,
] as const;

function pointKey(point: { x: number; y: number }): string {
  return `${point.x},${point.y}`;
}

export function closestPair(layout: RuneLayout): ClosestPair | null {
  if (layout.points.length < 2) {
    return null;
  }

  let best: ClosestPair | null = null;
  for (let i = 0; i < layout.points.length; i += 1) {
    const a = layout.points[i];
    if (a == null) {
      continue;
    }
    for (let j = i + 1; j < layout.points.length; j += 1) {
      const b = layout.points[j];
      if (b == null) {
        continue;
      }
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (best == null || distance < best.distance) {
        best = { a: i, b: j, distance };
      }
    }
  }
  return best;
}

export function auditLayout(
  layout: RuneLayout,
  level: number,
  boardSize = AUDIT_BOARD_SIZE
): RuneLayoutAuditFinding {
  const keys = layout.points.map(pointKey);
  const unique = new Set(keys).size === layout.points.length;
  const inBounds = layout.points.every(
    (point) => point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1
  );
  const minDistance = minNormalizedDistance(layout.points);
  const closest = closestPair(layout);
  const cellSizeAt280 = runeCellSize(layout.points, boardSize);
  const usable = Math.max(0, boardSize - cellSizeAt280);
  const pixelGap = minDistance * usable;
  const overlapsAt280 = pixelGap + 1e-9 < cellSizeAt280;
  const issues: string[] = [];

  if (!unique) {
    issues.push("duplicate coordinates");
  }
  if (!inBounds) {
    issues.push("point outside 0–1 board");
  }
  if (layout.points.length !== layout.runeCount) {
    issues.push(`point count ${layout.points.length} != runeCount ${layout.runeCount}`);
  }
  if (minDistance <= MIN_NORMALIZED_DISTANCE) {
    issues.push(`min distance ${minDistance.toFixed(3)} <= ${MIN_NORMALIZED_DISTANCE}`);
  }
  if (overlapsAt280) {
    issues.push(
      `orbs overlap at ${boardSize}px board (gap ${pixelGap.toFixed(1)}px < cell ${cellSizeAt280.toFixed(1)}px)`
    );
  }

  return {
    level,
    layoutId: layout.id,
    name: layout.name,
    runeCount: layout.runeCount,
    unique,
    inBounds,
    minDistance,
    closest,
    cellSizeAt280,
    overlapsAt280,
    issues,
  };
}

export function auditAllChapterLevels(): RuneLayoutAuditFinding[] {
  return AUDIT_LEVELS.map((level) => auditLayout(getLayoutForLevel(level), level));
}

export function formatRuneLayoutAudit(findings: readonly RuneLayoutAuditFinding[]): string {
  const lines = findings.map((finding) => {
    const pair =
      finding.closest == null
        ? "n/a"
        : `#${finding.closest.a + 1}–#${finding.closest.b + 1} @ ${finding.closest.distance.toFixed(3)}`;
    const status = finding.issues.length === 0 ? "pass" : `FAIL ${finding.issues.join("; ")}`;
    return `L${finding.level} ${finding.name} (${finding.runeCount}): min ${finding.minDistance.toFixed(3)}, closest ${pair}, cell@280 ${finding.cellSizeAt280.toFixed(1)}px — ${status}`;
  });
  const failed = findings.filter((finding) => finding.issues.length > 0).length;
  lines.push(`${findings.length - failed}/${findings.length} layouts passed.`);
  return lines.join("\n");
}
