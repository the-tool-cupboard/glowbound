import {
  calculateScoreForLevel,
  evaluateRuneTap,
  generateUniqueTargetCellIds,
  getRuneVisualState,
  hasCompletedPattern,
  isCorrectSelection,
  patternKey,
} from "../lib/gameEngine";
import {
  CHECKPOINTS,
  didUnlockCheckpoint,
  getCheckpointForLevel,
  getCheckpointTwistLine,
  getLevelConfig,
  getLevelInStage,
  getRuneCountForLevel,
  getStageIndex,
  getStagesForLevel,
  isCheckpointUnlocked,
  isLanternTrial,
} from "../lib/gameConfig";

describe("generateUniqueTargetCellIds", () => {
  it("generates unique target cell IDs", () => {
    const ids = generateUniqueTargetCellIds(9, 4, () => 0.42);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id >= 0 && id < 9)).toBe(true);
  });

  it("never exceeds the total cell range", () => {
    const ids = generateUniqueTargetCellIds(9, 20);

    expect(ids.length).toBeLessThanOrEqual(9);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id >= 0 && id < 9)).toBe(true);
  });

  it("clamps an oversized request to capacity", () => {
    expect(generateUniqueTargetCellIds(9, 100)).toHaveLength(9);
    expect(generateUniqueTargetCellIds(0, 3)).toHaveLength(0);
  });

  it("returns no IDs for a zero target count", () => {
    expect(generateUniqueTargetCellIds(9, 0)).toEqual([]);
  });

  it("can select a single in-range ID", () => {
    const ids = generateUniqueTargetCellIds(9, 1, () => 0);

    expect(ids).toEqual([0]);
  });

  it("skips a recently used pattern when a constant rng would otherwise repeat", () => {
    const first = generateUniqueTargetCellIds(9, 4, () => 0.2);
    const second = generateUniqueTargetCellIds(9, 4, () => 0.2, [patternKey(first)]);

    expect(patternKey(second)).not.toBe(patternKey(first));
    expect(second).toHaveLength(4);
    expect(new Set(second).size).toBe(4);
  });

  it.each([5, 9, 16, 36])(
    "keeps all cells unique on a %s-rune board at capacity",
    (runeCount) => {
      const ids = generateUniqueTargetCellIds(runeCount, runeCount, () => 0.37);

      expect(ids).toHaveLength(runeCount);
      expect(new Set(ids).size).toBe(runeCount);
      expect(ids.every((id) => id >= 0 && id < runeCount)).toBe(true);
    }
  );

  it("does not mutate the caller's target list when checking completion", () => {
    const selected = Object.freeze([1, 2, 5]);
    const targets = Object.freeze([1, 2, 5]);

    expect(hasCompletedPattern(selected, targets)).toBe(true);
    expect(selected).toEqual([1, 2, 5]);
    expect(targets).toEqual([1, 2, 5]);
  });
});

describe("isCorrectSelection", () => {
  it("accepts a target rune and rejects a miss", () => {
    expect(isCorrectSelection(2, [1, 2, 5])).toBe(true);
    expect(isCorrectSelection(8, [1, 2, 5])).toBe(false);
  });
});

describe("hasCompletedPattern", () => {
  it("is complete only when every target has been selected", () => {
    expect(hasCompletedPattern([1, 5, 2], [1, 2, 5])).toBe(true);
    expect(hasCompletedPattern([1, 2], [1, 2, 5])).toBe(false);
    expect(hasCompletedPattern([1, 2, 8], [1, 2, 5])).toBe(false);
  });
});

describe("calculateScoreForLevel", () => {
  it("awards ten points per completed level", () => {
    expect(calculateScoreForLevel(1)).toBe(10);
    expect(calculateScoreForLevel(4)).toBe(40);
  });
});

