import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface StallStatPlateProps {
  label: string;
  value: number;
  accent?: boolean;
}

export function StallStatPlate({ label, value, accent = false }: StallStatPlateProps) {
  return (
    <View
      accessible
      accessibilityLabel={accent ? `${label} ${value}, best` : `${label} ${value}`}
      style={[styles.plate, accent ? styles.plateAccent : styles.plateQuiet]}
    >
      <View style={[styles.pixelHilite, accent && styles.pixelHiliteOn]} />
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.label}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        maxFontSizeMultiplier={1.2}
        style={[styles.value, accent && styles.valueAccent]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    flex: 1,
    minHeight: 112,
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.stallPlate.padding,
    justifyContent: "center",
    gap: theme.spacing.xs,
    overflow: "hidden",
  },
  plateQuiet: {
    borderColor: theme.overlay.stallRim,
    backgroundColor: theme.overlay.stall,
  },
  plateAccent: {
    borderWidth: theme.pixel.outline,
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(7, 11, 22, 0.72)",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(196, 184, 150, 0.16)",
  },
  pixelHiliteOn: {
    backgroundColor: theme.button3d.highlight,
  },
  label: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  value: {
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    ...theme.typography.score,
  },
  valueAccent: {
    color: theme.colors.accent,
  },
});
