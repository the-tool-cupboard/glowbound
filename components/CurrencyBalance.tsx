import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";

interface CurrencyBalanceProps {
  embers: number;
  align?: "left" | "center" | "right";
  label?: string;
  accessible?: boolean;
  onArt?: boolean;
}

export function CurrencyBalance({
  embers,
  align = "center",
  label = "Embers",
  accessible = true,
  onArt = false,
}: CurrencyBalanceProps) {
  return (
    <View
      accessible={accessible}
      style={[styles.row, align === "left" && styles.left, align === "right" && styles.right]}
      accessibilityLabel={`${embers} ${label.toLowerCase()}`}
    >
      <Text style={[styles.label, onArt && styles.onArt]}>{label}</Text>
      <Text style={[styles.value, onArt && styles.onArt]}>{embers}</Text>
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
  label: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  value: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  onArt: {
    ...theme.artTextShadow,
  },
});
