import { Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { DifficultyOption } from "@/types/economy";

interface DifficultyCardProps {
  option: DifficultyOption;
  selected: boolean;
  onSelect: () => void;
}

export function DifficultyCard({ option, selected, onSelect }: DifficultyCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${option.name}. ${option.description}`}
      accessibilityState={{ selected }}
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.name}>{option.name}</Text>
        <Text style={styles.description}>{option.description}</Text>
      </View>
      <Text style={[styles.mark, selected && styles.markOn]}>{selected ? "Selected" : "Select"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: theme.minTapTarget,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: "rgba(196, 184, 150, 0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  selected: {
    borderColor: "rgba(230, 195, 92, 0.7)",
  },
  pressed: {
    opacity: 0.88,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: "700",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
  },
  mark: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  markOn: {
    color: theme.colors.accent,
  },
});
