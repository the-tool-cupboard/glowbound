import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface StageCardProps {
  title: string;
  stageNumber: number;
  levelRange: string;
  shapeName: string;
  unlocked: boolean;
  pending: boolean;
  onPress: () => void;
}

export function StageCard({
  title,
  stageNumber,
  levelRange,
  shapeName,
  unlocked,
  pending,
  onPress,
}: StageCardProps) {
  const status = pending ? "…" : unlocked ? "Unlocked" : "Locked";
  const showLockPip = !unlocked && !pending;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Stage ${stageNumber}, ${title}, ${levelRange}, ${shapeName}${pending ? ", loading" : unlocked ? "" : ", locked"}`}
      accessibilityState={{ disabled: !unlocked, busy: pending }}
      disabled={!unlocked}
      onPress={onPress}
      style={({ pressed }) => [styles.outer, pressed && unlocked && styles.pressed]}
    >
      <View style={[styles.tile, unlocked ? styles.tileOpen : styles.tileQuiet]}>
        <View style={[styles.pixelHilite, unlocked && styles.pixelHiliteOn]} />
        <View style={styles.copy}>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.meta}>
            Stage {stageNumber} · {levelRange}
          </Text>
        </View>
        <View style={styles.status} accessibilityElementsHidden>
          {showLockPip ? <View style={styles.lockPip} /> : null}
          <Text style={[styles.state, unlocked ? styles.stateOpen : styles.stateMuted]}>
            {status}
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
    flex: 1,
    minHeight: theme.minTapTarget,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    overflow: "hidden",
  },
  tileOpen: {
    borderColor: theme.button3d.rim,
    backgroundColor: theme.colors.backgroundElevated,
  },
  tileQuiet: {
    borderColor: theme.colors.idleBorder,
    backgroundColor: theme.button3d.ghostFace,
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
  copy: {
    flex: 1,
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
  status: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 6,
    minWidth: 72,
  },
  lockPip: {
    width: 8,
    height: 8,
    backgroundColor: theme.colors.textMuted,
  },
  state: {
    ...theme.typography.overline,
  },
  stateOpen: {
    color: theme.colors.accent,
  },
  stateMuted: {
    color: theme.colors.textMuted,
  },
});
