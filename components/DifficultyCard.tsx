import { Pressable, StyleSheet, Text, View } from "react-native";

import { useGameAudio } from "@/hooks/useGameAudio";
import { formatEmberMultiplier } from "@/lib/economyConfig";
import { theme } from "@/lib/theme";
import type { DifficultyOption } from "@/types/economy";

interface DifficultyCardProps {
  option: DifficultyOption;
  selected: boolean;
  onSelect: () => void;
}

export function DifficultyCard({ option, selected, onSelect }: DifficultyCardProps) {
  const multiplierLabel = formatEmberMultiplier(option.emberMultiplier);
  const { playSfx } = useGameAudio();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${option.name}. ${option.description}. ${multiplierLabel} embers.`}
      accessibilityState={{ selected }}
      onPress={() => {
        playSfx("uiSelect");
        onSelect();
      }}
      style={({ pressed }) => [styles.outer, pressed && styles.pressed]}
    >
      <View style={[styles.tile, selected ? styles.tileSelected : styles.tileQuiet]}>
        <View style={[styles.pixelHilite, selected && styles.pixelHiliteOn]} />
        <View style={styles.copy}>
          <Text style={styles.name}>{option.name}</Text>
          <Text style={styles.description}>{option.description}</Text>
        </View>
        <View style={styles.payout} accessibilityElementsHidden>
          <Text style={[styles.multiplier, selected && styles.multiplierOn]}>
            {multiplierLabel}
          </Text>
          <Text style={[styles.embers, selected && styles.multiplierOn]}>embers</Text>
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
  tileQuiet: {
    borderColor: theme.colors.idleBorder,
    backgroundColor: "rgba(7, 11, 22, 0.55)",
  },
  tileSelected: {
    borderColor: theme.button3d.rim,
    backgroundColor: "rgba(21, 29, 48, 0.88)",
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
  description: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  payout: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 64,
    gap: 2,
  },
  multiplier: {
    color: theme.colors.textMuted,
    fontVariant: ["tabular-nums"],
    ...theme.typography.multiplier,
  },
  multiplierOn: {
    color: theme.colors.accent,
  },
  embers: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
});
