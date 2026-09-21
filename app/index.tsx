import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";

import { AdminUnlockToggle } from "@/components/AdminUnlockToggle";
import { AudioMuteBar } from "@/components/AudioMuteBar";
import { CurrencyBalance } from "@/components/CurrencyBalance";
import { FrostWickOffer } from "@/components/FrostWickOffer";
import { LanternReminderToggle } from "@/components/LanternReminderToggle";
import { LanternSocialLight } from "@/components/LanternSocialLight";
import { MotionToggle } from "@/components/MotionToggle";
import { NightLanternCard } from "@/components/NightLanternCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ShopStallMark } from "@/components/ShopStallMark";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useAnimatedBackgrounds } from "@/hooks/useAnimatedBackgrounds";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { useHighScore } from "@/hooks/useHighScore";
import { useLanternGhosts } from "@/hooks/useLanternGhosts";
import { useLanternReminder } from "@/hooks/useLanternReminder";
import { useNightLantern } from "@/hooks/useNightLantern";
import { useProgress } from "@/hooks/useProgress";
import { getCheckpointForLevel, isCheckpointUnlocked } from "@/lib/gameConfig";
import { shareLanternSeal } from "@/lib/lanternShare";
import { theme } from "@/lib/theme";

const menuBackground = require("../assets/images/game images/GB_Menu-Background.png");
const menuVideo = require("../assets/video/GB_Menu-Background.mp4");

