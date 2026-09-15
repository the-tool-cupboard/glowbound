import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { LANTERN_OIL_BONUS_MS, SECOND_SIGHT_MS, WARD_FLASH_MS } from "@/lib/economyConfig";
import { applyDifficultyToConfig } from "@/lib/economyEngine";
import {
  LEVEL_COMPLETE_DELAY_MS,
  getLayoutForLevel,
  getLevelConfig,
  getStagesForLevel,
} from "@/lib/gameConfig";
import {
  calculateScoreForLevel,
  evaluateRuneTap,
  generateUniqueTargetCellIds,
  hasCompletedPattern,
  patternKey,
} from "@/lib/gameEngine";
import {
  CROWN_CLAIMED_INPUT_NOTE,
  CROWN_INPUT_HOLD_MS,
  EMBER_FADE_SWAP_MS,
  applyCalmPreviewBonus,
  applyTargetSwap,
  buildRoundPresentation,
  emberFadeAtMs,
  flightStatusNote,
  pickEmberFadeSwap,
  pickGrantedCell,
  resolveStageRules,
  roundPreviewStatusNote,
  splitTwoFlight,
  type PreviewStep,
  type StageRules,
} from "@/lib/stageModifiers";
import type { DifficultyId, PowerUpId } from "@/types/economy";
import type { CellId, GamePhase, RuneLayout } from "@/types/game";

type PreviewKind = "round" | "sight";

function clearTimer(timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>) {
  if (timerRef.current != null) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
}

