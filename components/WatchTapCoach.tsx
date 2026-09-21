import { StyleSheet, Text, View } from "react-native";

import {
  WATCH_TAP_TAP_NOTE,
  WATCH_TAP_WATCH_NOTE,
  type WatchTapCoachBeat,
} from "@/lib/stageModifiers";
import { theme } from "@/lib/theme";

interface WatchTapCoachProps {
  beat: WatchTapCoachBeat | null;
}

export function WatchTapCoach({ beat }: WatchTapCoachProps) {
  if (beat == null) {
    return null;
  }

  const copy = beat === "watch" ? WATCH_TAP_WATCH_NOTE : WATCH_TAP_TAP_NOTE;

  return (
    <View
      style={styles.veil}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.stall}>
        <View style={styles.pixelHilite} />
        <Text style={styles.copy}>{copy}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  veil: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.overlay.dock,
    zIndex: 2,
  },
  stall: {
    width: "100%",
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    paddingHorizontal: theme.stallPlate.padding,
    paddingVertical: theme.spacing.md,
    overflow: "hidden",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(196, 184, 150, 0.16)",
  },
  copy: {
    color: theme.colors.text,
    textAlign: "center",
    ...theme.typography.heading,
  },
});
