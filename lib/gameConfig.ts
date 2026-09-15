import type {
  ChapterArtKey,
  LayoutId,
  LevelConfig,
  RuneLayout,
  StageModifierId,
} from "../types/game";
import { LAYOUT_NAMES, getLayout, layoutIdForStage } from "./runeLayouts";

export interface Checkpoint {
  startLevel: number;
  title: string;
  layoutId: LayoutId;
  modifier: StageModifierId;
  artKey: ChapterArtKey;
  twistLabel: string;
}

interface StageSpec {
  title: string;
  modifier: StageModifierId;
  artKey: ChapterArtKey;
  twistLabel: string;
}

export const STAGE_COUNT = 10;
export const LEVELS_PER_STAGE = 10;
export const PATTERNS_PER_LEVEL = 5;
export const MAX_LEVEL = STAGE_COUNT * LEVELS_PER_STAGE;

export const BASE_RUNE_COUNT = 9;
export const LEVEL_RUNE_GROWTH = 1;
export const STAGE_RUNE_GROWTH = 2;
export const MAX_RUNE_COUNT = 36;

export const BASE_TARGET_RATIO = 0.55;
export const TARGET_RATIO_PER_LEVEL = 0.0025;
export const MAX_TARGET_RATIO = 0.75;
export const MIN_TARGET_COUNT = 5;

export const BASE_PREVIEW_MS = 1600;
export const MIN_PREVIEW_MS = 800;
export const PREVIEW_STEP_MS = 8;
/** Extra preview shortening per level-in-stage on The Bound. */
export const BOUND_PREVIEW_STEP_MS = 10;
export const CALM_WOODS_PREVIEW_BONUS_MS = 100;
export const LANTERN_TRIAL_LEVEL = MAX_LEVEL;
export const LANTERN_TRIAL_EXTRA_TARGETS = 2;
export const LANTERN_TRIAL_EMBER_BONUS = 50;

export const LEVEL_COMPLETE_DELAY_MS = 800;
export const GAME_OVER_REVEAL_MS = 700;

const STAGE_SPECS: readonly StageSpec[] = [
  { title: "Sleeping Woods", modifier: "none", artKey: "sleepingWoods", twistLabel: "Stillness" },
  { title: "Castle Gate", modifier: "gatePulse", artKey: "castleGate", twistLabel: "Gate pulse" },
  { title: "Moonwell", modifier: "reflection", artKey: "moonwell", twistLabel: "Reflection" },
  { title: "Crystal Ascent", modifier: "facetGlare", artKey: "crystalAscent", twistLabel: "Facet glare" },
  { title: "Ember Bridge", modifier: "emberFade", artKey: "emberBridge", twistLabel: "Ember fade" },
  { title: "The Tower", modifier: "twoFlight", artKey: "theTower", twistLabel: "Two-flight" },
  { title: "Starfall", modifier: "fallingOrder", artKey: "starfall", twistLabel: "Falling order" },
  { title: "Hollow Crown", modifier: "crownWeight", artKey: "hollowCrown", twistLabel: "Crown weight" },
  { title: "Night Orchard", modifier: "ripenRot", artKey: "nightOrchard", twistLabel: "Ripen-rot" },
  { title: "The Bound", modifier: "bound", artKey: "theBound", twistLabel: "Lantern trial" },
];

export const CHECKPOINTS: readonly Checkpoint[] = STAGE_SPECS.map((spec, index) => ({
  startLevel: index * LEVELS_PER_STAGE + 1,
  title: spec.title,
  layoutId: layoutIdForStage(index + 1),
  modifier: spec.modifier,
  artKey: spec.artKey,
  twistLabel: spec.twistLabel,
}));

function safePlayLevel(level: number): number {
  if (!Number.isFinite(level)) {
    return 1;
  }

  return Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
}

export function getStageIndex(level: number): number {
  const safeLevel = safePlayLevel(level);
  return Math.min(STAGE_COUNT, Math.ceil(safeLevel / LEVELS_PER_STAGE));
}

export function getLevelInStage(level: number): number {
  const safeLevel = safePlayLevel(level);
  return ((safeLevel - 1) % LEVELS_PER_STAGE) + 1;
}

