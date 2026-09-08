import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useScreenMusic } from "@/hooks/useGameAudio";
import { useHighScore } from "@/hooks/useHighScore";
import { theme } from "@/lib/theme";

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
  const { highScore } = useHighScore();
  useScreenMusic("resultsTheme");

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Run over</Text>
        <Text style={styles.copy}>You reached level {level || 1}.</Text>
        <Text style={styles.copy}>
          {embersEarned > 0
            ? `You gathered ${embersEarned} embers.`
            : "Embers from completed levels stay with you."}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Score</Text>
          <Text style={styles.statValue}>{score}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Best Score</Text>
          <Text style={styles.statValue}>{Math.max(highScore, score)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label={`Retry from level ${startLevel}`}
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
          accessibilityHint="Returns to the home screen"
          onPress={() => router.replace("/")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "space-between",
    width: "100%",
  },
  hero: {
    paddingTop: theme.spacing.xxl,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    ...theme.typography.title,
  },
  copy: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    ...theme.typography.body,
  },
  stats: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.pixel,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    overflow: "hidden",
  },
  statLabel: {
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
    ...theme.typography.overline,
  },
  statValue: {
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    ...theme.typography.score,
  },
  actions: {
    width: "100%",
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
