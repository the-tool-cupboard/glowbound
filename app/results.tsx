import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { LanternShareCard } from "@/components/LanternShareCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { StallStatPlate } from "@/components/StallStatPlate";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { useHighScore } from "@/hooks/useHighScore";
import { useLanternGhosts } from "@/hooks/useLanternGhosts";
import { calculateEmbersEarned } from "@/lib/economyEngine";
import { shareLanternSeal } from "@/lib/lanternShare";
import {
  calendarDateInZone,
  lanternEmberDrip,
  lanternShareMessage,
  lanternStarsCopy,
} from "@/lib/nightLantern";
import {
  parseDifficultyParam,
  parseFlagParam,
  parseGameModeParam,
  parsePlayLevel,
  parseRouteParam,
  parseScoreParam,
  parseStarsParam,
} from "@/lib/routeParams";
import { theme } from "@/lib/theme";

const failBackground = require("../assets/images/game images/GB_Results-Fail.png");
const passBackground = require("../assets/images/game images/GB_Results-Pass.png");

function CampaignResults() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score?: string;
    level?: string;
    startLevel?: string;
    difficulty?: string;
    embers?: string;
  }>();
  const score = parseScoreParam(params.score);
  const level = parsePlayLevel(params.level);
  const startLevel = parsePlayLevel(params.startLevel);
  const difficulty = parseDifficultyParam(params.difficulty);
  const embersEarned = calculateEmbersEarned(score, level, difficulty);
  const { addEmbers, ready: economyReady } = useGameEconomy();
  const { highScore, ready } = useHighScore();
  const bestScore = Math.max(highScore, score);
  const highlightBest = ready && score > 0 && score >= highScore;
  const grantAppliedRef = useRef(false);
  useScreenMusic("resultsTheme");

  useEffect(() => {
    if (!economyReady || grantAppliedRef.current || embersEarned <= 0) {
      return;
    }

    grantAppliedRef.current = true;
    void addEmbers(embersEarned);
  }, [addEmbers, economyReady, embersEarned]);

  return (
    <ScreenContainer style={styles.screen} backgroundSource={failBackground}>
      <View style={styles.skyVeil}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.2}
          style={styles.title}
        >
          The path fades.
        </Text>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.copy}>
          You reached level {level || 1}.{" "}
          {embersEarned > 0
            ? `You gathered ${embersEarned} embers.`
            : "Embers from completed levels stay with you."}
        </Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.stats}>
          <StallStatPlate label="Score" value={score} />
          <StallStatPlate label="Best Score" value={bestScore} accent={highlightBest} />
        </View>
      </View>

      <View style={styles.dockVeil}>
        <PrimaryButton
          label={`Retry from level ${startLevel}`}
          fullWidth
          accessibilityHint={`Starts this stage again from level ${startLevel}`}
          onPress={() =>
            router.replace({
              pathname: "/game",
              params: { startLevel: String(startLevel), difficulty: String(difficulty) },
            })
          }
        />
        <PrimaryButton
          label="Return Home"
          variant="ghost"
          fullWidth
          accessibilityHint="Returns to the home screen"
          onPress={() => router.replace("/")}
        />
      </View>
    </ScreenContainer>
  );
}

function LanternResults() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    stars?: string;
    streak?: string;
    embers?: string;
    patterns?: string;
    chapter?: string;
    rematch?: string;
    dream?: string;
  }>();
  const stars = parseStarsParam(params.stars);
  const streak = parseScoreParam(params.streak);
  const patternsCleared = parseScoreParam(params.patterns);
  const chapterTitle = parseRouteParam(params.chapter) ?? "the night";
  const rematch = parseFlagParam(params.rematch);
  const dreamPreview = parseFlagParam(params.dream);
  const embersEarned =
    params.embers == null || params.embers === ""
      ? lanternEmberDrip(stars, streak)
      : parseScoreParam(params.embers);
  const { addEmbers, ready: economyReady } = useGameEconomy();
  const { playSfx } = useGameAudio();
  const { ready: ghostsReady, composeShare } = useLanternGhosts();
  const grantAppliedRef = useRef(false);
  const stingPlayedRef = useRef(false);
  useScreenMusic("resultsTheme");

  useEffect(() => {
    if (!economyReady || grantAppliedRef.current || embersEarned <= 0) {
      return;
    }

    grantAppliedRef.current = true;
    void addEmbers(embersEarned);
    playSfx("emberGain");
  }, [addEmbers, economyReady, embersEarned, playSfx]);

  useEffect(() => {
    if (stingPlayedRef.current) {
      return;
    }
    stingPlayedRef.current = true;
    if (rematch) {
      playSfx("lastChanceSting");
    }
  }, [playSfx, rematch]);

  const shareCopy = ghostsReady
    ? composeShare({
        patternsCleared,
        chapterTitle,
        streak,
        stars,
        litDate: calendarDateInZone(new Date()),
      })
    : lanternShareMessage({
        patternsCleared,
        chapterTitle,
        streak,
      });

  return (
    <ScreenContainer
      style={styles.screen}
      backgroundSource={stars >= 3 ? passBackground : failBackground}
    >
      <View style={styles.skyVeil}>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.2}
          style={styles.title}
        >
          {lanternStarsCopy(stars)}
        </Text>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.copy}>
          {dreamPreview ? `Tonight's dream of ${chapterTitle}.` : chapterTitle} You gathered{" "}
          {embersEarned} embers.
        </Text>
      </View>

      <View style={styles.stage}>
        <View style={styles.stats}>
          <StallStatPlate label="Stars" value={stars} accent={stars >= 3} />
          <StallStatPlate label="Streak" value={streak} accent={streak >= 3} />
          <StallStatPlate label="Embers" value={embersEarned} />
        </View>
        <LanternShareCard
          patternsCleared={patternsCleared}
          chapterTitle={chapterTitle}
          streak={streak}
          stars={stars}
        />
      </View>

      <View style={styles.dockVeil}>
        <PrimaryButton
          label="Share"
          variant={rematch ? "ghost" : "primary"}
          fullWidth
          accessibilityHint="Opens the system share sheet with this lantern seal and a pasteable ghost code"
          onPress={() => {
            playSfx("uiTap");
            void shareLanternSeal(shareCopy);
          }}
        />
        {rematch ? (
          <PrimaryButton
            label="Rematch"
            fullWidth
            accessibilityHint="Lights the lantern once more tonight"
            onPress={() =>
              router.replace({
                pathname: "/game",
                params: { mode: "lantern" },
              })
            }
          />
        ) : null}
        <PrimaryButton
          label="Return Camp"
          variant="ghost"
          fullWidth
          accessibilityHint="Returns to camp"
          onPress={() => router.replace("/")}
        />
      </View>
    </ScreenContainer>
  );
}

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ mode?: string }>();
  if (parseGameModeParam(params.mode) === "lantern") {
    return <LanternResults />;
  }
  return <CampaignResults />;
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
  },
  skyVeil: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
    backgroundColor: theme.overlay.sky,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.title,
    ...theme.artTextShadow,
  },
  copy: {
    color: "#A8B8C8",
    ...theme.typography.caption,
    ...theme.artTextShadow,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  stats: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
    backgroundColor: theme.overlay.dock,
  },
});
