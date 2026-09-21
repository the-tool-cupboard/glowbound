import { CHECKPOINTS, getLevelConfig } from "../lib/gameConfig";
import { getLayout } from "../lib/runeLayouts";
import {
  BOUND_CHAPTER_STATUS_NOTE,
  CRYSTAL_ASCENT_STATUS_NOTE,
  CROWN_CLAIMED_INPUT_NOTE,
  CROWN_HIDDEN_STATUS_NOTE,
  CROWN_INPUT_HOLD_MS,
  CROWN_SHOWN_STATUS_NOTE,
  EMBER_BRIDGE_STATUS_NOTE,
  EMBER_FADE_STATUS_NOTE,
  EMBER_FADE_SWAP_MS,
  FACET_GLINT_MS,
  FACET_GLINT_SETTLE_MS,
  GATE_PULSE_HOLD_MS,
  GATE_PULSE_MIN_MS,
  GATE_PULSE_STATUS_NOTE,
  LANTERN_TRIAL_FINAL_SEAL_NOTE,
  LANTERN_TRIAL_FIRST_SEAL_NOTE,
  LANTERN_TRIAL_HOLD_MS,
  LANTERN_TRIAL_HOLD_NOTE,
  MIRROR_GHOST_MS,
  MIRROR_SETTLE_MS,
  MOONWELL_STATUS_NOTE,
  NIGHT_ORCHARD_STATUS_NOTE,
  RIPEN_ROT_LAND_MS,
  RIPEN_ROT_LEAVE_MS,
  RIPEN_ROT_SETTLE_MS,
  SLEEPING_WOODS_INPUT_NOTE,
  SLEEPING_WOODS_LAST_CHANCE_NO_WARD,
  SLEEPING_WOODS_LAST_CHANCE_STATUS,
  SLEEPING_WOODS_LAST_CHANCE_TITLE,
  SLEEPING_WOODS_LAST_CHANCE_WARD,
  SLEEPING_WOODS_STATUS_NOTE,
  STARFALL_HOLD_MS,
  STARFALL_ORDER_STATUS_NOTE,
  STARFALL_STEP_MIN_MS,
  STARFALL_WATCH_STATUS_NOTE,
  TOWER_ASCEND_MS,
  TOWER_ASCEND_NOTE,
  TOWER_FIRST_FLIGHT_NOTE,
  TOWER_SECOND_FLIGHT_NOTE,
  WATCH_TAP_SETTLE_MS,
  WATCH_TAP_TAP_MS,
  WATCH_TAP_TAP_NOTE,
  WATCH_TAP_WATCH_MS,
  WATCH_TAP_WATCH_NOTE,
  WOODS_HOLD_MS,
  WOODS_LAST_CHANCE_HOLD_MS,
  applyCalmPreviewBonus,
  applyTargetSwap,
  betweenFlightHoldMs,
  betweenFlightHoldNote,
  buildRoundPresentation,
  emberFadeAtMs,
  flightStatusNote,
  inputStatusFlightNote,
  isTowerTwoFlight,
  lanternTrialSealNote,
  mirroredCellId,
  pickEmberFadeSwap,
  pickFacetGlints,
  pickGrantedCell,
  pickRipenRotSwap,
  resolveEmberFadeSwap,
  resolveStageRules,
  roundPreviewStatusNote,
  sortByBoardY,
  splitTwoFlight,
  towerFlightNote,
  shouldShowWatchTapCoach,
  watchTapBeatDurationMs,
  woodsInputStatusNote,
  woodsLastChanceCoachTrigger,
  woodsLastChanceCopy,
  woodsLastChanceStatusNote,
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
    expect(resolveStageRules(71, "calm").crownGrant).toBe("shown");
    expect(resolveStageRules(71, "standard").crownGrant).toBe("shown");
    expect(resolveStageRules(71, "harsh").crownGrant).toBe("hiddenUntilInput");
  });

  it("cools Ember Bridge on every path and only swaps answers on Harsh", () => {
    const calm = resolveStageRules(41, "calm");
    const standard = resolveStageRules(41, "standard");
    const harsh = resolveStageRules(41, "harsh");
    expect(calm.emberFade).toBe(true);
    expect(standard.emberFade).toBe(true);
    expect(harsh.emberFade).toBe(true);
    expect(calm.emberFadeSwap).toBe(false);
    expect(standard.emberFadeSwap).toBe(false);
    expect(harsh.emberFadeSwap).toBe(true);
    expect(resolveStageRules(1, "harsh").emberFadeSwap).toBe(false);
  });

  it("keeps Night Orchard neighbor swaps on every difficulty", () => {
    expect(resolveStageRules(81, "calm").ripenRot).toBe(true);
    expect(resolveStageRules(81, "standard").ripenRot).toBe(true);
    expect(resolveStageRules(81, "harsh").ripenRot).toBe(true);
    expect(resolveStageRules(1, "harsh").ripenRot).toBe(false);
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
  const grid = getLayout("grid", 9);

  it("holds Sleeping Woods on the full pattern after the plain preview", () => {
    expect(WOODS_HOLD_MS).toBe(200);
    const targets = [0, 1, 2];
    for (const difficulty of ["calm", "standard", "harsh"] as const) {
      const rules = resolveStageRules(1, difficulty);
      const previewMs = applyCalmPreviewBonus(1600, rules);
      const plan = buildRoundPresentation({
        rules,
        targets,
        layout: grid,
        previewMs,
        kind: "round",
        rng: () => 0,
      });
      expect(plan.steps).toHaveLength(2);
      expect(plan.steps[0]).toEqual({
        previewCellIds: targets,
        glintCellIds: [],
        ghostCellIds: [],
        durationMs: previewMs,
      });
      expect(plan.steps[1]).toEqual({
        previewCellIds: targets,
        glintCellIds: [],
        ghostCellIds: [],
        durationMs: WOODS_HOLD_MS,
      });
      expect(plan.inputTargets).toEqual(targets);
    }
    expect(applyCalmPreviewBonus(1600, resolveStageRules(1, "calm"))).toBe(1700);
    expect(applyCalmPreviewBonus(1600, resolveStageRules(1, "standard"))).toBe(1600);
    expect(applyCalmPreviewBonus(1600, resolveStageRules(1, "harsh"))).toBe(1600);
  });

  it("does not hold Sleeping Woods during Second Sight", () => {
    const plan = buildRoundPresentation({
      rules: resolveStageRules(1, "standard"),
      targets: [0, 1, 2],
      layout: grid,
      previewMs: 900,
      kind: "sight",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.previewCellIds).toEqual([0, 1, 2]);
    expect(plan.steps[0]?.durationMs).toBe(900);
  });

  it("keeps Gate, Bound, and Crystal Calm off the Woods hold", () => {
    const gateTargets = [0, 1, 2];
    const gateLayout = getLayout("triangle", 9);
    const gate = buildRoundPresentation({
      rules: resolveStageRules(11, "standard"),
      targets: gateTargets,
      layout: gateLayout,
      previewMs: 900,
      kind: "round",
      rng: () => 0,
    });
    const ordered = sortByBoardY(gateTargets, gateLayout.points, "bottomFirst");
    expect(gate.steps[gate.steps.length - 1]?.durationMs).toBe(GATE_PULSE_HOLD_MS);
    expect(gate.steps[gate.steps.length - 1]?.previewCellIds).toEqual(ordered);
    expect(gate.steps.every((step) => step.durationMs !== WOODS_HOLD_MS)).toBe(true);

    const bound = buildRoundPresentation({
      rules: resolveStageRules(91, "standard"),
      targets: [0, 1, 2],
      layout: getLayout("spiral", 9),
      previewMs: 870,
      kind: "round",
      rng: () => 0,
    });
    expect(bound.steps).toHaveLength(1);
    expect(bound.steps[0]?.durationMs).toBe(870);

    const crystalCalm = buildRoundPresentation({
      rules: resolveStageRules(31, "calm"),
      targets: [0, 3],
      layout: getLayout("ring", 9),
      previewMs: 1000,
      kind: "round",
      rng: () => 0,
    });
    expect(crystalCalm.steps).toHaveLength(1);
    expect(crystalCalm.steps[0]?.durationMs).toBe(1000);
  });

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

  it("flashes Crystal Ascent false glints alone, settles, then holds the real targets", () => {
    expect(FACET_GLINT_MS).toBe(240);
    expect(FACET_GLINT_SETTLE_MS).toBe(100);
    const rules = resolveStageRules(31, "standard");
    const targets = [0, 1, 2];
    const layout = getLayout("ring", 9);
    const previewMs = 1000;
    const glints = pickFacetGlints(layout.runeCount, targets, () => 0);
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout,
      previewMs,
      kind: "round",
      rng: () => 0,
    });
    expect(glints.length).toBeGreaterThan(0);
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps[0]).toEqual({
      previewCellIds: [],
      glintCellIds: glints,
      ghostCellIds: [],
      durationMs: FACET_GLINT_MS,
    });
    expect(plan.steps[1]).toEqual({
      previewCellIds: [],
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: FACET_GLINT_SETTLE_MS,
    });
    expect(plan.steps[2]).toEqual({
      previewCellIds: targets,
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: previewMs - FACET_GLINT_MS - FACET_GLINT_SETTLE_MS,
    });
    expect(plan.steps[2]!.durationMs).toBeGreaterThan(plan.steps[0]!.durationMs);
    expect(plan.steps[2]!.durationMs).toBeGreaterThan(
      plan.steps[0]!.durationMs + plan.steps[1]!.durationMs
    );
    expect(plan.inputTargets).toEqual(targets);
    expect(glints.every((id) => !targets.includes(id))).toBe(true);
  });

  it("keeps Crystal Ascent Harsh on the same lie-then-truth path as Standard", () => {
    const targets = [1, 2];
    const layout = getLayout("ring", 9);
    const previewMs = 900;
    const glints = pickFacetGlints(layout.runeCount, targets, () => 0);
    const plan = buildRoundPresentation({
      rules: resolveStageRules(31, "harsh"),
      targets,
      layout,
      previewMs,
      kind: "round",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps[0]?.previewCellIds).toEqual([]);
    expect(plan.steps[0]?.glintCellIds).toEqual(glints);
    expect(plan.steps[0]?.durationMs).toBe(FACET_GLINT_MS);
    expect(plan.steps[1]?.durationMs).toBe(FACET_GLINT_SETTLE_MS);
    expect(plan.steps[2]?.previewCellIds).toEqual(targets);
    expect(plan.steps[2]?.glintCellIds).toEqual([]);
    expect(plan.steps[2]?.durationMs).toBe(previewMs - FACET_GLINT_MS - FACET_GLINT_SETTLE_MS);
    expect(plan.inputTargets).toEqual(targets);
  });

  it("keeps Crystal Ascent Calm without a false-glint flash or settle beat", () => {
    const rules = resolveStageRules(31, "calm");
    expect(rules.facetGlare).toBe(false);
    const targets = [0, 3];
    const plan = buildRoundPresentation({
      rules,
      targets,
      layout: getLayout("ring", 9),
      previewMs: 1000,
      kind: "round",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]).toEqual({
      previewCellIds: targets,
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: 1000,
    });
    expect(plan.inputTargets).toEqual(targets);
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

  it("telegraphs Night Orchard as leave glint then land hilite then settle, not a bilateral ghost", () => {
    expect(RIPEN_ROT_LEAVE_MS).toBe(140);
    expect(RIPEN_ROT_LAND_MS).toBe(200);
    expect(RIPEN_ROT_SETTLE_MS).toBe(150);
    const targets = [0, 1, 2];
    const swap = pickRipenRotSwap(targets, diamond.points, () => 0);
    expect(swap).not.toBeNull();
    const from = swap!.from;
    const to = swap!.to;

    for (const difficulty of ["calm", "standard", "harsh"] as const) {
      const plan = buildRoundPresentation({
        rules: resolveStageRules(81, difficulty),
        targets,
        layout: diamond,
        previewMs: 800,
        kind: "round",
        rng: () => 0,
      });
      expect(plan.steps).toHaveLength(4);
      expect(plan.steps[0]).toEqual({
        previewCellIds: targets,
        glintCellIds: [],
        ghostCellIds: [],
        durationMs: 800,
      });
      expect(plan.steps[1]).toEqual({
        previewCellIds: [],
        glintCellIds: [from],
        ghostCellIds: [],
        durationMs: RIPEN_ROT_LEAVE_MS,
      });
      expect(plan.steps[2]).toEqual({
        previewCellIds: [to],
        glintCellIds: [],
        ghostCellIds: [],
        durationMs: RIPEN_ROT_LAND_MS,
      });
      expect(plan.steps[3]).toEqual({
        previewCellIds: [],
        glintCellIds: [],
        ghostCellIds: [],
        durationMs: RIPEN_ROT_SETTLE_MS,
      });
      expect(plan.steps.every((step) => step.ghostCellIds.length === 0)).toBe(true);
      expect(plan.inputTargets).toEqual(applyTargetSwap(targets, swap!));
    }
  });

  it("grants the topmost Hollow Crown rune", () => {
    const granted = pickGrantedCell([0, 1, 2, 3], diamond.points);
    const top = sortByBoardY([0, 1, 2, 3], diamond.points, "topFirst")[0];
    expect(granted).toBe(top);
  });

  it("holds Hollow Crown input briefly so the claim can land", () => {
    expect(CROWN_INPUT_HOLD_MS).toBe(150);
    expect(CROWN_CLAIMED_INPUT_NOTE).toBe("Claimed — tap the rest.");
  });

  it("fades embers after 40% of the soft input window", () => {
    expect(emberFadeAtMs()).toBe(2400);
  });

  it("telegraphs Harsh Ember swaps for about 400ms", () => {
    expect(EMBER_FADE_SWAP_MS).toBe(400);
  });

  it("skips Ember target swaps on Calm and Standard and keeps them on Harsh", () => {
    const remaining = [0, 1, 2];
    const rng = () => 0;
    const expected = pickEmberFadeSwap(remaining, diamond.points, rng);
    expect(expected).not.toBeNull();
    expect(
      resolveEmberFadeSwap(resolveStageRules(41, "calm"), remaining, diamond.points, rng)
    ).toBeNull();
    expect(
      resolveEmberFadeSwap(resolveStageRules(41, "standard"), remaining, diamond.points, rng)
    ).toBeNull();
    expect(
      resolveEmberFadeSwap(resolveStageRules(41, "harsh"), remaining, diamond.points, rng)
    ).toEqual(expected);
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

  it("does not replay Crystal Ascent glare during Second Sight", () => {
    const rules = resolveStageRules(31, "standard");
    const plan = buildRoundPresentation({
      rules,
      targets: [0, 1, 2],
      layout: getLayout("ring", 9),
      previewMs: 900,
      kind: "sight",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.previewCellIds).toEqual([0, 1, 2]);
    expect(plan.steps[0]?.glintCellIds).toEqual([]);
    expect(plan.inputTargets).toEqual([0, 1, 2]);
  });

  it("does not replay the Night Orchard move telegraph during Second Sight", () => {
    const rules = resolveStageRules(81, "standard");
    const plan = buildRoundPresentation({
      rules,
      targets: [0, 1, 2],
      layout: diamond,
      previewMs: 900,
      kind: "sight",
      rng: () => 0,
    });
    expect(plan.steps).toHaveLength(1);
    expect(plan.steps[0]?.previewCellIds).toEqual([0, 1, 2]);
    expect(plan.steps[0]?.glintCellIds).toEqual([]);
    expect(plan.steps[0]?.ghostCellIds).toEqual([]);
    expect(plan.inputTargets).toEqual([0, 1, 2]);
  });
});

describe("preview status notes", () => {
  it("teaches Sleeping Woods on every difficulty during preview and input", () => {
    expect(SLEEPING_WOODS_STATUS_NOTE).toBe("Sleeping Woods — watch, then tap.");
    expect(SLEEPING_WOODS_INPUT_NOTE).toBe("Tap what you saw.");
    expect(roundPreviewStatusNote(resolveStageRules(1, "calm"), 0, 1)).toBe(
      SLEEPING_WOODS_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(1, "standard"), 0, 1)).toBe(
      SLEEPING_WOODS_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(1, "harsh"), 0, 1)).toBe(
      SLEEPING_WOODS_STATUS_NOTE
    );
    expect(woodsInputStatusNote(resolveStageRules(1, "calm"))).toBe(SLEEPING_WOODS_INPUT_NOTE);
    expect(woodsInputStatusNote(resolveStageRules(1, "standard"))).toBe(SLEEPING_WOODS_INPUT_NOTE);
    expect(woodsInputStatusNote(resolveStageRules(1, "harsh"))).toBe(SLEEPING_WOODS_INPUT_NOTE);
  });

  it("teaches Gate pulse during preview and keeps Woods copy off Gate input", () => {
    const gate = resolveStageRules(11, "standard");
    expect(roundPreviewStatusNote(gate, 0, 1)).toBe(GATE_PULSE_STATUS_NOTE);
    expect(woodsInputStatusNote(gate)).toBeNull();
    expect(woodsInputStatusNote(resolveStageRules(71, "standard"))).toBeNull();
    expect(woodsInputStatusNote(resolveStageRules(51, "standard"))).toBeNull();
  });

  it("teaches Last Chance on the first Sleeping Woods miss only", () => {
    expect(WOODS_LAST_CHANCE_HOLD_MS).toBe(320);
    expect(SLEEPING_WOODS_LAST_CHANCE_STATUS).toBe("Last chance — watch, then tap.");
    expect(SLEEPING_WOODS_LAST_CHANCE_TITLE).toBe("Last chance");
    expect(SLEEPING_WOODS_LAST_CHANCE_WARD).toBe(
      "A Rune Ward can ignore this miss. Then watch, and tap what you saw."
    );
    expect(SLEEPING_WOODS_LAST_CHANCE_NO_WARD).toBe(
      "No Rune Ward this time. Next run, watch, then tap."
    );

    for (const difficulty of ["calm", "standard", "harsh"] as const) {
      const woods = resolveStageRules(1, difficulty);
      expect(woodsLastChanceCoachTrigger(woods, false)).toBe(true);
      expect(woodsLastChanceStatusNote(woods, false)).toBe(SLEEPING_WOODS_LAST_CHANCE_STATUS);
      expect(woodsLastChanceCoachTrigger(woods, true)).toBe(false);
      expect(woodsLastChanceStatusNote(woods, true)).toBeNull();
    }

    const lateWoods = resolveStageRules(10, "standard");
    expect(woodsLastChanceCoachTrigger(lateWoods, false)).toBe(true);
    expect(woodsLastChanceCopy(true)).toEqual({
      title: SLEEPING_WOODS_LAST_CHANCE_TITLE,
      question: SLEEPING_WOODS_LAST_CHANCE_WARD,
      statusNote: SLEEPING_WOODS_LAST_CHANCE_STATUS,
      menuDelayMs: WOODS_LAST_CHANCE_HOLD_MS,
    });
    expect(woodsLastChanceCopy(false)).toEqual({
      title: SLEEPING_WOODS_LAST_CHANCE_TITLE,
      question: SLEEPING_WOODS_LAST_CHANCE_NO_WARD,
      statusNote: SLEEPING_WOODS_LAST_CHANCE_STATUS,
      menuDelayMs: WOODS_LAST_CHANCE_HOLD_MS,
    });
  });

  it("teaches the first-run watch-tap beat once, beside the Woods notes", () => {
    expect(WATCH_TAP_WATCH_NOTE).toBe("Watch the pattern.");
    expect(WATCH_TAP_TAP_NOTE).toBe("Tap what you saw.");
    expect(WATCH_TAP_SETTLE_MS).toBe(WOODS_HOLD_MS);
    expect(watchTapBeatDurationMs("watch")).toBe(WATCH_TAP_WATCH_MS);
    expect(watchTapBeatDurationMs("tap")).toBe(WATCH_TAP_TAP_MS + WATCH_TAP_SETTLE_MS);
    expect(WATCH_TAP_WATCH_MS + watchTapBeatDurationMs("tap")).toBeLessThan(4000);
    expect(SLEEPING_WOODS_STATUS_NOTE).toBe("Sleeping Woods — watch, then tap.");
    expect(SLEEPING_WOODS_INPUT_NOTE).toBe("Tap what you saw.");

    const freshWoods = {
      mode: "campaign" as const,
      level: 1,
      hasSeen: false,
      rematch: false,
    };
    expect(shouldShowWatchTapCoach(freshWoods)).toBe(true);
    expect(shouldShowWatchTapCoach({ ...freshWoods, hasSeen: true })).toBe(false);
    expect(shouldShowWatchTapCoach({ ...freshWoods, mode: "lantern" })).toBe(false);
    expect(shouldShowWatchTapCoach({ ...freshWoods, rematch: true })).toBe(false);
    expect(shouldShowWatchTapCoach({ ...freshWoods, level: 2 })).toBe(false);
    expect(shouldShowWatchTapCoach({ ...freshWoods, level: 11 })).toBe(false);
    expect(shouldShowWatchTapCoach({ ...freshWoods, level: Number.NaN })).toBe(false);
  });

  it("keeps Last Chance coaching off later chapters", () => {
    const later = [11, 21, 31, 41, 51, 61, 71, 81, 91] as const;
    for (const level of later) {
      const rules = resolveStageRules(level, "standard");
      expect(woodsLastChanceCoachTrigger(rules, false)).toBe(false);
      expect(woodsLastChanceStatusNote(rules, false)).toBeNull();
    }
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

  it("teaches Crystal Ascent on every difficulty during preview", () => {
    expect(CRYSTAL_ASCENT_STATUS_NOTE).toBe("Crystal Ascent — some light lies.");
    expect(roundPreviewStatusNote(resolveStageRules(31, "calm"), 0, 1)).toBe(
      CRYSTAL_ASCENT_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(31, "standard"), 0, 1)).toBe(
      CRYSTAL_ASCENT_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(31, "harsh"), 0, 1)).toBe(
      CRYSTAL_ASCENT_STATUS_NOTE
    );
  });

  it("teaches Hollow Crown by grant mode during preview", () => {
    expect(CROWN_SHOWN_STATUS_NOTE).toBe("Hollow Crown — one is already claimed.");
    expect(CROWN_HIDDEN_STATUS_NOTE).toBe("Hollow Crown — a claim waits in shadow.");
    expect(roundPreviewStatusNote(resolveStageRules(71, "calm"), 0, 1)).toBe(CROWN_SHOWN_STATUS_NOTE);
    expect(roundPreviewStatusNote(resolveStageRules(71, "standard"), 0, 1)).toBe(
      CROWN_SHOWN_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(71, "harsh"), 0, 1)).toBe(
      CROWN_HIDDEN_STATUS_NOTE
    );
  });

  it("teaches Ember Bridge on every difficulty during preview", () => {
    expect(EMBER_BRIDGE_STATUS_NOTE).toBe("Ember Bridge — hold the heat.");
    expect(EMBER_FADE_STATUS_NOTE).toBe("Embers fade…");
    expect(roundPreviewStatusNote(resolveStageRules(41, "calm"), 0, 1)).toBe(
      EMBER_BRIDGE_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(41, "standard"), 0, 1)).toBe(
      EMBER_BRIDGE_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(41, "harsh"), 0, 1)).toBe(
      EMBER_BRIDGE_STATUS_NOTE
    );
  });

  it("teaches Night Orchard on every difficulty during preview", () => {
    expect(NIGHT_ORCHARD_STATUS_NOTE).toBe("Night Orchard — one fruit moves.");
    expect(roundPreviewStatusNote(resolveStageRules(81, "calm"), 0, 1)).toBe(
      NIGHT_ORCHARD_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(81, "standard"), 0, 1)).toBe(
      NIGHT_ORCHARD_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(81, "harsh"), 0, 1)).toBe(
      NIGHT_ORCHARD_STATUS_NOTE
    );
  });

  it("teaches The Bound spiral on 91–99 and seal copy on Lantern Trial", () => {
    expect(BOUND_CHAPTER_STATUS_NOTE).toBe("The Bound — the spiral tightens.");
    expect(LANTERN_TRIAL_FIRST_SEAL_NOTE).toBe("The Bound — first seal.");
    expect(LANTERN_TRIAL_FINAL_SEAL_NOTE).toBe("The Bound — final seal.");
    expect(LANTERN_TRIAL_HOLD_NOTE).toBe("The lantern holds…");
    expect(LANTERN_TRIAL_HOLD_MS).toBe(300);
    expect(roundPreviewStatusNote(resolveStageRules(91, "calm"), 0, 1)).toBe(
      BOUND_CHAPTER_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(91, "standard"), 0, 1)).toBe(
      BOUND_CHAPTER_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(99, "harsh"), 0, 1)).toBe(
      BOUND_CHAPTER_STATUS_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(100, "standard"), 0, 2)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(100, "standard"), 1, 2)).toBe(
      LANTERN_TRIAL_FINAL_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(100, "calm"), 0, 2)).not.toBe(
      BOUND_CHAPTER_STATUS_NOTE
    );
  });

  it("keeps lantern trial seals and two-flight notes ahead of Bound, Gate, Starfall, Moonwell, Crown, Ember, Orchard, and Crystal copy", () => {
    expect(roundPreviewStatusNote(resolveStageRules(100, "standard"), 0, 2)).toBe(
      lanternTrialSealNote(0)
    );
    expect(roundPreviewStatusNote(resolveStageRules(51, "standard"), 0, 2)).toBe(
      TOWER_FIRST_FLIGHT_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(51, "standard"), 1, 2)).toBe(
      TOWER_SECOND_FLIGHT_NOTE
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(61, "harsh"), lanternTrial: true }, 0, 1)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(61, "harsh"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote(resolveStageRules(11, "standard"), 0, 1)).toBe(GATE_PULSE_STATUS_NOTE);
    expect(roundPreviewStatusNote(resolveStageRules(41, "standard"), 0, 1)).toBe(
      EMBER_BRIDGE_STATUS_NOTE
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(41, "standard"), lanternTrial: true }, 0, 1)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(41, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote(resolveStageRules(71, "standard"), 0, 1)).toBe(
      CROWN_SHOWN_STATUS_NOTE
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(71, "harsh"), lanternTrial: true }, 1, 1)).toBe(
      LANTERN_TRIAL_FINAL_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(71, "harsh"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(21, "standard"), lanternTrial: true }, 0, 1)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(21, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote(resolveStageRules(81, "standard"), 0, 1)).toBe(
      NIGHT_ORCHARD_STATUS_NOTE
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(81, "standard"), lanternTrial: true }, 0, 1)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(81, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(91, "standard"), twoFlight: true }, 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
    expect(roundPreviewStatusNote(resolveStageRules(31, "standard"), 0, 1)).toBe(
      CRYSTAL_ASCENT_STATUS_NOTE
    );
    expect(roundPreviewStatusNote({ ...resolveStageRules(31, "standard"), lanternTrial: true }, 0, 1)).toBe(
      LANTERN_TRIAL_FIRST_SEAL_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(31, "standard"), 0, 2)).toBe(
      flightStatusNote(0, 2)
    );
  });

  it("uses Bound seals for Lantern Trial input and Tower-unique flight copy", () => {
    const lantern = resolveStageRules(100, "standard");
    const tower = resolveStageRules(51, "standard");
    expect(inputStatusFlightNote(lantern, 0, 2)).toBe(LANTERN_TRIAL_FIRST_SEAL_NOTE);
    expect(inputStatusFlightNote(lantern, 1, 2)).toBe(LANTERN_TRIAL_FINAL_SEAL_NOTE);
    expect(inputStatusFlightNote(tower, 0, 2)).toBe(TOWER_FIRST_FLIGHT_NOTE);
    expect(inputStatusFlightNote(tower, 1, 2)).toBe(TOWER_SECOND_FLIGHT_NOTE);
    expect(flightStatusNote(0, 2)).toBe("Flight 1 of 2.");
    expect(flightStatusNote(1, 2)).toBe("Flight 2 of 2.");
  });

  it("teaches The Tower flights on 51–60 and holds Ascend between them", () => {
    expect(TOWER_FIRST_FLIGHT_NOTE).toBe("The Tower — first flight.");
    expect(TOWER_SECOND_FLIGHT_NOTE).toBe("The Tower — second flight.");
    expect(TOWER_ASCEND_NOTE).toBe("Ascend.");
    expect(TOWER_ASCEND_MS).toBe(300);
    expect(towerFlightNote(0)).toBe(TOWER_FIRST_FLIGHT_NOTE);
    expect(towerFlightNote(1)).toBe(TOWER_SECOND_FLIGHT_NOTE);
    expect(isTowerTwoFlight(resolveStageRules(51, "calm"))).toBe(true);
    expect(isTowerTwoFlight(resolveStageRules(60, "harsh"))).toBe(true);
    expect(isTowerTwoFlight(resolveStageRules(100, "standard"))).toBe(false);
    expect(isTowerTwoFlight(resolveStageRules(91, "standard"))).toBe(false);
    expect(isTowerTwoFlight({ ...resolveStageRules(91, "standard"), twoFlight: true })).toBe(
      false
    );
    expect(roundPreviewStatusNote(resolveStageRules(51, "calm"), 0, 2)).toBe(
      TOWER_FIRST_FLIGHT_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(55, "standard"), 1, 2)).toBe(
      TOWER_SECOND_FLIGHT_NOTE
    );
    expect(roundPreviewStatusNote(resolveStageRules(60, "harsh"), 0, 2)).toBe(
      TOWER_FIRST_FLIGHT_NOTE
    );
    expect(inputStatusFlightNote(resolveStageRules(51, "calm"), 0, 2)).toBe(
      TOWER_FIRST_FLIGHT_NOTE
    );
    expect(inputStatusFlightNote(resolveStageRules(60, "harsh"), 1, 2)).toBe(
      TOWER_SECOND_FLIGHT_NOTE
    );
    expect(betweenFlightHoldMs(resolveStageRules(51, "standard"))).toBe(TOWER_ASCEND_MS);
    expect(betweenFlightHoldNote(resolveStageRules(51, "standard"))).toBe(TOWER_ASCEND_NOTE);
    expect(betweenFlightHoldNote(resolveStageRules(100, "standard"))).toBe(LANTERN_TRIAL_HOLD_NOTE);
    expect(betweenFlightHoldNote(resolveStageRules(91, "standard"))).toBeNull();
    expect(betweenFlightHoldNote(resolveStageRules(1, "standard"))).toBeNull();
  });

  it("holds between Lantern Trial flights and Tower flights only", () => {
    expect(betweenFlightHoldMs(resolveStageRules(100, "standard"))).toBe(LANTERN_TRIAL_HOLD_MS);
    expect(betweenFlightHoldMs(resolveStageRules(51, "standard"))).toBe(TOWER_ASCEND_MS);
    expect(betweenFlightHoldMs(resolveStageRules(91, "standard"))).toBe(0);
    expect(betweenFlightHoldMs(resolveStageRules(1, "standard"))).toBe(0);
    expect(betweenFlightHoldMs(resolveStageRules(11, "standard"))).toBe(0);
    expect(betweenFlightHoldMs({ ...resolveStageRules(91, "standard"), twoFlight: true })).toBe(0);
  });
});

describe("bound preview curve", () => {
  it("shortens The Bound slightly within the stage before hitting the floor", () => {
    expect(getLevelConfig(91).previewDurationMs).toBe(870);
    expect(getLevelConfig(100).previewDurationMs).toBe(800);
  });
});