describe("getLevelConfig", () => {
  it("starts level 1 with five targets on a 9-rune lattice and a 1600ms preview", () => {
    const config = getLevelConfig(1);

    expect(config.layoutId).toBe("grid");
    expect(config.runeCount).toBe(9);
    expect(config.targetCount).toBe(5);
    expect(config.previewDurationMs).toBe(1600);
    expect(config.modifier).toBe("none");
  });

  it("uses a formula: +1 rune per level, +2 at each new stage", () => {
    expect(getRuneCountForLevel(1)).toBe(9);
    expect(getRuneCountForLevel(10)).toBe(18);
    expect(getRuneCountForLevel(11)).toBe(11);
    expect(getRuneCountForLevel(100)).toBe(36);
    expect(getStageIndex(1)).toBe(1);
    expect(getStageIndex(10)).toBe(1);
    expect(getStageIndex(11)).toBe(2);
    expect(getStageIndex(100)).toBe(10);
    expect(getLevelInStage(11)).toBe(1);
    expect(getLevelInStage(20)).toBe(10);
  });

  it("increases targets with a rising fill ratio and never exceeds capacity", () => {
    expect(getLevelConfig(10).targetCount).toBe(10);
    expect(getLevelConfig(100).targetCount).toBeLessThan(getLevelConfig(100).runeCount);
    expect(getLevelConfig(100).targetCount).toBe(29);
  });

  it("never shortens preview below 800ms", () => {
    expect(getLevelConfig(100).previewDurationMs).toBe(800);
    expect(getLevelConfig(30).previewDurationMs).toBeGreaterThanOrEqual(800);
  });

  it("treats level 0, negatives, and decimals as level 1", () => {
    expect(getLevelConfig(0)).toEqual(getLevelConfig(1));
    expect(getLevelConfig(-4)).toEqual(getLevelConfig(1));
    expect(getLevelConfig(1.9)).toEqual(getLevelConfig(1));
  });

  it("keeps a mid level, a high level, and an extreme level on the 10-stage curve", () => {
    const level10 = getLevelConfig(10);
    const level50 = getLevelConfig(50);
    const level100 = getLevelConfig(100);

    expect(level10).toEqual({
      layoutId: "grid",
      runeCount: 18,
      targetCount: 10,
      previewDurationMs: 1528,
      modifier: "none",
    });
    expect(level50.layoutId).toBe("hex");
    expect(level50.runeCount).toBe(26);
    expect(level50.targetCount).toBe(17);
    expect(level50.modifier).toBe("emberFade");
    expect(level100.layoutId).toBe("spiral");
    expect(level100.runeCount).toBe(36);
    expect(level100.targetCount).toBe(29);
    expect(level100.modifier).toBe("bound");
    expect(getLevelConfig(140)).toEqual(level100);
  });

  it("treats Infinity like level 1", () => {
    expect(getLevelConfig(Number.POSITIVE_INFINITY)).toEqual(getLevelConfig(1));
  });

  it("treats NaN like level 1", () => {
    expect(getLevelConfig(Number.NaN)).toEqual(getLevelConfig(1));
  });
});

describe("getStagesForLevel", () => {
  it("asks for five patterns on every level", () => {
    expect(getStagesForLevel(1)).toBe(5);
    expect(getStagesForLevel(4)).toBe(5);
    expect(getStagesForLevel(13)).toBe(5);
    expect(getStagesForLevel(100)).toBe(5);
  });
});

describe("isCheckpointUnlocked", () => {
  it("keeps the Sleeping Woods unlocked", () => {
    expect(isCheckpointUnlocked(1, 0)).toBe(true);
    expect(isCheckpointUnlocked(1, 1)).toBe(true);
  });

  it("locks Castle Gate until the player reaches level 11", () => {
    expect(isCheckpointUnlocked(11, 10)).toBe(false);
    expect(isCheckpointUnlocked(11, 11)).toBe(true);
  });

  it("unlocks later stages only at their start levels", () => {
    expect(isCheckpointUnlocked(21, 20)).toBe(false);
    expect(isCheckpointUnlocked(21, 21)).toBe(true);
    expect(isCheckpointUnlocked(91, 90)).toBe(false);
    expect(CHECKPOINTS).toHaveLength(10);
  });
});

