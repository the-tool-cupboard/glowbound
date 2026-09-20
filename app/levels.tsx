import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";

import { AdminUnlockToggle } from "@/components/AdminUnlockToggle";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { StageCard } from "@/components/StageCard";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAnimatedBackgrounds } from "@/hooks/useAnimatedBackgrounds";
import { useProgress } from "@/hooks/useProgress";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { chapterArtSource } from "@/lib/chapterBackgrounds";
import {
  CHECKPOINTS,
  getCheckpointLevelRange,
  getCheckpointTwistLine,
  isStageStartUnlocked,
} from "@/lib/gameConfig";
import { theme } from "@/lib/theme";

const menuBackground = require("../assets/images/game images/GB_Menu-Background.png");
const menuVideo = require("../assets/video/GB_Menu-Background.mp4");

export default function LevelsScreen() {
  const router = useRouter();
  const { highestReachedLevel, ready } = useProgress();
  const { enabled: animatedBackgrounds } = useAnimatedBackgrounds();
  const { enabled: adminUnlockAll, ready: adminReady, toggle: toggleAdminUnlockAll } = useAdminMode();
  const { playSfx } = useGameAudio();
  const focused = useIsFocused();
  useScreenMusic("menuTheme");

  return (
    <ScreenContainer
      style={styles.screen}
      backgroundSource={menuBackground}
      backgroundVideo={menuVideo}
      playBackgroundVideo={animatedBackgrounds && focused}
    >
      <View style={styles.skyVeil}>
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={styles.title}
            >
              Stages
            </Text>
            <AdminUnlockToggle
              enabled={adminUnlockAll}
              disabled={!adminReady}
              onToggle={() => {
                playSfx("uiTap");
                toggleAdminUnlockAll();
              }}
            />
          </View>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.copy}>
            {adminUnlockAll
              ? "Admin mode. Every stage is open."
              : "Ten levels each. Start from a stage you have already reached."}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {CHECKPOINTS.map((checkpoint, index) => {
          const unlocked = isStageStartUnlocked(
            checkpoint.startLevel,
            ready ? highestReachedLevel : 0,
            adminReady && adminUnlockAll
          );
          const pending = !ready && !adminUnlockAll && checkpoint.startLevel > 1;

          return (
            <StageCard
              key={checkpoint.startLevel}
              title={checkpoint.title}
              stageNumber={index + 1}
              levelRange={getCheckpointLevelRange(checkpoint)}
              twistLine={getCheckpointTwistLine(checkpoint)}
              thumbnail={chapterArtSource(checkpoint.artKey)}
              unlocked={unlocked}
              pending={pending}
              onPress={() =>
                router.push({
                  pathname: "/difficulty",
                  params: { startLevel: String(checkpoint.startLevel) },
                })
              }
            />
          );
        })}
      </ScrollView>

      <View style={styles.dockVeil}>
        <PrimaryButton
          label="Back to camp"
          variant="ghost"
          fullWidth
          accessibilityHint="Returns to the start menu at camp"
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
    backgroundColor: theme.overlay.sky,
  },
  hero: {
    gap: theme.spacing.xs,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    ...theme.typography.heading,
    ...theme.artTextShadow,
  },
  copy: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    ...theme.artTextShadow,
  },
  list: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  listContent: {
    flexGrow: 1,
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.overlay.dock,
  },
});
