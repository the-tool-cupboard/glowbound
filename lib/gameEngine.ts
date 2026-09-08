import type { CellId, GamePhase, RuneVisualState } from "../types/game";

export type Rng = () => number;

const PATTERN_RETRY_ATTEMPTS = 32;
const GOLDEN_FRACTION = 0.6180339887498949;

export function patternKey(cellIds: readonly number[]): string {
  return [...cellIds]
    .map((id) => Math.floor(id))
    .sort((a, b) => a - b)
    .join(",");
}

function saltedRng(rng: Rng, attempt: number): Rng {
  return () => {
    const mixed = rng() + (attempt + 1) * GOLDEN_FRACTION;
    return mixed - Math.floor(mixed);
  };
}

function pickTargetCellIds(totalCells: number, targetCount: number, rng: Rng): number[] {
  const pool = Array.from({ length: totalCells }, (_, index) => index);

  for (let i = 0; i < targetCount; i += 1) {
    const remaining = totalCells - i;
    const j = i + Math.floor(rng() * remaining);
    const current = pool[i];
    const swap = pool[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    pool[i] = swap;
    pool[j] = current;
  }

  return pool.slice(0, targetCount);
}

export function generateUniqueTargetCellIds(
  totalCells: number,
  targetCount: number,
  rng: Rng = Math.random,
  recentPatternKeys: readonly string[] = []
): number[] {
  const safeCapacity = Math.max(0, Math.floor(totalCells));
  const safeCount = Math.min(Math.max(0, Math.floor(targetCount)), safeCapacity);
  if (safeCount <= 0 || safeCapacity <= 0) {
    return [];
  }

  const blocked = new Set(recentPatternKeys.filter((key) => key.length > 0));
  let last: number[] = [];

  for (let attempt = 0; attempt < PATTERN_RETRY_ATTEMPTS; attempt += 1) {
    const roll = attempt === 0 ? rng : saltedRng(rng, attempt);
    last = pickTargetCellIds(safeCapacity, safeCount, roll);
    if (!blocked.has(patternKey(last))) {
      return last;
    }
  }

  return last;
}

export function isCorrectSelection(cellId: number, targetCellIds: readonly number[]): boolean {
  return targetCellIds.includes(cellId);
}

export function hasCompletedPattern(
  selectedCellIds: readonly number[],
  targetCellIds: readonly number[]
): boolean {
  if (selectedCellIds.length !== targetCellIds.length) {
    return false;
  }

  return targetCellIds.every((cellId) => selectedCellIds.includes(cellId));
}

export function calculateScoreForLevel(level: number): number {
  return Math.max(0, Math.floor(level)) * 10;
}

export function getRuneVisualState(
  cellId: CellId,
  snapshot: {
    phase: GamePhase;
    targetCellIds: readonly CellId[];
    selectedCellIds: readonly CellId[];
    wrongCellId: CellId | null;
    hintCellIds?: readonly CellId[];
  }
): RuneVisualState {
  if (snapshot.wrongCellId === cellId) {
    return "incorrect";
  }

  if (snapshot.selectedCellIds.includes(cellId)) {
    return snapshot.phase === "levelComplete" || snapshot.phase === "stageComplete"
      ? "correct"
      : "selected";
  }

  if (snapshot.phase === "preview" && snapshot.targetCellIds.includes(cellId)) {
    return "previewTarget";
  }

  if (
    snapshot.phase === "playerInput" &&
    snapshot.hintCellIds?.includes(cellId) &&
    snapshot.targetCellIds.includes(cellId)
  ) {
    return "previewTarget";
  }

  return "inactive";
}

export function isInputEnabled(phase: GamePhase): boolean {
  return phase === "playerInput";
}
