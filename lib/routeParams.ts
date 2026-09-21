import type { DifficultyId } from "../types/economy";
import { isDifficultyId } from "./economyEngine";
import { MAX_STORED_SCORE, clampPlayLevel } from "./gameConfig";

export function parseRouteParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function parsePlayLevel(
  value: string | string[] | undefined,
  fallback = 1
): number {
  const raw = parseRouteParam(value);
  if (raw == null || raw === "") {
    return clampPlayLevel(fallback);
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return clampPlayLevel(fallback);
  }

  return clampPlayLevel(parsed);
}

export function parseScoreParam(value: string | string[] | undefined): number {
  const raw = parseRouteParam(value);
  if (raw == null || raw === "") {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.min(MAX_STORED_SCORE, Math.floor(parsed));
}

export function parseDifficultyParam(value: string | string[] | undefined): DifficultyId {
  const raw = parseRouteParam(value);
  return isDifficultyId(raw) ? raw : "standard";
}
