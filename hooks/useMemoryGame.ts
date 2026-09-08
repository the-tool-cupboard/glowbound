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
  generateUniqueTargetCellIds,
  hasCompletedPattern,
  isCorrectSelection,
  patternKey,
} from "@/lib/gameEngine";
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
  const [wrongCellId, setWrongCellId] = useState<CellId | null>(null);
  const [wardArmed, setWardArmed] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [stage, setStage] = useState(1);

  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wardTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const previewMsRef = useRef(0);
  const previewPausedRef = useRef(false);
  const stageAdvancePausedRef = useRef(false);
  const recentPatternKeysRef = useRef<string[]>([]);

  const clearTimers = useCallback(() => {
    clearTimer(previewTimerRef);
    clearTimer(advanceTimerRef);
    clearTimer(sightTimerRef);
    clearTimer(wardTimerRef);
  }, []);

  const finishPreview = useCallback(() => {
    previewPausedRef.current = false;
    phaseRef.current = "playerInput";
    setPhase("playerInput");
    setStatusNote(null);
    previewTimerRef.current = null;
    sightTimerRef.current = null;
  }, []);

  const schedulePreview = useCallback(
    (kind: PreviewKind, ms: number) => {
      previewKindRef.current = kind;
      previewMsRef.current = Math.max(0, ms);
      previewPausedRef.current = false;
      clearTimer(previewTimerRef);
      clearTimer(sightTimerRef);

      const timerRef = kind === "sight" ? sightTimerRef : previewTimerRef;
      timerRef.current = setTimeout(() => {
        finishPreview();
      }, previewMsRef.current);
    },
    [finishPreview]
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
      schedulePreview(previewKindRef.current, previewMsRef.current);
      return;
    }

    if (stageAdvancePausedRef.current && phaseRef.current === "stageComplete") {
      stageAdvancePausedRef.current = false;
      beginRoundRef.current(levelRef.current, scoreRef.current, stageRef.current + 1);
    }
  }, [schedulePreview]);

  const beginRound = useCallback(
    (nextLevel: number, nextScore: number, nextStage: number) => {
      clearTimers();
      previewPausedRef.current = false;
      stageAdvancePausedRef.current = false;

      const base = getLevelConfig(nextLevel);
      const config = applyDifficultyToConfig(base, difficultyRef.current);
      const previewMs = config.previewDurationMs + lanternOilMsRef.current;
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

      levelRef.current = nextLevel;
      scoreRef.current = nextScore;
      stageRef.current = safeStage;
      targetRef.current = nextTargets;
      selectedRef.current = [];
      hintRef.current = [];
      phaseRef.current = "preview";

      setLevel(nextLevel);
      setScore(nextScore);
      setStage(safeStage);
      setLayout(nextLayout);
      setTargetCellIds(nextTargets);
      setSelectedCellIds([]);
      setHintCellIds([]);
      setWrongCellId(null);
      setStatusNote(null);
      setPhase("preview");

      schedulePreview("round", previewMs);
    },
    [clearTimers, schedulePreview]
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

  const applySecondSight = useCallback(() => {
    if (phaseRef.current !== "playerInput") {
      return false;
    }

    phaseRef.current = "preview";
    setPhase("preview");
    setStatusNote("Showing the pattern again.");
    schedulePreview("sight", SECOND_SIGHT_MS);
    return true;
  }, [schedulePreview]);

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
    if (phaseRef.current !== "playerInput") {
      return false;
    }

    const remaining = targetRef.current.filter(
      (id) => !selectedRef.current.includes(id) && !hintRef.current.includes(id)
    );
    const nextHint = remaining[0];
    if (nextHint === undefined) {
      return false;
    }

    hintRef.current = [...hintRef.current, nextHint];
    setHintCellIds(hintRef.current);
    setStatusNote("One remaining rune is lit.");
    return true;
  }, []);

  const onRunePress = useCallback(
    (cellId: CellId) => {
      if (phaseRef.current !== "playerInput") {
        return;
      }

      if (selectedRef.current.includes(cellId)) {
        return;
      }

      if (isCorrectSelection(cellId, targetRef.current)) {
        const nextSelected = [...selectedRef.current, cellId];
        selectedRef.current = nextSelected;
        setSelectedCellIds(nextSelected);
        hintRef.current = hintRef.current.filter((id) => id !== cellId);
        setHintCellIds(hintRef.current);

        if (hasCompletedPattern(nextSelected, targetRef.current)) {
          const nextScore = scoreRef.current + calculateScoreForLevel(levelRef.current);
          scoreRef.current = nextScore;
          setScore(nextScore);
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
          setStatusNote(null);
          wardTimerRef.current = null;
        }, WARD_FLASH_MS);
        return;
      }

      phaseRef.current = "lastChance";
      setWrongCellId(cellId);
      setPhase("lastChance");
      setStatusNote("Wrong rune.");
    },
    [beginRound]
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
    wrongCellId,
    remainingCount: Math.max(0, targetCellIds.length - selectedCellIds.length),
    stage,
    stagesRequired: getStagesForLevel(level),
    wardArmed,
    statusNote,
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
