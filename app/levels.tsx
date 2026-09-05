import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useProgress } from "@/hooks/useProgress";
import { CHECKPOINTS, isCheckpointUnlocked } from "@/lib/gameConfig";
import { theme } from "@/lib/theme";

export default function LevelsScreen() {
  const router = useRouter();
  const { highestReachedLevel } = useProgress();

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Levels</Text>
        <Text style={styles.copy}>Start from a chapter you have already reached.</Text>
      </View>

      <View style={styles.list}>
        {CHECKPOINTS.map((checkpoint) => {
          const unlocked = isCheckpointUnlocked(checkpoint.startLevel, highestReachedLevel);

          return (
            <Pressable
              key={checkpoint.startLevel}
              accessibilityRole="button"
              accessibilityLabel={`${checkpoint.title}, level ${checkpoint.startLevel}, ${checkpoint.gridSize} by ${checkpoint.gridSize}${unlocked ? "" : ", locked"}`}
              accessibilityState={{ disabled: !unlocked }}
              disabled={!unlocked}
              onPress={() =>
                router.push({
                  pathname: "/difficulty",
                  params: { startLevel: String(checkpoint.startLevel) },
                })
              }
              style={({ pressed }) => [
                styles.row,
                !unlocked && styles.rowLocked,
                pressed && unlocked && styles.rowPressed,
              ]}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, !unlocked && styles.lockedText]}>
                  {checkpoint.title}
                </Text>
                <Text style={[styles.rowMeta, !unlocked && styles.lockedText]}>
                  Level {checkpoint.startLevel} · {checkpoint.gridSize}x{checkpoint.gridSize}
                </Text>
              </View>
              <Text style={[styles.rowState, !unlocked && styles.lockedText]}>
                {unlocked ? "Unlocked" : "Locked"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <PrimaryButton
        label="Return Home"
        variant="ghost"
        fullWidth
        accessibilityHint="Returns to the home screen"
        onPress={() => router.replace("/")}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "space-between",
    width: "100%",
  },
  hero: {
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
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
    lineHeight: 22,
  },
  list: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  row: {
    minHeight: theme.minTapTarget,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.28)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  rowLocked: {
    borderColor: "rgba(196, 184, 150, 0.12)",
    opacity: 0.55,
  },
  rowPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: "700",
  },
  rowMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  rowState: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  lockedText: {
    color: theme.colors.textMuted,
  },
});
