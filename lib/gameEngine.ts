import type { CellId, GamePhase, RuneVisualState } from "../types/game";

export type Rng = () => number;

export function generateUniqueTargetCellIds(
  totalCells: number,
  targetCount: number,
  rng: Rng = Math.random
): number[] {
  const safeCapacity = Math.max(0, Math.floor(totalCells));
  const safeCount = Math.min(Math.max(0, Math.floor(targetCount)), safeCapacity);
  const pool = Array.from({ length: safeCapacity }, (_, index) => index);

  for (let i = 0; i < safeCount; i += 1) {
    const remaining = safeCapacity - i;
    const j = i + Math.floor(rng() * remaining);
    const current = pool[i];
    const swap = pool[j];
    if (current === undefined || swap === undefined) {
      continue;
    }
    pool[i] = swap;
    pool[j] = current;
  }

  return pool.slice(0, safeCount);
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
