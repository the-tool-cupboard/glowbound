import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ImageProps } from "expo-image";

import { GameHeader } from "@/components/GameHeader";
import { LastChanceMenu } from "@/components/LastChanceMenu";
import { PowerUpBar } from "@/components/PowerUpBar";
import { RuneGrid } from "@/components/RuneGrid";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { useHighScore } from "@/hooks/useHighScore";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import { useProgress } from "@/hooks/useProgress";
import { calculateLanternShards, isDifficultyId } from "@/lib/economyEngine";
import { GAME_OVER_REVEAL_MS, LEVEL_COMPLETE_DELAY_MS, getCheckpointForLevel } from "@/lib/gameConfig";
import { theme } from "@/lib/theme";
import type { PowerUpId } from "@/types/economy";
import type { CellId } from "@/types/game";

const SLEEPING_WOODS_BACKGROUND: ImageProps["source"] = require("../assets/images/game images/GB_SleepingWoods-2.png");

function chapterBackground(level: number): ImageProps["source"] | undefined {
  if (getCheckpointForLevel(level).startLevel !== 1) {
    return undefined;
  }

  return SLEEPING_WOODS_BACKGROUND;
}

function asCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function asScore(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function statusCopy(phase: ReturnType<typeof useMemoryGame>["phase"]): string {
  switch (phase) {
    case "preview":
      return "Watch the runes.";
    case "playerInput":
      return "Tap the runes you saw.";
    case "stageComplete":
      return "Pattern cleared.";
    case "levelComplete":
      return "Level complete.";
    case "lastChance":
      return "Wrong rune.";
    case "gameOver":
      return "Run over.";
    default:
      return "Get ready.";
  }
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    startLevel?: string;
    playLevel?: string;
    resumeScore?: string;
    difficulty?: string;
  }>();
  const startLevel = asCount(params.startLevel) || 1;
  const playLevel = asCount(params.playLevel) || startLevel;
  const resumeScore = asScore(params.resumeScore);
  const rawDifficulty = Array.isArray(params.difficulty) ? params.difficulty[0] : params.difficulty;
  const difficulty = isDifficultyId(rawDifficulty) ? rawDifficulty : "standard";
  const awardedRef = useRef(false);
  const shardsAwardedRef = useRef(false);
  const [boardSlot, setBoardSlot] = useState({ width: 0, height: 0 });
  const { recordScore } = useHighScore();
  const { recordReachedLevel } = useProgress();
  const { inventory, addEmbers, consumeItem } = useGameEconomy();
  const {
    phase,
    level,
    score,
    layout,
    targetCellIds,
    selectedCellIds,
    hintCellIds,
    wrongCellId,
    remainingCount,
    stage,
    stagesRequired,
    wardArmed,
    statusNote,
    startGame,
    applySecondSight,
    applyLanternOil,
    applyWard,
    applyPathHint,
    applyMercyItem,
    endRun,
    pauseForInterrupt,
    resumeAfterInterrupt,
    onRunePress,
  } = useMemoryGame();
  const { playSfx } = useGameAudio();
  useScreenMusic("playTheme");

  const prevPhaseRef = useRef(phase);
  const prevSelectedCountRef = useRef(selectedCellIds.length);
  const prevWardArmedRef = useRef(wardArmed);
  const wrongPlayedRef = useRef(false);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    if (phase === "preview" && prevPhase !== "preview") {
      playSfx("previewChime");
    }
    if (phase === "stageComplete" && prevPhase !== "stageComplete") {
      playSfx("stageClear");
    }
    if (phase === "levelComplete" && prevPhase !== "levelComplete") {
      playSfx("levelClear");
    }
    if (phase === "gameOver" && prevPhase !== "gameOver") {
      playSfx("gameOver");
    }
    if (phase !== "lastChance") {
      wrongPlayedRef.current = false;
    }
    prevPhaseRef.current = phase;
  }, [phase, playSfx]);

  useEffect(() => {
    if (phase === "playerInput" && selectedCellIds.length > prevSelectedCountRef.current) {
      playSfx("runeCorrect");
    }
    prevSelectedCountRef.current = selectedCellIds.length;
  }, [phase, playSfx, selectedCellIds.length]);

  useEffect(() => {
    if (phase === "lastChance" && wrongCellId != null && !wrongPlayedRef.current) {
      wrongPlayedRef.current = true;
      playSfx("runeWrong");
    }
  }, [phase, playSfx, wrongCellId]);

  useEffect(() => {
    if (
      prevWardArmedRef.current &&
      !wardArmed &&
      phase === "playerInput" &&
      wrongCellId != null
    ) {
      playSfx("charmUse");
    }
    prevWardArmedRef.current = wardArmed;
  }, [phase, playSfx, wardArmed, wrongCellId]);

  const handleRunePress = (cellId: CellId) => {
    if (phase === "playerInput") {
      playSfx("runeTap");
    }
    onRunePress(cellId);
  };

  const resetAwardFlags = () => {
    awardedRef.current = false;
    shardsAwardedRef.current = false;
  };

  useFocusEffect(
    useCallback(() => {
      resumeAfterInterrupt();
      return () => {
        pauseForInterrupt();
      };
    }, [pauseForInterrupt, resumeAfterInterrupt])
  );

  useEffect(() => {
    resetAwardFlags();
    startGame(startLevel, difficulty, { playLevel, score: resumeScore });
  }, [difficulty, playLevel, resumeScore, startGame, startLevel]);

  useEffect(() => {
    if (phase === "idle") {
      return;
    }

    void recordReachedLevel(level);
  }, [level, phase, recordReachedLevel]);

  useEffect(() => {
    if (phase !== "levelComplete" || shardsAwardedRef.current) {
      return;
    }

    shardsAwardedRef.current = true;
    const shardsEarned = calculateLanternShards(level, difficulty);
    void addEmbers(shardsEarned);
    const timer = setTimeout(() => {
      router.replace({
        pathname: "/level-complete",
        params: {
          level: String(level),
          score: String(score),
          startLevel: String(startLevel),
          playLevel: String(level + 1),
          difficulty,
          shards: String(shardsEarned),
        },
      });
    }, LEVEL_COMPLETE_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [addEmbers, difficulty, level, phase, router, score, startLevel]);

  useEffect(() => {
    if (phase !== "gameOver") {
      return;
    }

    if (!awardedRef.current) {
      awardedRef.current = true;
      void recordScore(score);
    }

    const timer = setTimeout(() => {
      router.replace({
        pathname: "/results",
        params: {
          score: String(score),
          level: String(level),
          startLevel: String(startLevel),
          difficulty,
          embers: "0",
        },
      });
    }, GAME_OVER_REVEAL_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [difficulty, level, phase, recordScore, router, score, startLevel]);

  const onUsePowerUp = (id: PowerUpId) => {
    if (phase !== "playerInput") {
      return;
    }

    const applied =
      id === "lanternOil"
        ? applyLanternOil()
        : id === "secondSight"
          ? applySecondSight()
          : id === "ward"
            ? applyWard()
            : applyPathHint();

    if (applied) {
      playSfx(id === "ward" ? "wardArm" : "charmUse");
      void consumeItem(id);
    }
  };

  const onUseMercyItem = (id: PowerUpId) => {
    if (applyMercyItem(id)) {
      playSfx(id === "ward" ? "wardArm" : "charmUse");
      void consumeItem(id);
    }
  };

  const onReturnToCamp = () => {
    pauseForInterrupt();
    router.replace("/");
  };

  const onBoardLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBoardSlot((current) => {
      if (current.width === width && current.height === height) {
        return current;
      }
      return { width, height };
    });
  };

  const showRemaining = phase === "playerInput";
  const backgroundSource = chapterBackground(phase === "idle" ? startLevel : level);
  const onArt = backgroundSource != null;

  return (
    <ScreenContainer style={styles.screen} backgroundSource={backgroundSource}>
      <View style={onArt ? styles.skyVeil : undefined}>
        <GameHeader
          level={level}
          score={score}
          stage={stage}
          stagesRequired={stagesRequired}
          onArt={onArt}
          onReturnToCamp={onReturnToCamp}
        />
      </View>
      <View style={styles.boardSlot} onLayout={onBoardLayout}>
        <RuneGrid
          layout={layout}
          slotWidth={boardSlot.width}
          slotHeight={boardSlot.height}
          phase={phase}
          targetCellIds={targetCellIds}
          selectedCellIds={selectedCellIds}
          hintCellIds={hintCellIds}
          wrongCellId={wrongCellId}
          onRunePress={handleRunePress}
        />
      </View>
      <View style={[styles.chrome, onArt && styles.dockVeil]}>
        <View style={styles.statusCluster}>
          <Text
            style={[
              styles.status,
              onArt && styles.onArt,
              phase === "levelComplete" && styles.success,
              phase === "stageComplete" && styles.success,
              (phase === "gameOver" || phase === "lastChance") && styles.fail,
            ]}
            accessibilityLiveRegion="polite"
          >
            {statusNote ?? statusCopy(phase)}
          </Text>
          <Text
            style={[
              styles.remaining,
              onArt && styles.onArt,
              !showRemaining && styles.remainingHidden,
            ]}
            accessibilityLiveRegion={showRemaining ? "polite" : "none"}
            accessibilityElementsHidden={!showRemaining}
          >
            {remainingCount} {remainingCount === 1 ? "rune" : "runes"} still to find
          </Text>
        </View>
        <PowerUpBar
          inventory={inventory}
          disabled={phase !== "playerInput"}
          wardArmed={wardArmed}
          onUse={onUsePowerUp}
        />
      </View>
      <LastChanceMenu
        visible={phase === "lastChance"}
        inventory={inventory}
        onUseItem={onUseMercyItem}
        onDecline={() => {
          void endRun();
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
    position: "relative",
    gap: theme.spacing.md,
  },
  chrome: {
    width: "100%",
    gap: theme.spacing.md,
  },
  skyVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginTop: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.overlay.sky,
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: theme.overlay.dock,
  },
  onArt: {
    ...theme.artTextShadow,
  },
  boardSlot: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusCluster: {
    width: "100%",
    gap: 4,
    minHeight: 42,
    justifyContent: "center",
  },
  status: {
    color: theme.colors.textMuted,
    textAlign: "center",
    ...theme.typography.body,
  },
  remaining: {
    color: theme.colors.accent,
    textAlign: "center",
    ...theme.typography.overline,
  },
  remainingHidden: {
    opacity: 0,
  },
  success: {
    color: theme.colors.correct,
    fontWeight: "600",
  },
  fail: {
    color: theme.colors.wrong,
    fontWeight: "600",
  },
});
