export type GamePhase =
  | "idle"
  | "preview"
  | "playerInput"
  | "stageComplete"
  | "levelComplete"
  | "lastChance"
  | "gameOver";

export type CellId = number;

export type RuneVisualState =
  | "inactive"
  | "previewTarget"
  | "selected"
  | "correct"
  | "incorrect";

export interface LevelConfig {
  gridSize: number;
  targetCount: number;
  previewDurationMs: number;
}

export interface GameState {
  level: number;
  score: number;
  gridSize: number;
  targetCellIds: readonly CellId[];
  selectedCellIds: readonly CellId[];
  phase: GamePhase;
  highScore: number;
}
