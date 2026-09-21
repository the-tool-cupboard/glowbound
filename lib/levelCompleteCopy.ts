import type { DifficultyId } from "../types/economy";
import { LANTERN_TRIAL_LEVEL, MAX_LEVEL, clampPlayLevel, isLanternTrial } from "./gameConfig";

export const JOURNEY_COMPLETE_TITLE = "Journey complete.";
export const JOURNEY_COMPLETE_COPY = "The Bound is sealed. The lantern holds.";
export const LEVEL_CLEAR_COPY = (shardsEarned: number): string =>
  `You earned ${shardsEarned} embers.`;

export type LevelCompleteActionId = "continue" | "home" | "stages" | "retryTrial";

export interface LevelCompleteRoute {
  pathname: "/" | "/game" | "/levels";
  params?: Record<string, string>;
}

export interface LevelCompleteAction {
  id: LevelCompleteActionId;
  label: string;
  variant: "primary" | "ghost";
  accessibilityHint: string;
  route: LevelCompleteRoute;
}

export interface LevelCompleteView {
  journeyComplete: boolean;
  title: string;
  copy: string;
  actions: readonly LevelCompleteAction[];
}

/** Next play level after a clear, or null when the lantern trial ends the journey. */
export function continuePlayLevelAfterClear(clearedLevel: number): number | null {
  const safe = clampPlayLevel(clearedLevel);
  if (isLanternTrial(safe) || safe >= MAX_LEVEL) {
    return null;
  }

  return safe + 1;
}

export function isJourneyComplete(clearedLevel: number): boolean {
  return continuePlayLevelAfterClear(clearedLevel) == null;
}

export function levelClearTitle(clearedLevel: number): string {
  return `Level ${clampPlayLevel(clearedLevel)} clear.`;
}

export function journeyCompleteCopy(shardsEarned: number): string {
  const earned = Number.isFinite(shardsEarned) ? Math.max(0, Math.floor(shardsEarned)) : 0;
  return `${JOURNEY_COMPLETE_COPY} ${LEVEL_CLEAR_COPY(earned)}`;
}

function homeAction(variant: "primary" | "ghost"): LevelCompleteAction {
  return {
    id: "home",
    label: "Return Home",
    variant,
    accessibilityHint: "Returns to the home screen",
    route: { pathname: "/" },
  };
}

function continueAction(
  startLevel: number,
  playLevel: number,
  score: number,
  difficulty: DifficultyId
): LevelCompleteAction {
  return {
    id: "continue",
    label: "Continue",
    variant: "primary",
    accessibilityHint: `Continues this run at level ${playLevel}`,
    route: {
      pathname: "/game",
      params: {
        startLevel: String(startLevel),
        playLevel: String(playLevel),
        resumeScore: String(score),
        difficulty,
      },
    },
  };
}

function stagesAction(): LevelCompleteAction {
  return {
    id: "stages",
    label: "Stages",
    variant: "ghost",
    accessibilityHint: "Opens stages you can start from",
    route: { pathname: "/levels" },
  };
}

function retryTrialAction(difficulty: DifficultyId): LevelCompleteAction {
  return {
    id: "retryTrial",
    label: "Retry trial",
    variant: "ghost",
    accessibilityHint: `Starts the lantern trial again at level ${LANTERN_TRIAL_LEVEL}`,
    route: {
      pathname: "/game",
      params: {
        startLevel: String(LANTERN_TRIAL_LEVEL),
        playLevel: String(LANTERN_TRIAL_LEVEL),
        difficulty,
      },
    },
  };
}

export function levelCompleteView(input: {
  clearedLevel: number;
  startLevel: number;
  score: number;
  shardsEarned: number;
  difficulty: DifficultyId;
}): LevelCompleteView {
  const clearedLevel = clampPlayLevel(input.clearedLevel);
  const startLevel = clampPlayLevel(input.startLevel);
  const nextPlayLevel = continuePlayLevelAfterClear(clearedLevel);

  if (nextPlayLevel == null) {
    return {
      journeyComplete: true,
      title: JOURNEY_COMPLETE_TITLE,
      copy: journeyCompleteCopy(input.shardsEarned),
      actions: [homeAction("primary"), stagesAction(), retryTrialAction(input.difficulty)],
    };
  }

  return {
    journeyComplete: false,
    title: levelClearTitle(clearedLevel),
    copy: LEVEL_CLEAR_COPY(input.shardsEarned),
    actions: [
      continueAction(startLevel, nextPlayLevel, input.score, input.difficulty),
      homeAction("ghost"),
    ],
  };
}
