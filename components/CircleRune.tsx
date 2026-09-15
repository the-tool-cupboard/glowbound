import { Pressable, StyleSheet, View } from "react-native";

import { theme } from "@/lib/theme";
import type { CellId, RuneVisualState } from "@/types/game";

interface CircleRuneProps {
  cellId: CellId;
  size: number;
  visualState: RuneVisualState;
  disabled: boolean;
  onPress: (cellId: CellId) => void;
}

const GEM_SCALE = 0.78;

const FILL_BY_STATE: Record<RuneVisualState, string> = {
  inactive: theme.colors.idle,
  previewTarget: theme.colors.preview,
  previewGlint: theme.colors.previewGlint,
  previewGhost: theme.colors.previewGhost,
  emberCooled: theme.colors.idleCooled,
  selected: theme.colors.selected,
  correct: theme.colors.correct,
  incorrect: theme.colors.wrong,
};

const BORDER_BY_STATE: Record<RuneVisualState, string> = {
  inactive: theme.colors.idleBorder,
  previewTarget: theme.button3d.rim,
  previewGlint: "rgba(42, 31, 10, 0.55)",
  previewGhost: "rgba(110, 138, 168, 0.7)",
  emberCooled: theme.colors.idleCooledBorder,
  selected: "#1A5C42",
  correct: "#1A5C42",
  incorrect: "#6B2E28",
};

function stateLabel(visualState: RuneVisualState): string {
  switch (visualState) {
    case "previewTarget":
      return "glowing";
    case "previewGlint":
      return "glinting";
    case "previewGhost":
      return "ghost";
    case "emberCooled":
      return "cooled";
    case "selected":
      return "chosen";
    case "correct":
      return "correct";
    case "incorrect":
      return "wrong";
    default:
      return "idle";
  }
}

export function CircleRune({
  cellId,
  size,
  visualState,
  disabled,
  onPress,
}: CircleRuneProps) {
  const fill = FILL_BY_STATE[visualState];
  const runeNumber = cellId + 1;
  const gemSize = size * GEM_SCALE;
  const gemRadius = theme.radius.pixel;
  const lit = visualState !== "inactive" && visualState !== "emberCooled";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rune ${runeNumber}, ${stateLabel(visualState)}`}
      accessibilityState={{
        disabled,
        selected: visualState === "selected" || visualState === "correct",
      }}
      disabled={disabled}
      hitSlop={0}
      onPress={() => onPress(cellId)}
      style={({ pressed }) => [
        styles.hitTarget,
        { width: size, height: size },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.gem,
          {
            width: gemSize,
            height: gemSize,
            borderRadius: gemRadius,
            backgroundColor: fill,
            borderColor: BORDER_BY_STATE[visualState],
          },
        ]}
      >
        {lit ? <View style={styles.pixelHilite} /> : null}
        {lit ? <View style={styles.pixelShade} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  gem: {
    borderWidth: theme.pixel.outline,
    overflow: "hidden",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(255, 245, 204, 0.45)",
  },
  pixelShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: theme.pixel.shade,
    backgroundColor: "rgba(10, 11, 15, 0.28)",
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.92,
  },
});
