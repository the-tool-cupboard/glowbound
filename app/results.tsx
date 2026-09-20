import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { StallStatPlate } from "@/components/StallStatPlate";
import { useScreenMusic } from "@/hooks/useGameAudio";
import { useHighScore } from "@/hooks/useHighScore";
import { theme } from "@/lib/theme";

const failBackground = require("../assets/images/game images/GB_Results-Fail.png");

function asCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    score?: string;
    level?: string;
    startLevel?: string;
    difficulty?: string;
    embers?: string;
  }>();
  const score = asCount(params.score);
  const level = asCount(params.level);
  const startLevel = asCount(params.startLevel) || 1;
  const embersEarned = asCount(params.embers);
  const difficulty = params.difficulty ?? "standard";
  const { highScore, ready } = useHighScore();
  const bestScore = Math.max(highScore, score);
  const highlightBest = ready && score > 0 && score >= highScore;
  useScreenMusic("resultsTheme");

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
