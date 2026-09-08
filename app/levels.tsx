import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useProgress } from "@/hooks/useProgress";
import { useScreenMusic } from "@/hooks/useGameAudio";
import {
  CHECKPOINTS,
  getCheckpointLevelRange,
  getCheckpointShapeName,
  isCheckpointUnlocked,
} from "@/lib/gameConfig";
import { theme } from "@/lib/theme";

export default function LevelsScreen() {
  const router = useRouter();
  const { highestReachedLevel, ready } = useProgress();
  useScreenMusic("menuTheme");

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Stages</Text>
        <Text style={styles.copy}>Ten levels each. Start from a stage you have already reached.</Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {CHECKPOINTS.map((checkpoint, index) => {
          const unlocked = isCheckpointUnlocked(
            checkpoint.startLevel,
            ready ? highestReachedLevel : 0
          );
          const pending = !ready && checkpoint.startLevel > 1;

          return (
            <Pressable
              key={checkpoint.startLevel}
              accessibilityRole="button"
              accessibilityLabel={`Stage ${index + 1}, ${checkpoint.title}, ${getCheckpointLevelRange(checkpoint)}, ${getCheckpointShapeName(checkpoint)}${pending ? ", loading" : unlocked ? "" : ", locked"}`}
              accessibilityState={{ disabled: !unlocked, busy: pending }}
              disabled={!unlocked}
              onPress={() =>
                router.push({
                  pathname: "/difficulty",
                  params: { startLevel: String(checkpoint.startLevel) },
                })
              }
              style={({ pressed }) => [
                styles.row,
                (!unlocked || pending) && styles.rowLocked,
                pressed && unlocked && styles.rowPressed,
              ]}
            >
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, (!unlocked || pending) && styles.lockedText]}>
                  {checkpoint.title}
                </Text>
                <Text style={[styles.rowMeta, (!unlocked || pending) && styles.lockedText]}>
                  Stage {index + 1} · {getCheckpointLevelRange(checkpoint)}
                </Text>
              </View>
              <Text style={[styles.rowState, (!unlocked || pending) && styles.lockedText]}>
                {pending ? "…" : unlocked ? "Unlocked" : "Locked"}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <PrimaryButton
        label="Back to camp"
        variant="ghost"
        fullWidth
        accessibilityHint="Returns to the start menu at camp"
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
    marginBottom: theme.spacing.sm,
    ...theme.typography.title,
  },
  copy: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
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
    ...theme.typography.heading,
  },
  rowMeta: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  rowState: {
    color: theme.colors.accent,
    ...theme.typography.overline,
  },
  lockedText: {
    color: theme.colors.textMuted,
  },
});
