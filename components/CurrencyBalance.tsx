import { type ReactNode } from "react";
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
  leading?: ReactNode;
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
  leading,
}: CurrencyBalanceProps) {
  const alignStyle = align === "left" ? styles.left : align === "right" ? styles.right : undefined;

  return (
    <View
      accessible={accessible}
      style={[styles.row, alignStyle, chip && styles.chip, leading != null && styles.withLeading]}
      accessibilityLabel={pending ? `${label} loading` : `${embers} ${label.toLowerCase()}`}
    >
      {leading}
      <View style={[styles.stack, alignStyle]} pointerEvents="none">
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
  },
  stack: {
    gap: 4,
  },
  left: {
    alignItems: "flex-start",
  },
  right: {
    alignItems: "flex-end",
  },
  withLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
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
