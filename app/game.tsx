import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { GameHeader } from "@/components/GameHeader";
import { LastChanceMenu } from "@/components/LastChanceMenu";
import { PowerUpBar } from "@/components/PowerUpBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { RuneGrid } from "@/components/RuneGrid";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useHighScore } from "@/hooks/useHighScore";
import { useMemoryGame } from "@/hooks/useMemoryGame";
import { useProgress } from "@/hooks/useProgress";
import { calculateLanternShards, isDifficultyId } from "@/lib/economyEngine";
import { GAME_OVER_REVEAL_MS, LEVEL_COMPLETE_DELAY_MS } from "@/lib/gameConfig";
import { theme } from "@/lib/theme";
import type { PowerUpId } from "@/types/economy";

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
      return "Stage cleared.";
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
  const { recordScore } = useHighScore();
  const { recordReachedLevel } = useProgress();
  const { inventory, addEmbers, consumeItem } = useGameEconomy();
  const {
    phase,
    level,
    score,
    gridSize,
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
    restartGame,
    applySecondSight,
    applyLanternOil,
    applyWard,
    applyPathHint,
    applyMercyItem,
    endRun,
    onRunePress,
  } = useMemoryGame();

  const resetAwardFlags = () => {
    awardedRef.current = false;
    shardsAwardedRef.current = false;
  };

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
    if (phase !== "gameOver" || awardedRef.current) {
      return;
    }

    awardedRef.current = true;
    void recordScore(score);
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

    if (id === "lanternOil") {
      void consumeItem(id).then((result) => {
        if (result.ok) {
          applyLanternOil();
        }
      });
      return;
    }

    const applied =
      id === "secondSight"
        ? applySecondSight()
        : id === "ward"
          ? applyWard()
          : applyPathHint();

    if (applied) {
      void consumeItem(id);
    }
  };

  const onUseMercyItem = (id: PowerUpId) => {
    if (applyMercyItem(id)) {
      void consumeItem(id);
    }
  };

  const onRestart = () => {
    if (phase === "levelComplete" || phase === "lastChance" || phase === "gameOver") {
      return;
    }

    resetAwardFlags();
    restartGame();
  };

  return (
    <ScreenContainer style={styles.screen}>
      <GameHeader level={level} score={score} stage={stage} stagesRequired={stagesRequired} />
      <View style={styles.stage}>
        <RuneGrid
          gridSize={gridSize}
          phase={phase}
          targetCellIds={targetCellIds}
          selectedCellIds={selectedCellIds}
          hintCellIds={hintCellIds}
          wrongCellId={wrongCellId}
          onRunePress={onRunePress}
        />
        <Text
          style={[
            styles.status,
            phase === "levelComplete" && styles.success,
            phase === "stageComplete" && styles.success,
            (phase === "gameOver" || phase === "lastChance") && styles.fail,
          ]}
          accessibilityLiveRegion="polite"
        >
          {statusNote ?? statusCopy(phase)}
        </Text>
        <Text
          style={styles.remaining}
          accessibilityLiveRegion="polite"
          accessibilityLabel={`${remainingCount} runes still to find`}
        >
          {remainingCount} {remainingCount === 1 ? "rune" : "runes"} still to find
        </Text>
        <PowerUpBar
          inventory={inventory}
          disabled={phase !== "playerInput"}
          wardArmed={wardArmed}
          onUse={onUsePowerUp}
        />
      </View>
      <PrimaryButton
        label="Restart run"
        variant="ghost"
        fullWidth
        accessibilityHint={`Restarts this chapter from level ${startLevel}`}
        onPress={onRestart}
      />
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
    justifyContent: "space-between",
    width: "100%",
    position: "relative",
  },
  stage: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  status: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    textAlign: "center",
    letterSpacing: 0.3,
  },
  remaining: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    textAlign: "center",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
