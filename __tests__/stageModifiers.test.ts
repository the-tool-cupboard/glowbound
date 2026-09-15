import { CHECKPOINTS, getLevelConfig } from "../lib/gameConfig";
import { getLayout } from "../lib/runeLayouts";
import {
  GATE_PULSE_HOLD_MS,
  GATE_PULSE_MIN_MS,
  GATE_PULSE_STATUS_NOTE,
  MIRROR_GHOST_MS,
  MIRROR_SETTLE_MS,
  MOONWELL_STATUS_NOTE,
  STARFALL_HOLD_MS,
  STARFALL_ORDER_STATUS_NOTE,
  STARFALL_STEP_MIN_MS,
  STARFALL_WATCH_STATUS_NOTE,
  applyCalmPreviewBonus,
  applyTargetSwap,
  buildRoundPresentation,
  emberFadeAtMs,
  flightStatusNote,
  mirroredCellId,
  pickFacetGlints,
  pickGrantedCell,
  pickRipenRotSwap,
  resolveStageRules,
  roundPreviewStatusNote,
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
    expect(rules.sequentialPreview).toBe("accumulateBottomToTop");
    expect(rules.orderedInput).toBe(false);
    expect(resolveStageRules(11, "harsh").orderedInput).toBe(false);
  });

  it("skips Moonwell reflection and Crystal glare on Calm", () => {
    expect(resolveStageRules(21, "calm").mirrorGhost).toBe(false);
    expect(resolveStageRules(21, "standard").mirrorGhost).toBe(true);
    expect(resolveStageRules(21, "harsh").mirrorGhost).toBe(true);
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

  it("accumulates Castle Gate from the bottom, then holds the full shape", () => {
    const rules = resolveStageRules(11, "standard");
    const targets = [0, 1, 2];
    const layout = getLayout("triangle", 9);
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout,
      previewMs: 900,
      kind: "round",
      rng: () => 0,
    });
    const ordered = sortByBoardY(targets, layout.points, "bottomFirst");
    expect(plan.steps).toHaveLength(ordered.length + 1);
    expect(plan.steps.slice(0, ordered.length).map((step) => step.previewCellIds)).toEqual(
      ordered.map((_, index) => ordered.slice(0, index + 1))
    );
    expect(plan.steps[0]?.durationMs).toBe(300);
    expect(plan.steps[ordered.length]?.previewCellIds).toEqual(ordered);
    expect(plan.steps[ordered.length]?.durationMs).toBe(GATE_PULSE_HOLD_MS);
    expect(plan.inputTargets).toEqual(targets);
  });

  it("keeps each Gate pulse at least GATE_PULSE_MIN_MS", () => {
    const rules = resolveStageRules(11, "calm");
    const targets = [0, 1, 2];
    const layout = getLayout("triangle", 9);
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout,
      previewMs: 300,
      kind: "round",
      rng: () => 0,
    });
    expect(GATE_PULSE_MIN_MS).toBe(170);
    expect(GATE_PULSE_HOLD_MS).toBe(220);
    expect(plan.steps.slice(0, targets.length).every((step) => step.durationMs === GATE_PULSE_MIN_MS)).toBe(
      true
    );
  });

  it("accumulates Starfall from the top, then holds the constellation", () => {
    const rules = resolveStageRules(61, "standard");
    const targets = [0, 1, 2];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 900,
      kind: "round",
      rng: () => 0,
    });
    const ordered = sortByBoardY(targets, diamond.points, "topFirst");
    expect(plan.steps).toHaveLength(ordered.length + 1);
    expect(plan.steps.slice(0, ordered.length).map((step) => step.previewCellIds)).toEqual(
      ordered.map((_, index) => ordered.slice(0, index + 1))
    );
    expect(plan.steps[ordered.length]?.previewCellIds).toEqual(ordered);
    expect(plan.steps[ordered.length]?.durationMs).toBe(STARFALL_HOLD_MS);
    expect(plan.inputTargets).toEqual(ordered);
  });

  it("keeps each Starfall step at least STARFALL_STEP_MIN_MS", () => {
    const rules = resolveStageRules(61, "calm");
    const targets = [0, 1, 2];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 300,
      kind: "round",
      rng: () => 0,
    });
    expect(STARFALL_STEP_MIN_MS).toBe(160);
    expect(STARFALL_HOLD_MS).toBe(250);
    expect(plan.steps.slice(0, targets.length).every((step) => step.durationMs === STARFALL_STEP_MIN_MS)).toBe(
      true
    );
    expect(plan.steps[targets.length]?.durationMs).toBe(STARFALL_HOLD_MS);
  });

  it("adds a settle beat then a mirrored ghost after Moonwell preview on Standard", () => {
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
    expect(MIRROR_SETTLE_MS).toBe(120);
    expect(MIRROR_GHOST_MS).toBe(380);
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps[0]?.previewCellIds).toEqual(targets);
    expect(plan.steps[0]?.ghostCellIds).toEqual([]);
    expect(plan.steps[1]).toEqual({
      previewCellIds: [],
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: MIRROR_SETTLE_MS,
    });
    expect(plan.steps[2]?.durationMs).toBe(MIRROR_GHOST_MS);
    expect(plan.steps[2]?.previewCellIds).toEqual([]);
    expect(plan.steps[2]?.glintCellIds).toEqual([]);
    expect(plan.steps[2]?.ghostCellIds).toEqual(
      targets.map((id) => mirroredCellId(id, diamond.points))
    );
    expect(plan.inputTargets).toEqual(targets);
  });

  it("keeps Moonwell Calm without a mirror ghost or settle beat", () => {
    const rules = resolveStageRules(21, "calm");
    expect(rules.mirrorGhost).toBe(false);
    const targets = [0, 3];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 1000,
      kind: "round",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.previewCellIds).toEqual(targets);
    expect(plan.steps[0]?.ghostCellIds).toEqual([]);
    expect(plan.inputTargets).toEqual(targets);
  });

  it("keeps Moonwell Harsh on the same real-then-ghost path as Standard", () => {
    const rules = resolveStageRules(21, "harsh");
    expect(rules.mirrorGhost).toBe(true);
    const targets = [1, 2];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: diamond,
      previewMs: 900,
      kind: "round",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps[1]?.durationMs).toBe(MIRROR_SETTLE_MS);
    expect(plan.steps[2]?.ghostCellIds).toEqual(
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

  it("does not replay sequential pulse during Second Sight", () => {
    const rules = resolveStageRules(11, "standard");
    const plan = buildRoundPresentation({
      rules,
      targets: [0, 1, 2],
      layout: getLayout("triangle", 9),
      previewMs: 900,
      kind: "sight",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.previewCellIds).toEqual([0, 1, 2]);
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

describe("preview status notes", () => {
  it("teaches Gate pulse during preview and leaves Woods on the generic line", () => {
    const gate = resolveStageRules(11, "standard");
    expect(roundPreviewStatusNote(gate, 0, 1)).toBe(GATE_PULSE_STATUS_NOTE);
    expect(roundPreviewStatusNote(resolveStageRules(1, "standard"), 0, 1)).toBeNull();
  });

  it("teaches Starfall by difficulty during preview", () => {
    expect(roundPreviewStatusNote(resolveStageRules(61, "calm"), 0, 1)).toBe(
      STARFALL_WATCH_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(61, "standard"), 0, 1)).toBe(
      STARFALL_WATCH_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(61, "harsh"), 0, 1)).toBe(
      STARFALL_ORDER_STATUS_NOTE
    );
    expect(STARFALL_WATCH_STATUS_NOTE).toBe("Starfall — watch them fall.");
    expect(STARFALL_ORDER_STATUS_NOTE).toBe("Starfall — match the order.");
  });

  it("teaches Moonwell on every difficulty during preview", () => {
    expect(MOONWELL_STATUS_NOTE).toBe("Moonwell — the water lies.");
    expect(roundPreviewStatusNote(resolveStageRules(21, "calm"), 0, 1)).toBe(MOONWELL_STATUS_NOTE);
    expect(roundPreviewStatusNote(resolveStageRules(21, "standard"), 0, 1)).toBe(
      MOONWELL_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(21, "harsh"), 0, 1)).toBe(MOONWELL_STATUS_NOTE);
  });

  it("keeps lantern trial and two-flight notes ahead of Gate and Starfall copy", () => {
    expect(roundPreviewStatusNote(resolveStageRules(100, "standard"), 0, 2)).toBe("Lantern Trial.");
    expect(roundPreviewStatusNote(resolveStageRules(51, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(61, "harsh"), lanternTrial: true }, 0, 1)).toBe(
      "Lantern Trial."
    );
    expect(roundPreviewStatusNote(resolveStageRules(61, "harsh"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote(resolveStageRules(11, "standard"), 0, 1)).toBe(GATE_PULSE_STATUS_NOTE);
    expect(roundPreviewStatusNote(resolveStageRules(41, "standard"), 0, 1)).toBeNull();
    expect(roundPreviewStatusNote(resolveStageRules(71, "standard"), 0, 1)).toBeNull();
    expect(roundPreviewStatusNote({ ...resolveStageRules(21, "standard"), lanternTrial: true }, 0, 1)).toBe(
      "Lantern Trial."
    );
    expect(roundPreviewStatusNote(resolveStageRules(21, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
  });
});

describe("bound preview curve", () => {
  it("shortens The Bound slightly within the stage before hitting the floor", () => {
    expect(getLevelConfig(91).previewDurationMs).toBe(870);
    expect(getLevelConfig(100).previewDurationMs).toBe(800);
  });
});
