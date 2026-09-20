import { Pressable, StyleSheet, Text, View } from "react-native";

import { PathLanternMark } from "@/components/PathLanternMark";
import { useGameAudio } from "@/hooks/useGameAudio";
import { formatEmberMultiplier } from "@/lib/economyConfig";
import { theme } from "@/lib/theme";
import type { DifficultyOption } from "@/types/economy";

const PATH_MARK_SIZE = 40;
const PATH_MARK_WELL = 44;

interface DifficultyCardProps {
  option: DifficultyOption;
  selected: boolean;
  onSelect: () => void;
}

export function DifficultyCard({ option, selected, onSelect }: DifficultyCardProps) {
  const multiplierLabel = formatEmberMultiplier(option.emberMultiplier);
  const { playSfx } = useGameAudio();
  const paint = theme.path[option.id];

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
      <View style={[styles.plate, selected ? styles.plateSelected : styles.plateQuiet]}>
        <View style={[styles.pixelHilite, selected && styles.pixelHiliteOn]} />
        {selected ? <View pointerEvents="none" style={styles.selectedRing} /> : null}
        <View
          style={[
            styles.mark,
            { backgroundColor: paint.well, borderColor: paint.rim },
            selected && styles.markSelected,
          ]}
        >
          <View style={selected ? undefined : styles.markQuiet}>
            <PathLanternMark pathId={option.id} selected={selected} size={PATH_MARK_SIZE} />
          </View>
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.name}>
            {option.name}
          </Text>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.description}>
            {option.description}
          </Text>
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
    flex: 1,
    minHeight: theme.minTapTarget,
  },
  pressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  plate: {
    flex: 1,
    minHeight: theme.minTapTarget,
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    padding: theme.stallPlate.padding,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    overflow: "hidden",
  },
  plateQuiet: {
    borderColor: theme.overlay.stallRim,
    backgroundColor: theme.overlay.stall,
  },
  plateSelected: {
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
  selectedRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderWidth: theme.pixel.inset,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
  },
  mark: {
    width: PATH_MARK_WELL,
    height: PATH_MARK_WELL,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  markSelected: {
    borderColor: theme.colors.accent,
  },
  markQuiet: {
    opacity: 0.86,
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
