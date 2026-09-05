import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";

import { LANTERN_OIL_BONUS_MS, SECOND_SIGHT_MS, WARD_FLASH_MS } from "@/lib/economyConfig";
import { applyDifficultyToConfig } from "@/lib/economyEngine";
import {
  LEVEL_COMPLETE_DELAY_MS,
  getLevelConfig,
  getStagesForLevel,
} from "@/lib/gameConfig";
import {
  calculateScoreForLevel,
  generateUniqueTargetCellIds,
  hasCompletedPattern,
  isCorrectSelection,
} from "@/lib/gameEngine";
import type { DifficultyId, PowerUpId } from "@/types/economy";
import type { CellId, GamePhase } from "@/types/game";

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
  const [gridSize, setGridSize] = useState(3);
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

  const clearTimers = useCallback(() => {
    clearTimer(previewTimerRef);
    clearTimer(advanceTimerRef);
    clearTimer(sightTimerRef);
    clearTimer(wardTimerRef);
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const beginRound = useCallback(
    (nextLevel: number, nextScore: number, nextStage: number) => {
      clearTimers();

      const base = getLevelConfig(nextLevel);
      const config = applyDifficultyToConfig(base, difficultyRef.current);
      const previewMs = config.previewDurationMs + lanternOilMsRef.current;
      lanternOilMsRef.current = 0;
      const capacity = config.gridSize * config.gridSize;
      const nextTargets = generateUniqueTargetCellIds(capacity, config.targetCount);
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
      setGridSize(config.gridSize);
      setTargetCellIds(nextTargets);
      setSelectedCellIds([]);
      setHintCellIds([]);
      setWrongCellId(null);
      setStatusNote(null);
      setPhase("preview");

      previewTimerRef.current = setTimeout(() => {
        phaseRef.current = "playerInput";
        setPhase("playerInput");
        previewTimerRef.current = null;
      }, previewMs);
    },
    [clearTimers]
  );

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
      lanternOilMsRef.current = 0;
      wardArmedRef.current = false;
      setWardArmed(false);
      beginRound(playLevel, resumeScore, 1);
    },
    [beginRound]
  );

  const restartGame = useCallback(() => {
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
    clearTimer(sightTimerRef);
    setPhase("preview");
    setStatusNote("Showing the pattern again.");
    sightTimerRef.current = setTimeout(() => {
      phaseRef.current = "playerInput";
      setPhase("playerInput");
      setStatusNote(null);
      sightTimerRef.current = null;
    }, SECOND_SIGHT_MS);
    return true;
  }, []);

  const applyLanternOil = useCallback(() => {
    lanternOilMsRef.current += LANTERN_OIL_BONUS_MS;
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
    if (phaseRef.current !== "lastChance") {
      return false;
    }

    setWrongCellId(null);

    if (itemId === "ward") {
      wardArmedRef.current = false;
      setWardArmed(false);
      phaseRef.current = "playerInput";
      setPhase("playerInput");
      setStatusNote("Ward used. Keep going.");
      return true;
    }

    if (itemId === "lanternOil") {
      lanternOilMsRef.current += LANTERN_OIL_BONUS_MS;
      phaseRef.current = "playerInput";
      setPhase("playerInput");
      setStatusNote("The next reveal will last longer.");
      return true;
    }

    if (itemId === "pathHint") {
      const remaining = targetRef.current.filter(
        (id) => !selectedRef.current.includes(id) && !hintRef.current.includes(id)
      );
      const nextHint = remaining[0];
      if (nextHint !== undefined) {
        hintRef.current = [...hintRef.current, nextHint];
        setHintCellIds(hintRef.current);
      }
      phaseRef.current = "playerInput";
      setPhase("playerInput");
      setStatusNote("One remaining rune is lit.");
      return true;
    }

    phaseRef.current = "preview";
    clearTimer(sightTimerRef);
    setPhase("preview");
    setStatusNote("Showing the pattern again.");
    sightTimerRef.current = setTimeout(() => {
      phaseRef.current = "playerInput";
      setPhase("playerInput");
      setStatusNote(null);
      sightTimerRef.current = null;
    }, SECOND_SIGHT_MS);
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
    gridSize,
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
    onRunePress,
  };
}
