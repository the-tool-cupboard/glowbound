import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
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
          accessibilityHint={`Starts this chapter again from level ${startLevel}`}
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
    fontSize: theme.typography.title,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: theme.spacing.sm,
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    marginBottom: theme.spacing.md,
  },
  stats: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.16)",
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: "700",
  },
  actions: {
    width: "100%",
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
