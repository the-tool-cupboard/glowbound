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
  | "previewGlint"
  | "previewGhost"
  | "emberCooled"
  | "selected"
  | "correct"
  | "incorrect";

export type StageModifierId =
  | "none"
  | "gatePulse"
  | "reflection"
  | "facetGlare"
  | "emberFade"
  | "twoFlight"
  | "fallingOrder"
  | "crownWeight"
  | "ripenRot"
  | "bound";

export type ChapterArtKey =
  | "sleepingWoods"
  | "castleGate"
  | "moonwell"
  | "crystalAscent"
  | "emberBridge"
  | "theTower"
  | "starfall"
  | "hollowCrown"
  | "nightOrchard"
  | "theBound";

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
  modifier: StageModifierId;
}
