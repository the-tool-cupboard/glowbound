import { CHECKPOINTS, getLevelConfig } from "../lib/gameConfig";
import { getLayout } from "../lib/runeLayouts";
import {
  MIRROR_GHOST_MS,
  applyCalmPreviewBonus,
  applyTargetSwap,
  buildRoundPresentation,
  emberFadeAtMs,
  mirroredCellId,
  pickFacetGlints,
  pickGrantedCell,
  pickRipenRotSwap,
  resolveStageRules,
  sortByBoardY,
  splitTwoFlight,
} from "../lib/stageModifiers";
import { chapterArtKey } from "../lib/chapterBackgrounds";

describe("checkpoint modifiers", () => {
  it("gives each of the ten stages a unique modifier and art key", () => {
    expect(CHECKPOINTS).toHaveLength(10);
    const modifiers = CHECKPOINTS.map((checkpoint) => checkpoint.modifier);
    const artKeys = CHECKPOINTS.map((checkpoint) => checkpoint.artKey);
    expect(new Set(modifiers).size).toBe(10);
    expect(new Set(artKeys).size).toBe(10);
  });

  it("maps every chapter to a background art key", () => {
    expect(chapterArtKey(1)).toBe("sleepingWoods");
    expect(chapterArtKey(11)).toBe("castleGate");
    expect(chapterArtKey(21)).toBe("moonwell");
    expect(chapterArtKey(31)).toBe("crystalAscent");
    expect(chapterArtKey(41)).toBe("emberBridge");
    expect(chapterArtKey(51)).toBe("theTower");
    expect(chapterArtKey(61)).toBe("starfall");
    expect(chapterArtKey(71)).toBe("hollowCrown");
    expect(chapterArtKey(81)).toBe("nightOrchard");
    expect(chapterArtKey(91)).toBe("theBound");
  });
});

describe("resolveStageRules", () => {
  it("keeps Sleeping Woods as the baseline and adds Calm linger", () => {
    const calm = resolveStageRules(1, "calm");
    expect(calm.modifier).toBe("none");
    expect(calm.calmPreviewBonusMs).toBe(100);
    expect(calm.mirrorGhost).toBe(false);
    expect(applyCalmPreviewBonus(1600, calm)).toBe(1700);
    expect(resolveStageRules(1, "standard").calmPreviewBonusMs).toBe(0);
  });

  it("pulses Castle Gate for every path without Simon-strict input", () => {
    const rules = resolveStageRules(11, "standard");
    expect(rules.sequentialPreview).toBe("bottomToTop");
    expect(rules.orderedInput).toBe(false);
    expect(resolveStageRules(11, "harsh").orderedInput).toBe(false);
  });

  it("skips Moonwell reflection and Crystal glare on Calm", () => {
    expect(resolveStageRules(21, "calm").mirrorGhost).toBe(false);
    expect(resolveStageRules(21, "standard").mirrorGhost).toBe(true);
    expect(resolveStageRules(31, "calm").facetGlare).toBe(false);
    expect(resolveStageRules(31, "harsh").facetGlare).toBe(true);
  });

  it("requires falling order only on Harsh Starfall", () => {
    expect(resolveStageRules(61, "calm").orderedInput).toBe(false);
    expect(resolveStageRules(61, "standard").orderedInput).toBe(false);
    expect(resolveStageRules(61, "harsh").orderedInput).toBe(true);
    expect(resolveStageRules(61, "harsh").sequentialPreview).toBe("accumulateTopToBottom");
  });

  it("hides the Hollow Crown grant until input on Harsh", () => {
    expect(resolveStageRules(71, "standard").crownGrant).toBe("shown");
    expect(resolveStageRules(71, "harsh").crownGrant).toBe("hiddenUntilInput");
  });

  it("splits The Tower and the Lantern Trial into two flights", () => {
    expect(resolveStageRules(51, "standard").twoFlight).toBe(true);
    expect(resolveStageRules(100, "standard").twoFlight).toBe(true);
    expect(resolveStageRules(100, "standard").lanternTrial).toBe(true);
    expect(resolveStageRules(91, "standard").lanternTrial).toBe(false);
  });
});

describe("splitTwoFlight", () => {
  it("splits a pattern into two shorter flights", () => {
    expect(splitTwoFlight([1, 2, 3, 4, 5])).toEqual({
      a: [1, 2, 3],
      b: [4, 5],
    });
    expect(splitTwoFlight([7])).toBeNull();
  });
});

describe("preview presentation", () => {
  const diamond = getLayout("diamond", 9);

  it("flashes Castle Gate targets from the bottom of the triad upward", () => {
    const rules = resolveStageRules(11, "standard");
    const targets = [0, 1, 2];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: getLayout("triangle", 9),
      previewMs: 900,
      kind: "round",
      rng: () => 0,
    });
    const ordered = sortByBoardY(targets, getLayout("triangle", 9).points, "bottomFirst");
    expect(plan.steps.map((step) => step.previewCellIds)).toEqual(ordered.map((id) => [id]));
    expect(plan.inputTargets).toEqual(targets);
  });

  it("adds a mirrored ghost after Moonwell preview on Standard", () => {
    const rules = resolveStageRules(21, "standard");
    const targets = [0, 3];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 1000,
      kind: "round",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[1]?.durationMs).toBe(MIRROR_GHOST_MS);
    expect(plan.steps[1]?.ghostCellIds).toEqual(
      targets.map((id) => mirroredCellId(id, diamond.points))
    );
    expect(plan.inputTargets).toEqual(targets);
  });

  it("plants one or two facet glints on non-targets", () => {
    const glints = pickFacetGlints(9, [0, 1, 2, 3, 4], () => 0);
    expect(glints).toHaveLength(2);
    expect(glints.every((id) => ![0, 1, 2, 3, 4].includes(id))).toBe(true);
  });

  it("swaps one Night Orchard target with a neighbor for the input board", () => {
    const rules = resolveStageRules(81, "standard");
    const targets = [0, 1, 2];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 800,
      kind: "round",
      rng: () => 0,
    });
    const swap = pickRipenRotSwap(targets, diamond.points, () => 0);
    expect(swap).not.toBeNull();
    expect(plan.inputTargets).toEqual(applyTargetSwap(targets, swap!));
    expect(plan.inputTargets).not.toEqual(targets);
  });

  it("grants the topmost Hollow Crown rune", () => {
    const granted = pickGrantedCell([0, 1, 2, 3], diamond.points);
    const top = sortByBoardY([0, 1, 2, 3], diamond.points, "topFirst")[0];
    expect(granted).toBe(top);
  });

  it("fades embers after 40% of the soft input window", () => {
    expect(emberFadeAtMs()).toBe(2400);
  });

  it("does not replay mirror or glare during Second Sight", () => {
    const rules = resolveStageRules(21, "standard");
    const plan = buildRoundPresentation({
      rules,
      targets: [1, 2],
      layout: diamond,
      previewMs: 900,
      kind: "sight",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.ghostCellIds).toEqual([]);
  });
});

describe("bound preview curve", () => {
  it("shortens The Bound slightly within the stage before hitting the floor", () => {
    expect(getLevelConfig(91).previewDurationMs).toBe(870);
    expect(getLevelConfig(100).previewDurationMs).toBe(800);
  });
});