describe("didUnlockCheckpoint", () => {
  it("ignores the always-unlocked first chapter", () => {
    expect(didUnlockCheckpoint(0, 1)).toBe(false);
    expect(didUnlockCheckpoint(1, 1)).toBe(false);
  });

  it("fires once when progress first reaches a later checkpoint", () => {
    expect(didUnlockCheckpoint(10, 11)).toBe(true);
    expect(didUnlockCheckpoint(11, 11)).toBe(false);
    expect(didUnlockCheckpoint(11, 20)).toBe(false);
    expect(didUnlockCheckpoint(20, 21)).toBe(true);
  });
});

describe("getCheckpointForLevel", () => {
  it("keeps levels 1 through 10 in the Sleeping Woods", () => {
    expect(getCheckpointForLevel(1).title).toBe("Sleeping Woods");
    expect(getCheckpointForLevel(10).title).toBe("Sleeping Woods");
  });

  it("moves to Castle Gate at level 11", () => {
    expect(getCheckpointForLevel(11).title).toBe("Castle Gate");
    expect(getCheckpointForLevel(20).title).toBe("Castle Gate");
    expect(getCheckpointForLevel(11).modifier).toBe("gatePulse");
  });

  it("exposes a layout · twist subline for the Stages list", () => {
    expect(getCheckpointTwistLine(getCheckpointForLevel(1))).toBe("Lattice · Stillness");
    expect(getCheckpointTwistLine(getCheckpointForLevel(21))).toBe("Diamond · Reflection");
    expect(getCheckpointTwistLine(getCheckpointForLevel(100))).toBe("Spiral · Lantern trial");
  });
});

describe("evaluateRuneTap", () => {
  it("accepts any remaining target when input is a set match", () => {
    expect(evaluateRuneTap(5, [1, 2, 5], [1], false)).toBe("correct");
    expect(evaluateRuneTap(8, [1, 2, 5], [1], false)).toBe("wrong");
  });

  it("requires falling-order taps on Harsh Starfall", () => {
    expect(evaluateRuneTap(1, [1, 2, 5], [], true)).toBe("correct");
    expect(evaluateRuneTap(5, [1, 2, 5], [], true)).toBe("wrong");
    expect(evaluateRuneTap(2, [1, 2, 5], [1], true)).toBe("correct");
  });
});

describe("getRuneVisualState", () => {
  const base = {
    phase: "preview" as const,
    targetCellIds: [1, 4],
    selectedCellIds: [] as number[],
    wrongCellId: null,
  };

  it("lights only the current pulse during an ordered preview", () => {
    expect(getRuneVisualState(1, { ...base, previewCellIds: [1] })).toBe("previewTarget");
    expect(getRuneVisualState(4, { ...base, previewCellIds: [1] })).toBe("inactive");
  });

  it("shows dim glints and mirrored ghosts on top of the idle board", () => {
    expect(getRuneVisualState(7, { ...base, glintCellIds: [7] })).toBe("previewGlint");
    expect(getRuneVisualState(3, { ...base, ghostCellIds: [3], previewCellIds: [] })).toBe(
      "previewGhost"
    );
  });

  it("keeps real targets idle during a glint-only flash", () => {
    const snapshot = { ...base, previewCellIds: [] as number[], glintCellIds: [7] };
    expect(getRuneVisualState(1, snapshot)).toBe("inactive");
    expect(getRuneVisualState(4, snapshot)).toBe("inactive");
    expect(getRuneVisualState(7, snapshot)).toBe("previewGlint");
  });

  it("cools the whole idle board after embers fade", () => {
    expect(
      getRuneVisualState(2, {
        phase: "playerInput",
        targetCellIds: [1, 4],
        selectedCellIds: [],
        wrongCellId: null,
        cooledBoard: true,
      })
    ).toBe("emberCooled");
  });
});

describe("isLanternTrial", () => {
  it("is only the final Bound level", () => {
    expect(isLanternTrial(99)).toBe(false);
    expect(isLanternTrial(100)).toBe(true);
    expect(isLanternTrial(140)).toBe(true);
  });
});

