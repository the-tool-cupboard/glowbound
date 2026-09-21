import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PathLanternMark } from "@/components/PathLanternMark";
import { useGameAudio } from "@/hooks/useGameAudio";
import { lanternRelitLabel } from "@/lib/nightLantern";
import { theme } from "@/lib/theme";

const MARK_SIZE = 52;

interface NightLanternCardProps {
  streak: number;
  chapterTitle: string;
  dreamPreview: boolean;
  canStart: boolean;
  rematch: boolean;
  pending: boolean;
  onPress: () => void;
}

export function NightLanternCard({
  streak,
  chapterTitle,
  dreamPreview,
  canStart,
  rematch,
  pending,
  onPress,
}: NightLanternCardProps) {
  const { playSfx } = useGameAudio();
  const [relitLabel, setRelitLabel] = useState(() => lanternRelitLabel(new Date()));

  useEffect(() => {
    if (canStart || pending) {
      return;
    }

    const tick = () => {
      setRelitLabel(lanternRelitLabel(new Date()));
    };
    tick();
    const timer = setInterval(tick, 15_000);
    return () => {
      clearInterval(timer);
    };
  }, [canStart, pending]);

  const actionLabel = pending ? "…" : canStart ? (rematch ? "Relight" : "Light the lantern") : relitLabel;
  const chapterLine = dreamPreview ? `Tonight's dream · ${chapterTitle}` : chapterTitle;
  const disabled = pending || !canStart;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Night Lantern, streak ${streak}, ${chapterLine}, ${actionLabel}`}
      accessibilityHint={
        canStart
          ? rematch
            ? "Starts a free lantern rematch"
            : "Lights today's five-pattern lantern run"
          : "The lantern is spent until dawn"
      }
      accessibilityState={{ disabled, busy: pending }}
      disabled={disabled}
      onPress={() => {
        playSfx("emberGain");
        onPress();
      }}
      style={({ pressed }) => [styles.outer, pressed && canStart && styles.pressed]}
    >
      <View style={[styles.tile, canStart && styles.tileReady]}>
        <View style={[styles.pixelHilite, canStart && styles.pixelHiliteOn]} />
        <View style={[styles.mark, canStart && styles.markReady]}>
          <PathLanternMark pathId="standard" selected={canStart} size={MARK_SIZE} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.name}>
            Night Lantern
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.meta}>
            Streak {streak}
            {streak >= 3 ? " · Kindled" : ""}
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.chapter}>
            {chapterLine}
          </Text>
        </View>
        <View style={styles.status} accessibilityElementsHidden>
          <Text
            numberOfLines={2}
            maxFontSizeMultiplier={1.15}
            style={[styles.action, canStart ? styles.actionReady : styles.actionMuted]}
          >
            {actionLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    minHeight: theme.minTapTarget,
  },
  pressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  tile: {
    minHeight: theme.minTapTarget,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    overflow: "hidden",
    borderColor: theme.button3d.rim,
    backgroundColor: theme.overlay.stall,
  },
  tileReady: {
    backgroundColor: theme.colors.backgroundElevated,
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(196, 184, 150, 0.18)",
  },
  pixelHiliteOn: {
    backgroundColor: theme.button3d.highlight,
  },
  mark: {
    width: 56,
    height: 56,
    flexShrink: 0,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.path.standard.well,
    opacity: 0.72,
  },
  markReady: {
    opacity: 1,
    borderColor: theme.path.standard.rim,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    ...theme.typography.heading,
    letterSpacing: 0.6,
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  chapter: {
    color: theme.colors.accent,
    ...theme.typography.overline,
  },
  status: {
    maxWidth: 108,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  action: {
    textAlign: "right",
    ...theme.typography.overline,
  },
  actionReady: {
    color: theme.colors.accent,
  },
  actionMuted: {
    color: theme.colors.textMuted,
  },
});
