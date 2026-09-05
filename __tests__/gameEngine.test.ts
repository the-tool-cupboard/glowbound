import {
  calculateScoreForLevel,
  generateUniqueTargetCellIds,
  hasCompletedPattern,
  isCorrectSelection,
} from "../lib/gameEngine";
import { getLevelConfig, getStagesForLevel, isCheckpointUnlocked } from "../lib/gameConfig";

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

  it.each([3, 4, 5, 6])(
    "keeps all cells unique on a %s-wide grid at capacity",
    (gridSize) => {
      const capacity = gridSize * gridSize;
      const ids = generateUniqueTargetCellIds(capacity, capacity, () => 0.37);

      expect(ids).toHaveLength(capacity);
      expect(new Set(ids).size).toBe(capacity);
      expect(ids.every((id) => id >= 0 && id < capacity)).toBe(true);
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
  it("starts level 1 with two targets on a 3x3 grid and a 1800ms preview", () => {
    const config = getLevelConfig(1);

    expect(config.gridSize).toBe(3);
    expect(config.targetCount).toBe(2);
    expect(config.previewDurationMs).toBe(1800);
  });

  it("grows the grid at the planned breakpoints", () => {
    expect(getLevelConfig(3).gridSize).toBe(3);
    expect(getLevelConfig(4).gridSize).toBe(4);
    expect(getLevelConfig(8).gridSize).toBe(5);
    expect(getLevelConfig(13).gridSize).toBe(6);
  });

  it("increases targets gradually and never exceeds capacity", () => {
    expect(getLevelConfig(3).targetCount).toBe(4);
    expect(getLevelConfig(20).targetCount).toBeLessThanOrEqual(36);
  });

  it("never shortens preview below 850ms", () => {
    expect(getLevelConfig(30).previewDurationMs).toBe(850);
  });

  it("treats level 0, negatives, and decimals as level 1", () => {
    expect(getLevelConfig(0)).toEqual(getLevelConfig(1));
    expect(getLevelConfig(-4)).toEqual(getLevelConfig(1));
    expect(getLevelConfig(1.9)).toEqual(getLevelConfig(1));
  });

  it("keeps a mid level, a high level, and an extreme level inside the 6x6 grid", () => {
    const level8 = getLevelConfig(8);
    const level25 = getLevelConfig(25);
    const level100 = getLevelConfig(100);

    expect(level8).toEqual({ gridSize: 5, targetCount: 9, previewDurationMs: 1310 });
    expect(level25.gridSize).toBe(6);
    expect(level25.targetCount).toBe(26);
    expect(level25.previewDurationMs).toBe(850);
    expect(level100.gridSize).toBe(6);
    expect(level100.targetCount).toBe(36);
    expect(level100.previewDurationMs).toBe(850);
  });

  it("does not produce an impossible target count for Infinity", () => {
    const config = getLevelConfig(Number.POSITIVE_INFINITY);

    expect(config.gridSize).toBe(6);
    expect(config.targetCount).toBe(36);
    expect(config.previewDurationMs).toBe(850);
  });

  it("does not throw for NaN, but the resulting config is not a playable finite level", () => {
    const config = getLevelConfig(Number.NaN);

    expect(Number.isFinite(config.gridSize)).toBe(true);
    expect(Number.isFinite(config.targetCount)).toBe(false);
    expect(Number.isFinite(config.previewDurationMs)).toBe(false);
  });
});

describe("getStagesForLevel", () => {
  it("requires at least three stages on early levels", () => {
    expect(getStagesForLevel(1)).toBe(3);
    expect(getStagesForLevel(4)).toBe(3);
  });

  it("asks for one extra stage in the Tower", () => {
    expect(getStagesForLevel(13)).toBe(4);
  });
});

describe("isCheckpointUnlocked", () => {
  it("keeps the Sleeping Woods unlocked", () => {
    expect(isCheckpointUnlocked(1, 0)).toBe(true);
    expect(isCheckpointUnlocked(1, 1)).toBe(true);
  });

  it("locks Castle Gate until the player reaches level 4", () => {
    expect(isCheckpointUnlocked(4, 3)).toBe(false);
    expect(isCheckpointUnlocked(4, 4)).toBe(true);
  });

  it("unlocks Crystal Ascent at level 8 without opening the Tower", () => {
    expect(isCheckpointUnlocked(8, 8)).toBe(true);
    expect(isCheckpointUnlocked(13, 8)).toBe(false);
  });
});