export function getRuneCountForLevel(level: number): number {
  const stage = getStageIndex(level);
  const levelInStage = getLevelInStage(level);
  return Math.min(
    MAX_RUNE_COUNT,
    BASE_RUNE_COUNT + STAGE_RUNE_GROWTH * (stage - 1) + LEVEL_RUNE_GROWTH * (levelInStage - 1)
  );
}

export function getTargetCount(level: number, runeCount: number): number {
  const safeLevel = safePlayLevel(level);
  const capacity = Math.max(0, Math.floor(runeCount));
  if (capacity <= 1) {
    return capacity;
  }

  const ratio = Math.min(
    MAX_TARGET_RATIO,
    BASE_TARGET_RATIO + (safeLevel - 1) * TARGET_RATIO_PER_LEVEL
  );
  const raw = Math.round(capacity * ratio);
  let count = Math.min(capacity - 1, Math.max(Math.min(MIN_TARGET_COUNT, capacity - 1), raw));
  if (isLanternTrial(safeLevel)) {
    count = Math.min(capacity - 1, count + LANTERN_TRIAL_EXTRA_TARGETS);
  }
  return count;
}

export function getPreviewDurationMs(level: number): number {
  const safeLevel = safePlayLevel(level);
  let previewMs = BASE_PREVIEW_MS - (safeLevel - 1) * PREVIEW_STEP_MS;
  if (getStageIndex(safeLevel) === STAGE_COUNT) {
    previewMs -= getLevelInStage(safeLevel) * BOUND_PREVIEW_STEP_MS;
  }
  return Math.max(MIN_PREVIEW_MS, previewMs);
}

export function getLayoutForLevel(level: number): RuneLayout {
  const safeLevel = safePlayLevel(level);
  return getLayout(layoutIdForStage(getStageIndex(safeLevel)), getRuneCountForLevel(safeLevel));
}

export function getLevelConfig(level: number): LevelConfig {
  const safeLevel = safePlayLevel(level);
  const layout = getLayoutForLevel(safeLevel);

  return {
    layoutId: layout.id,
    runeCount: layout.runeCount,
    targetCount: getTargetCount(safeLevel, layout.runeCount),
    previewDurationMs: getPreviewDurationMs(safeLevel),
    modifier: getCheckpointForLevel(safeLevel).modifier,
  };
}

export function getStagesForLevel(_level: number): number {
  return PATTERNS_PER_LEVEL;
}

export function isCheckpointUnlocked(startLevel: number, highestReachedLevel: number): boolean {
  const safeStart = Math.max(1, Math.floor(startLevel));
  if (safeStart <= 1) {
    return true;
  }

  return Math.max(0, Math.floor(highestReachedLevel)) >= safeStart;
}

/** True when progress first crosses a later checkpoint start level. */
export function didUnlockCheckpoint(previousHighest: number, nextHighest: number): boolean {
  return CHECKPOINTS.some((checkpoint) => {
    if (checkpoint.startLevel <= 1) {
      return false;
    }

    return (
      !isCheckpointUnlocked(checkpoint.startLevel, previousHighest) &&
      isCheckpointUnlocked(checkpoint.startLevel, nextHighest)
    );
  });
}

export function isLanternTrial(level: number): boolean {
  return safePlayLevel(level) === LANTERN_TRIAL_LEVEL;
}

export function getCheckpointForLevel(level: number): Checkpoint {
  const safeLevel = safePlayLevel(level);
  const fallback: Checkpoint = CHECKPOINTS[0] ?? {
    startLevel: 1,
    title: "Sleeping Woods",
    layoutId: "grid",
    modifier: "none",
    artKey: "sleepingWoods",
    twistLabel: "Stillness",
  };

  return CHECKPOINTS.reduce(
    (current, checkpoint) => (safeLevel >= checkpoint.startLevel ? checkpoint : current),
    fallback
  );
}

export function getCheckpointShapeName(checkpoint: Checkpoint): string {
  return LAYOUT_NAMES[checkpoint.layoutId];
}

export function getCheckpointTwistLine(checkpoint: Checkpoint): string {
  return `${LAYOUT_NAMES[checkpoint.layoutId]} · ${checkpoint.twistLabel}`;
}

export function getCheckpointLevelRange(checkpoint: Checkpoint): string {
  const start = checkpoint.startLevel;
  const end = Math.min(MAX_LEVEL, start + LEVELS_PER_STAGE - 1);
  return `Levels ${start}–${end}`;
}
