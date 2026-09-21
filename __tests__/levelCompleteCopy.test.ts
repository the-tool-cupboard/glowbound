import { LANTERN_TRIAL_LEVEL, MAX_LEVEL } from "../lib/gameConfig";
import {
  JOURNEY_COMPLETE_COPY,
  JOURNEY_COMPLETE_TITLE,
  continuePlayLevelAfterClear,
  isJourneyComplete,
  journeyCompleteCopy,
  levelClearTitle,
  levelCompleteView,
} from "../lib/levelCompleteCopy";

describe("continuePlayLevelAfterClear", () => {
  it("advances levels 1–99 and never invents a level 101", () => {
    expect(continuePlayLevelAfterClear(1)).toBe(2);
    expect(continuePlayLevelAfterClear(99)).toBe(MAX_LEVEL);
    expect(continuePlayLevelAfterClear(MAX_LEVEL)).toBeNull();
    expect(continuePlayLevelAfterClear(140)).toBeNull();
  });
});

describe("isJourneyComplete", () => {
  it("is only the lantern trial / Bound finale", () => {
    expect(isJourneyComplete(99)).toBe(false);
    expect(isJourneyComplete(MAX_LEVEL)).toBe(true);
    expect(isJourneyComplete(LANTERN_TRIAL_LEVEL)).toBe(true);
  });
});

describe("levelCompleteView", () => {
  const midRun = levelCompleteView({
    clearedLevel: 42,
    startLevel: 41,
    score: 880,
    shardsEarned: 12,
    difficulty: "harsh",
  });

  const finale = levelCompleteView({
    clearedLevel: 100,
    startLevel: 91,
    score: 2400,
    shardsEarned: 80,
    difficulty: "standard",
  });

  it("keeps Continue for a mid-journey clear", () => {
    expect(midRun.journeyComplete).toBe(false);
    expect(midRun.title).toBe(levelClearTitle(42));
    expect(midRun.copy).toBe("You earned 12 embers.");
    expect(midRun.actions.map((action) => action.id)).toEqual(["continue", "home"]);
    expect(midRun.actions[0]).toMatchObject({
      label: "Continue",
      variant: "primary",
      accessibilityHint: "Continues this run at level 43",
      route: {
        pathname: "/game",
        params: {
          startLevel: "41",
          playLevel: "43",
          resumeScore: "880",
          difficulty: "harsh",
        },
      },
    });
    expect(midRun.actions[1]).toMatchObject({
      id: "home",
      label: "Return Home",
      variant: "ghost",
      route: { pathname: "/" },
    });
  });

  it("routes Bound finale to a journey-complete end state without Continue", () => {
    expect(finale.journeyComplete).toBe(true);
    expect(finale.title).toBe(JOURNEY_COMPLETE_TITLE);
    expect(finale.copy).toBe(journeyCompleteCopy(80));
    expect(finale.copy).toContain(JOURNEY_COMPLETE_COPY);
    expect(finale.copy).toContain("You earned 80 embers.");
    expect(finale.copy).not.toMatch(/101/);
    expect(finale.actions.map((action) => action.id)).toEqual(["home", "stages", "retryTrial"]);
    expect(finale.actions.some((action) => action.id === "continue")).toBe(false);
    expect(finale.actions[0]).toMatchObject({
      label: "Return Home",
      variant: "primary",
      route: { pathname: "/" },
    });
    expect(finale.actions[1]).toMatchObject({
      label: "Stages",
      variant: "ghost",
      route: { pathname: "/levels" },
    });
    expect(finale.actions[2]).toMatchObject({
      label: "Retry trial",
      variant: "ghost",
      accessibilityHint: `Starts the lantern trial again at level ${LANTERN_TRIAL_LEVEL}`,
      route: {
        pathname: "/game",
        params: {
          startLevel: String(LANTERN_TRIAL_LEVEL),
          playLevel: String(LANTERN_TRIAL_LEVEL),
          difficulty: "standard",
        },
      },
    });
    expect(finale.actions[2]?.route.params?.playLevel).not.toBe("101");
  });

  it("does not resume a finished run onto a clamped level 100 Continue", () => {
    const clamped = levelCompleteView({
      clearedLevel: 999,
      startLevel: 91,
      score: 10,
      shardsEarned: 0,
      difficulty: "calm",
    });

    expect(clamped.journeyComplete).toBe(true);
    expect(clamped.actions.map((action) => action.id)).toEqual(["home", "stages", "retryTrial"]);
  });
});
