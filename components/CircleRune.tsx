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

const FILL_BY_STATE: Record<RuneVisualState, string> = {
  inactive: theme.colors.idle,
  previewTarget: theme.colors.preview,
  selected: theme.colors.selected,
  correct: theme.colors.correct,
  incorrect: theme.colors.wrong,
};

function stateLabel(visualState: RuneVisualState): string {
  switch (visualState) {
    case "previewTarget":
      return "glowing";
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rune ${runeNumber}, ${stateLabel(visualState)}`}
      accessibilityState={{
        disabled,
        selected: visualState === "selected" || visualState === "correct",
      }}
      disabled={disabled}
      hitSlop={theme.hitSlop}
      onPress={() => onPress(cellId)}
      style={({ pressed }) => [
        styles.hitTarget,
        { width: size, height: size },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fill,
          },
          visualState === "inactive" && styles.inactiveBorder,
          visualState === "previewTarget" && styles.glow,
          visualState === "correct" && styles.correctGlow,
          visualState === "incorrect" && styles.failGlow,
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    borderWidth: 1,
    borderColor: "transparent",
  },
  inactiveBorder: {
    borderColor: theme.colors.idleBorder,
  },
  glow: {
    shadowColor: theme.colors.preview,
    shadowOpacity: 0.85,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
    borderColor: "rgba(230, 195, 92, 0.55)",
  },
  correctGlow: {
    shadowColor: theme.colors.correct,
    shadowOpacity: 0.75,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    borderColor: "rgba(61, 220, 151, 0.5)",
  },
  failGlow: {
    shadowColor: theme.colors.wrong,
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    borderColor: "rgba(224, 122, 106, 0.6)",
  },
  pressed: {
    opacity: 0.88,
  },
});
