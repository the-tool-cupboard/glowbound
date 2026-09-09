import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface CurrencyBalanceProps {
  embers: number;
  align?: "left" | "center" | "right";
  label?: string;
  accessible?: boolean;
  onArt?: boolean;
  pending?: boolean;
  compact?: boolean;
  chip?: boolean;
}

export function CurrencyBalance({
  embers,
  align = "center",
  label = "Embers",
  accessible = true,
  onArt = false,
  pending = false,
  compact = false,
  chip = false,
}: CurrencyBalanceProps) {
  return (
    <View
      accessible={accessible}
      style={[
        styles.row,
        align === "left" && styles.left,
        align === "right" && styles.right,
        chip && styles.chip,
      ]}
      accessibilityLabel={pending ? `${label} loading` : `${embers} ${label.toLowerCase()}`}
    >
      <Text style={[styles.label, onArt && styles.onArt]}>{label}</Text>
      <Text
        style={[
          styles.value,
          compact && styles.valueCompact,
          onArt && styles.onArt,
          pending && styles.pending,
        ]}
      >
        {pending ? " " : embers}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: 4,
  },
  left: {
    alignItems: "flex-start",
  },
  right: {
    alignItems: "flex-end",
  },
  chip: {
    minHeight: theme.minTapTarget,
    minWidth: 88,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    backgroundColor: theme.button3d.ghostFace,
  },
  label: {
    color: theme.colors.accent,
    ...theme.typography.overline,
  },
  value: {
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    ...theme.typography.score,
  },
  valueCompact: {
    ...theme.typography.heading,
  },
  onArt: {
    ...theme.artTextShadow,
  },
  pending: {
    opacity: 0.35,
  },
});
