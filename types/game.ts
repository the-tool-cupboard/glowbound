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

export type LayoutId =
  | "grid"
  | "triangle"
  | "diamond"
  | "ring"
  | "hex"
  | "cross"
  | "star"
  | "petal"
  | "octagon"
  | "spiral";

export interface RunePoint {
  x: number;
  y: number;
}

export interface RuneLayout {
  id: LayoutId;
  name: string;
  runeCount: number;
  points: readonly RunePoint[];
}

export interface LevelConfig {
  layoutId: LayoutId;
  runeCount: number;
  targetCount: number;
  previewDurationMs: number;
}

export interface GameState {
  level: number;
  score: number;
  layoutId: LayoutId;
  runeCount: number;
  targetCellIds: readonly CellId[];
  selectedCellIds: readonly CellId[];
  phase: GamePhase;
  highScore: number;
}