export default function HomeScreen() {
  const router = useRouter();
  const { highScore, ready: scoreReady } = useHighScore();
  const { embers, ready: economyReady } = useGameEconomy();
  const { highestReachedLevel, ready: progressReady } = useProgress();
  const {
    ready: lanternReady,
    today: lanternToday,
    state: lanternState,
    streak,
    freezeOwned,
    freezeOffer,
    playLevel: lanternLevel,
    availability,
    whisper,
    applyFreeze,
    declineFreeze,
  } = useNightLantern();
  const {
    ready: ghostsReady,
    ghosts,
    selfName,
    saveSelfName,
    importSeal,
    removeSeal,
    composeShare,
  } = useLanternGhosts();
  const lanternChapterTitle = getCheckpointForLevel(lanternLevel).title;
  const { enabled: animatedBackgrounds, ready: motionReady, toggle: toggleAnimatedBackgrounds } =
    useAnimatedBackgrounds();
  const { enabled: adminUnlockAll, ready: adminReady, toggle: toggleAdminUnlockAll } = useAdminMode();
  const {
    enabled: lanternReminder,
    ready: reminderReady,
    toggle: toggleLanternReminder,
  } = useLanternReminder();
  const focused = useIsFocused();
  const {
    playSfx,
    ready: audioReady,
    sfxVolume,
    musicVolume,
    setSfxVolume,
    setMusicVolume,
  } = useGameAudio();
  useScreenMusic("menuTheme");

  return (
    <ScreenContainer
      style={styles.screen}
      backgroundSource={menuBackground}
      backgroundVideo={menuVideo}
      playBackgroundVideo={animatedBackgrounds && focused}
    >
      <View style={styles.skyVeil}>
        <View style={styles.status}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              economyReady ? `Shop, ${embers} embers` : "Shop, loading embers"
            }
            accessibilityHint="Opens the ember shop"
            accessibilityState={{ busy: !economyReady }}
            hitSlop={theme.hitSlop}
            onPress={() => {
              playSfx("uiTap");
              router.push("/shop");
            }}
            style={({ pressed }) => [styles.shopHit, pressed && styles.pressed]}
          >
            <CurrencyBalance
              embers={embers}
              align="left"
              accessible={false}
              onArt
              compact
              chip
              pending={!economyReady}
              leading={<ShopStallMark />}
            />
          </Pressable>
          <View
            style={styles.highScore}
            accessibilityLabel={scoreReady ? `Best score ${highScore}` : "Best score loading"}
          >
            <Text style={styles.scoreLabel}>Best Score</Text>
            <Text style={[styles.scoreValue, !scoreReady && styles.pendingValue]}>
              {scoreReady ? highScore : " "}
            </Text>
          </View>
        </View>

        <View style={styles.brand}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            maxFontSizeMultiplier={1.3}
            style={styles.title}
          >
            Glowbound
          </Text>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            Follow the lantern. Remember the runes. Restore the kingdom.
          </Text>
        </View>
      </View>

      <View style={styles.stage} pointerEvents="box-none">
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stageInner}
          style={styles.stageScroll}
        >
          {freezeOffer ? (
            <FrostWickOffer
              streak={streak}
              freezeOwned={freezeOwned}
              onUse={() => {
                playSfx("emberGain");
                void applyFreeze();
              }}
              onDecline={() => {
                playSfx("uiTap");
                void declineFreeze();
              }}
            />
          ) : (
            <NightLanternCard
              streak={streak}
              freezeOwned={freezeOwned}
              animateGlow={animatedBackgrounds}
              weeklyWhisper={whisper.isTonight}
              chapterTitle={lanternChapterTitle}
              dreamPreview={
                progressReady &&
                !isCheckpointUnlocked(
                  getCheckpointForLevel(lanternLevel).startLevel,
                  highestReachedLevel
                )
              }
              canStart={lanternReady && availability.canStart}
              rematch={availability.canRematch}
              pending={!lanternReady}
              onPress={() => router.push("/lantern")}
            />
          )}
          <LanternSocialLight
            ready={ghostsReady}
            today={lanternToday}
            selfName={selfName}
            ghosts={ghosts}
            whisperTitle={whisper.title}
            whisperIsTonight={whisper.isTonight}
            hideActions={freezeOffer}
            onChangeName={(name) => {
              void saveSelfName(name);
            }}
            onShare={() => {
              const stars = lanternState.bestStarsByDay[lanternToday] ?? 0;
              void shareLanternSeal(
                composeShare({
                  patternsCleared: stars >= 2 ? 5 : stars === 1 ? 3 : 0,
                  chapterTitle: lanternChapterTitle,
                  streak,
                  stars,
                  litDate: lanternToday,
                })
              );
            }}
            onImport={async (raw) => {
              const result = await importSeal(raw, lanternToday);
              if (result.ok) {
                playSfx("emberGain");
                return null;
              }
              return result.reason;
            }}
            onRemoveGhost={(ghostId) => {
              playSfx("uiTap");
              void removeSeal(ghostId);
            }}
          />
          <LanternReminderToggle
            enabled={lanternReminder}
            disabled={!reminderReady}
            onToggle={() => {
              playSfx("uiTap");
              toggleLanternReminder();
            }}
          />
        </ScrollView>
      </View>

      <View style={styles.dockVeil}>
        <View style={styles.dockRow}>
          <View style={styles.audioSlot}>
            <AudioMuteBar
              musicVolume={musicVolume}
              sfxVolume={sfxVolume}
              disabled={!audioReady}
              onChangeMusicVolume={(volume) => {
                void setMusicVolume(volume);
              }}
              onChangeSfxVolume={(volume) => {
                void setSfxVolume(volume);
              }}
              onPreviewSfx={() => {
                playSfx("uiTap");
              }}
            />
          </View>
          <MotionToggle
            enabled={animatedBackgrounds}
            disabled={!motionReady}
            onToggle={() => {
              playSfx("uiTap");
              toggleAnimatedBackgrounds();
            }}
          />
          <AdminUnlockToggle
            enabled={adminUnlockAll}
            disabled={!adminReady}
            onToggle={() => {
              playSfx("uiTap");
              toggleAdminUnlockAll();
            }}
          />
        </View>
        <PrimaryButton
          label="Begin Journey"
          fullWidth
          accessibilityHint="Opens difficulty selection, then starts from the Sleeping Woods"
          onPress={() => router.push("/difficulty")}
        />
        <PrimaryButton
          label="Levels"
          variant="ghost"
          fullWidth
          accessibilityHint="Opens stages you can start from"
          onPress={() => router.push("/levels")}
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
  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  shopHit: {
    minHeight: theme.minTapTarget,
    minWidth: theme.minTapTarget,
    justifyContent: "center",
    flexShrink: 1,
  },
  highScore: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 88,
    minHeight: theme.minTapTarget,
    gap: 4,
  },
  scoreLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
    ...theme.artTextShadow,
  },
  scoreValue: {
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    ...theme.typography.score,
    ...theme.artTextShadow,
  },
  pendingValue: {
    opacity: 0.35,
  },
  brand: {
    alignItems: "center",
    width: "100%",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    textAlign: "center",
    ...theme.typography.display,
    ...theme.artTextShadow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    color: theme.colors.textMuted,
    textAlign: "center",
    alignSelf: "stretch",
    paddingHorizontal: theme.spacing.sm,
    ...theme.typography.caption,
    ...theme.artTextShadow,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  stageScroll: {
    flex: 1,
  },
  stageInner: {
    flexGrow: 1,
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
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
  dockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.xs,
    width: "100%",
  },
  audioSlot: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.86,
  },
});