export function useMemoryGame() {
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [layout, setLayout] = useState<RuneLayout>(() => getLayoutForLevel(1));
  const [targetCellIds, setTargetCellIds] = useState<readonly CellId[]>([]);
  const [selectedCellIds, setSelectedCellIds] = useState<readonly CellId[]>([]);
  const [hintCellIds, setHintCellIds] = useState<readonly CellId[]>([]);
  const [previewCellIds, setPreviewCellIds] = useState<readonly CellId[]>([]);
  const [glintCellIds, setGlintCellIds] = useState<readonly CellId[]>([]);
  const [ghostCellIds, setGhostCellIds] = useState<readonly CellId[]>([]);
  const [wrongCellId, setWrongCellId] = useState<CellId | null>(null);
  const [wardArmed, setWardArmed] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [stage, setStage] = useState(1);
  const [cooledBoard, setCooledBoard] = useState(false);
  const [lanternTrial, setLanternTrial] = useState(false);

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emberTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const crownHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runStartLevelRef = useRef(1);
  const difficultyRef = useRef<DifficultyId>("standard");
  const lanternOilMsRef = useRef(0);
  const phaseRef = useRef<GamePhase>("idle");
  const levelRef = useRef(1);
  const scoreRef = useRef(0);
  const stageRef = useRef(1);
  const targetRef = useRef<readonly CellId[]>([]);
  const selectedRef = useRef<readonly CellId[]>([]);
  const hintRef = useRef<readonly CellId[]>([]);
  const wardArmedRef = useRef(false);
  const previewKindRef = useRef<PreviewKind>("round");
  const previewPausedRef = useRef(false);
  const stageAdvancePausedRef = useRef(false);
  const recentPatternKeysRef = useRef<string[]>([]);
  const rulesRef = useRef<StageRules>(resolveStageRules(1, "standard"));
  const layoutRef = useRef<RuneLayout>(getLayoutForLevel(1));
  const previewPlanRef = useRef<readonly PreviewStep[]>([]);
  const pendingInputTargetsRef = useRef<readonly CellId[] | null>(null);
  const grantedIdRef = useRef<CellId | null>(null);
  const crownInputLockedRef = useRef(false);
  const flightsRef = useRef<{ a: CellId[]; b: CellId[] } | null>(null);
  const flightIndexRef = useRef(0);
  const charmUsedRef = useRef(false);
  const emberFadedRef = useRef(false);
  const swapLockedRef = useRef(false);
  const orderedInputRef = useRef(false);

  const clearPreviewFx = useCallback(() => {
    setPreviewCellIds([]);
    setGlintCellIds([]);
    setGhostCellIds([]);
  }, []);

  const clearTimers = useCallback(() => {
    clearTimer(previewTimerRef);
    clearTimer(advanceTimerRef);
    clearTimer(sightTimerRef);
    clearTimer(wardTimerRef);
    clearTimer(emberTimerRef);
    clearTimer(swapTimerRef);
    clearTimer(crownHoldTimerRef);
    crownInputLockedRef.current = false;
  }, []);

  const inputStatusNote = useCallback((): string | null => {
    if (grantedIdRef.current != null) {
      return CROWN_CLAIMED_INPUT_NOTE;
    }
    const flights = flightsRef.current;
    if (flights != null) {
      return flightStatusNote(flightIndexRef.current, 2);
    }
    if (rulesRef.current.lanternTrial) {
      return "Lantern Trial.";
    }
    return null;
  }, []);

  const enterInputPhase = useCallback(() => {
    previewPausedRef.current = false;
    const committed = pendingInputTargetsRef.current ?? targetRef.current;
    pendingInputTargetsRef.current = null;
    targetRef.current = committed;
    setTargetCellIds(committed);

    const grantedId = grantedIdRef.current;
    if (grantedId != null && !selectedRef.current.includes(grantedId) && committed.includes(grantedId)) {
      selectedRef.current = [...selectedRef.current, grantedId];
      setSelectedCellIds(selectedRef.current);
    }

    clearPreviewFx();
    phaseRef.current = "playerInput";
    setPhase("playerInput");
    setStatusNote(inputStatusNote());
    previewTimerRef.current = null;
    sightTimerRef.current = null;

    clearTimer(crownHoldTimerRef);
    crownInputLockedRef.current = false;
    if (grantedId != null) {
      crownInputLockedRef.current = true;
      crownHoldTimerRef.current = setTimeout(() => {
        crownHoldTimerRef.current = null;
        if (phaseRef.current === "playerInput") {
          crownInputLockedRef.current = false;
        }
      }, CROWN_INPUT_HOLD_MS);
    }

    clearTimer(emberTimerRef);
    if (rulesRef.current.emberFade && !charmUsedRef.current && !emberFadedRef.current) {
      emberTimerRef.current = setTimeout(() => {
        emberTimerRef.current = null;
        if (phaseRef.current !== "playerInput" || charmUsedRef.current || emberFadedRef.current) {
          return;
        }

        const remaining = targetRef.current.filter((id) => !selectedRef.current.includes(id));
        const swap = pickEmberFadeSwap(remaining, layoutRef.current.points, Math.random);
        emberFadedRef.current = true;
        setStatusNote("Embers fade…");
        setCooledBoard(true);

        if (swap == null) {
          return;
        }

        swapLockedRef.current = true;
        setGhostCellIds([swap.from, swap.to]);
        clearTimer(swapTimerRef);
        swapTimerRef.current = setTimeout(() => {
          const nextTargets = applyTargetSwap(targetRef.current, swap);
          targetRef.current = nextTargets;
          setTargetCellIds(nextTargets);
          setGhostCellIds([]);
          swapLockedRef.current = false;
          swapTimerRef.current = null;
        }, EMBER_FADE_SWAP_MS);
      }, emberFadeAtMs());
    }
  }, [clearPreviewFx, inputStatusNote]);

  const runPreviewStep = useCallback(
    (index: number) => {
      const steps = previewPlanRef.current;
      const step = steps[index];
      if (step == null) {
        enterInputPhase();
        return;
      }

      setPreviewCellIds(step.previewCellIds);
      setGlintCellIds(step.glintCellIds);
      setGhostCellIds(step.ghostCellIds);
      clearTimer(previewTimerRef);
      clearTimer(sightTimerRef);
      const timerRef = previewKindRef.current === "sight" ? sightTimerRef : previewTimerRef;
      timerRef.current = setTimeout(() => {
        runPreviewStepRef.current(index + 1);
      }, step.durationMs);
    },
    [enterInputPhase]
  );

  const runPreviewStepRef = useRef(runPreviewStep);
  runPreviewStepRef.current = runPreviewStep;

  const schedulePreviewPlan = useCallback(
    (kind: PreviewKind, steps: readonly PreviewStep[]) => {
      previewKindRef.current = kind;
      previewPlanRef.current = steps;
      previewPausedRef.current = false;
      clearTimer(previewTimerRef);
      clearTimer(sightTimerRef);
      runPreviewStepRef.current(0);
    },
    []
  );

  const pauseForInterrupt = useCallback(() => {
    if (phaseRef.current === "preview") {
      clearTimer(previewTimerRef);
      clearTimer(sightTimerRef);
      previewPausedRef.current = true;
      return;
    }

    if (phaseRef.current === "stageComplete") {
      clearTimer(advanceTimerRef);
      stageAdvancePausedRef.current = true;
    }
  }, []);

  const resumeAfterInterrupt = useCallback(() => {
    if (previewPausedRef.current && phaseRef.current === "preview") {
      previewPausedRef.current = false;
      if (previewKindRef.current === "sight") {
        setStatusNote("Showing the pattern again.");
      }
      runPreviewStepRef.current(0);
      return;
    }

    if (stageAdvancePausedRef.current && phaseRef.current === "stageComplete") {
      stageAdvancePausedRef.current = false;
      beginRoundRef.current(levelRef.current, scoreRef.current, stageRef.current + 1);
    }
  }, []);

  const startFlightPreview = useCallback(
    (args: {
      nextLevel: number;
      nextScore: number;
      nextStage: number;
      nextLayout: RuneLayout;
      flightTargets: readonly CellId[];
      kind: PreviewKind;
      previewMs: number;
    }) => {
      const { nextLevel, nextScore, nextStage, nextLayout, flightTargets, kind, previewMs } = args;
      clearTimer(emberTimerRef);
      clearTimer(swapTimerRef);
      const rules = rulesRef.current;
      const presentation = buildRoundPresentation({
        rules,
        targets: flightTargets,
        layout: nextLayout,
        previewMs,
        kind,
        rng: Math.random,
      });

      pendingInputTargetsRef.current = presentation.inputTargets;
      targetRef.current = flightTargets;
      selectedRef.current = [];
      hintRef.current = [];
      emberFadedRef.current = false;
      swapLockedRef.current = false;
      orderedInputRef.current = rules.orderedInput;
      layoutRef.current = nextLayout;

      if (rules.crownGrant === "shown") {
        const granted = pickGrantedCell(presentation.inputTargets, nextLayout.points);
        grantedIdRef.current = granted;
        if (granted != null) {
          selectedRef.current = [granted];
        }
      } else if (rules.crownGrant === "hiddenUntilInput") {
        grantedIdRef.current = pickGrantedCell(presentation.inputTargets, nextLayout.points);
      } else {
        grantedIdRef.current = null;
      }

      const shownDuringPreview =
        rules.crownGrant === "hiddenUntilInput" && grantedIdRef.current != null
          ? presentation.steps.map((step) => ({
              ...step,
              previewCellIds: step.previewCellIds.filter((id) => id !== grantedIdRef.current),
            }))
          : presentation.steps;

      levelRef.current = nextLevel;
      scoreRef.current = nextScore;
      stageRef.current = nextStage;
      phaseRef.current = "preview";

      setLevel(nextLevel);
      setScore(nextScore);
      setStage(nextStage);
      setLayout(nextLayout);
      setTargetCellIds(flightTargets);
      setSelectedCellIds(selectedRef.current);
      setHintCellIds([]);
      setWrongCellId(null);
      setCooledBoard(false);
      setLanternTrial(rules.lanternTrial);
      setStatusNote(
        roundPreviewStatusNote(
          rules,
          flightIndexRef.current,
          flightsRef.current != null ? 2 : 1
        )
      );
      setPhase("preview");

      schedulePreviewPlan(kind, shownDuringPreview);
    },
    [schedulePreviewPlan]
  );

  const beginRound = useCallback(
    (nextLevel: number, nextScore: number, nextStage: number) => {
      clearTimers();
      previewPausedRef.current = false;
      stageAdvancePausedRef.current = false;
      charmUsedRef.current = false;
      emberFadedRef.current = false;
      swapLockedRef.current = false;

      const base = getLevelConfig(nextLevel);
      const config = applyDifficultyToConfig(base, difficultyRef.current);
      const rules = resolveStageRules(nextLevel, difficultyRef.current);
      rulesRef.current = rules;
      const previewMs =
        applyCalmPreviewBonus(config.previewDurationMs, rules) + lanternOilMsRef.current;
      lanternOilMsRef.current = 0;
      const capacity = config.runeCount;
      const nextTargets = generateUniqueTargetCellIds(
        capacity,
        config.targetCount,
        Math.random,
        recentPatternKeysRef.current
      );
      const nextKey = patternKey(nextTargets);
      if (nextKey.length > 0) {
        recentPatternKeysRef.current = [nextKey, ...recentPatternKeysRef.current].slice(0, 8);
      }
      const nextLayout = getLayoutForLevel(nextLevel);
      const safeStage = Math.max(1, Math.floor(nextStage));
      const flights = rules.twoFlight ? splitTwoFlight(nextTargets) : null;
      flightsRef.current = flights;
      flightIndexRef.current = 0;
      const flightTargets = flights?.a ?? nextTargets;

      startFlightPreview({
        nextLevel,
        nextScore,
        nextStage: safeStage,
        nextLayout,
        flightTargets,
        kind: "round",
        previewMs,
      });
    },
    [clearTimers, startFlightPreview]
  );

  const beginRoundRef = useRef(beginRound);
  beginRoundRef.current = beginRound;

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next !== "active") {
        pauseForInterrupt();
        return;
      }

      resumeAfterInterrupt();
    };

    const subscription = AppState.addEventListener("change", onChange);
    return () => {
      subscription.remove();
    };
  }, [pauseForInterrupt, resumeAfterInterrupt]);

  const startGame = useCallback(
    (
      startLevel = 1,
      difficulty: DifficultyId = "standard",
      resume?: { playLevel?: number; score?: number }
    ) => {
      const chapter = Math.max(1, Math.floor(startLevel));
      const playLevel = Math.max(1, Math.floor(resume?.playLevel ?? chapter));
      const resumeScore = Math.max(0, Math.floor(resume?.score ?? 0));
      runStartLevelRef.current = chapter;
      difficultyRef.current = difficulty;
      recentPatternKeysRef.current = [];
      lanternOilMsRef.current = 0;
      wardArmedRef.current = false;
      setWardArmed(false);
      beginRound(playLevel, resumeScore, 1);
    },
    [beginRound]
  );

  const restartGame = useCallback(() => {
    recentPatternKeysRef.current = [];
    lanternOilMsRef.current = 0;
    wardArmedRef.current = false;
    setWardArmed(false);
    beginRound(runStartLevelRef.current, 0, 1);
  }, [beginRound]);

  const clearEmberFade = useCallback(() => {
    clearTimer(emberTimerRef);
    clearTimer(swapTimerRef);
    swapLockedRef.current = false;
    setGhostCellIds([]);
    setCooledBoard(false);
    if (emberFadedRef.current || rulesRef.current.emberFade) {
      emberFadedRef.current = true;
    }
  }, []);

  const applySecondSight = useCallback(() => {
    if (phaseRef.current !== "playerInput" || swapLockedRef.current) {
      return false;
    }

    charmUsedRef.current = true;
    clearEmberFade();
    const remaining = targetRef.current.filter((id) => !selectedRef.current.includes(id));
    phaseRef.current = "preview";
    setPhase("preview");
    setStatusNote("Showing the pattern again.");
    const presentation = buildRoundPresentation({
      rules: rulesRef.current,
      targets: remaining,
      layout: layoutRef.current,
      previewMs: SECOND_SIGHT_MS,
      kind: "sight",
      rng: Math.random,
    });
    pendingInputTargetsRef.current = targetRef.current;
    schedulePreviewPlan("sight", presentation.steps);
    return true;
  }, [clearEmberFade, schedulePreviewPlan]);

  const applyLanternOil = useCallback(() => {
    if (lanternOilMsRef.current > 0) {
      return false;
    }

    lanternOilMsRef.current = LANTERN_OIL_BONUS_MS;
    setStatusNote("The next reveal will last longer.");
    return true;
  }, []);

  const applyWard = useCallback(() => {
    if (phaseRef.current !== "playerInput" || wardArmedRef.current) {
      return false;
    }

    wardArmedRef.current = true;
    setWardArmed(true);
    setStatusNote("The next wrong tap will be ignored.");
    return true;
  }, []);

  const applyPathHint = useCallback(() => {
    if (phaseRef.current !== "playerInput" || swapLockedRef.current) {
      return false;
    }

    const remaining = targetRef.current.filter(
      (id) => !selectedRef.current.includes(id) && !hintRef.current.includes(id)
    );
    const nextHint = remaining[0];
    if (nextHint === undefined) {
      return false;
    }

    charmUsedRef.current = true;
    clearEmberFade();
    hintRef.current = [...hintRef.current, nextHint];
    setHintCellIds(hintRef.current);
    setStatusNote("One remaining rune is lit.");
    return true;
  }, [clearEmberFade]);

  const completePatternSlot = useCallback(
    (nextScore: number) => {
      setStatusNote(null);
      const stagesRequired = getStagesForLevel(levelRef.current);

      if (stageRef.current < stagesRequired) {
        phaseRef.current = "stageComplete";
        setPhase("stageComplete");
        stageAdvancePausedRef.current = false;
        advanceTimerRef.current = setTimeout(() => {
          beginRound(levelRef.current, nextScore, stageRef.current + 1);
        }, LEVEL_COMPLETE_DELAY_MS);
        return;
      }

      phaseRef.current = "levelComplete";
      setPhase("levelComplete");
    },
    [beginRound]
  );

  const onRunePress = useCallback(
    (cellId: CellId) => {
      if (phaseRef.current !== "playerInput" || swapLockedRef.current || crownInputLockedRef.current) {
        return;
      }

      if (selectedRef.current.includes(cellId)) {
        return;
      }

      const verdict = evaluateRuneTap(
        cellId,
        targetRef.current,
        selectedRef.current,
        orderedInputRef.current
      );

      if (verdict === "correct") {
        const nextSelected = [...selectedRef.current, cellId];
        selectedRef.current = nextSelected;
        setSelectedCellIds(nextSelected);
        hintRef.current = hintRef.current.filter((id) => id !== cellId);
        setHintCellIds(hintRef.current);

        if (hasCompletedPattern(nextSelected, targetRef.current)) {
          const flights = flightsRef.current;
          if (flights != null && flightIndexRef.current === 0) {
            flightIndexRef.current = 1;
            const rules = rulesRef.current;
            const previewMs = applyCalmPreviewBonus(
              applyDifficultyToConfig(getLevelConfig(levelRef.current), difficultyRef.current)
                .previewDurationMs,
              rules
            ) + lanternOilMsRef.current;
            lanternOilMsRef.current = 0;
            startFlightPreview({
              nextLevel: levelRef.current,
              nextScore: scoreRef.current,
              nextStage: stageRef.current,
              nextLayout: layoutRef.current,
              flightTargets: flights.b,
              kind: "round",
              previewMs,
            });
            return;
          }

          const nextScore = scoreRef.current + calculateScoreForLevel(levelRef.current);
          scoreRef.current = nextScore;
          setScore(nextScore);
          completePatternSlot(nextScore);
        }

        return;
      }

      if (wardArmedRef.current) {
        wardArmedRef.current = false;
        setWardArmed(false);
        setWrongCellId(cellId);
        setStatusNote("Ward used. Keep going.");
        clearTimer(wardTimerRef);
        wardTimerRef.current = setTimeout(() => {
          setWrongCellId(null);
          setStatusNote(inputStatusNote());
          wardTimerRef.current = null;
        }, WARD_FLASH_MS);
        return;
      }

      phaseRef.current = "lastChance";
      setWrongCellId(cellId);
      setPhase("lastChance");
      setStatusNote("Wrong rune.");
    },
    [completePatternSlot, inputStatusNote, startFlightPreview]
  );

  const applyMercyItem = useCallback((itemId: PowerUpId) => {
    if (phaseRef.current !== "lastChance" || itemId !== "ward") {
      return false;
    }

    setWrongCellId(null);
    wardArmedRef.current = false;
    setWardArmed(false);
    phaseRef.current = "playerInput";
    setPhase("playerInput");
    setStatusNote("Ward used. Keep going.");
    return true;
  }, []);

  const endRun = useCallback(() => {
    if (phaseRef.current !== "lastChance") {
      return false;
    }

    clearTimers();
    phaseRef.current = "gameOver";
    setPhase("gameOver");
    setStatusNote("Run over.");
    return true;
  }, [clearTimers]);

  return {
    phase,
    level,
    score,
    layout,
    targetCellIds,
    selectedCellIds,
    hintCellIds,
    previewCellIds,
    glintCellIds,
    ghostCellIds,
    wrongCellId,
    remainingCount: Math.max(0, targetCellIds.length - selectedCellIds.length),
    stage,
    stagesRequired: getStagesForLevel(level),
    wardArmed,
    statusNote,
    cooledBoard,
    lanternTrial,
    startGame,
    restartGame,
    applySecondSight,
    applyLanternOil,
    applyWard,
    applyPathHint,
    applyMercyItem,
    endRun,
    pauseForInterrupt,
    resumeAfterInterrupt,
    onRunePress,
  };
}
