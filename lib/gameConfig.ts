import type { LevelConfig } from "../types/game";

export interface Checkpoint {
  startLevel: number;
  title: string;
  gridSize: number;
}

export const CHECKPOINTS: readonly Checkpoint[] = [
  { startLevel: 1, title: "Sleeping Woods", gridSize: 3 },
  { startLevel: 4, title: "Castle Gate", gridSize: 4 },
  { startLevel: 8, title: "Crystal Ascent", gridSize: 5 },
  { startLevel: 13, title: "The Tower", gridSize: 6 },
];

export const BASE_TARGET_COUNT = 2;
export const BASE_PREVIEW_MS = 1800;
export const MIN_PREVIEW_MS = 850;
export const PREVIEW_STEP_MS = 70;
export const MIN_STAGES_PER_LEVEL = 3;
export const LEVEL_COMPLETE_DELAY_MS = 800;
export const GAME_OVER_REVEAL_MS = 700;

export function getGridSize(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));

  if (safeLevel <= 3) {
    return 3;
  }

  if (safeLevel <= 7) {
    return 4;
  }

  if (safeLevel <= 12) {
    return 5;
  }

  return 6;
}

export function getTargetCount(level: number, gridSize: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  const capacity = Math.max(0, gridSize * gridSize);
  return Math.min(capacity, BASE_TARGET_COUNT + (safeLevel - 1));
}

export function getPreviewDurationMs(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.max(MIN_PREVIEW_MS, BASE_PREVIEW_MS - (safeLevel - 1) * PREVIEW_STEP_MS);
}

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = Math.max(1, Math.floor(level));
  const gridSize = getGridSize(safeLevel);

  return {
    gridSize,
    targetCount: getTargetCount(safeLevel, gridSize),
    previewDurationMs: getPreviewDurationMs(safeLevel),
  };
}

export function getStagesForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  if (safeLevel >= 13) {
    return MIN_STAGES_PER_LEVEL + 1;
  }

  return MIN_STAGES_PER_LEVEL;
}

export function isCheckpointUnlocked(startLevel: number, highestReachedLevel: number): boolean {
  const safeStart = Math.max(1, Math.floor(startLevel));
  if (safeStart <= 1) {
    return true;
  }

  return Math.max(0, Math.floor(highestReachedLevel)) >= safeStart;
}
