import { Pressable, StyleSheet } from "react-native";

import { GemFace } from "./GemFace";
import { idleColorsForLayout } from "@/lib/runeIdleColors";
import { runeGemShapeForLayout } from "@/lib/runeGemShape";
import { theme } from "@/lib/theme";
import type { CellId, LayoutId, RuneVisualState } from "@/types/game";

interface CircleRuneProps {
  cellId: CellId;
  size: number;
  visualState: RuneVisualState;
  disabled: boolean;
  onPress: (cellId: CellId) => void;
  hitSlop?: number;
  layoutId?: LayoutId;
}

/** Visible gem as a fraction of the layout cell. 0.88 reads larger than 0.78 without filling the cell. */
export const GEM_SCALE = 0.88;

const IDLE_OUTLINE = theme.pixel.outline + 1;

type ActiveRuneVisualState = Exclude<RuneVisualState, "inactive">;

const FILL_BY_STATE: Record<ActiveRuneVisualState, string> = {
  previewTarget: theme.colors.preview,
  previewGlint: theme.colors.previewGlint,
  previewGhost: theme.colors.previewGhost,
  emberCooled: theme.colors.idleCooled,
  selected: theme.colors.selected,
  correct: theme.colors.correct,
  incorrect: theme.colors.wrong,
};

const BORDER_BY_STATE: Record<ActiveRuneVisualState, string> = {
  previewTarget: theme.button3d.rim,
  previewGlint: "rgba(42, 31, 10, 0.55)",
  previewGhost: "rgba(110, 138, 168, 0.7)",
  emberCooled: theme.colors.idleCooledBorder,
  selected: "#1A5C42",
  correct: "#1A5C42",
  incorrect: "#6B2E28",
};

function colorsForVisualState(
  visualState: RuneVisualState,
  layoutId: LayoutId
): { fill: string; border: string } {
  if (visualState === "inactive") {
    return idleColorsForLayout(layoutId);
  }

  return {
    fill: FILL_BY_STATE[visualState],
    border: BORDER_BY_STATE[visualState],
  };
}

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

function isResting(visualState: RuneVisualState): boolean {
  return visualState === "inactive" || visualState === "emberCooled";
}

export function CircleRune({
  cellId,
  size,
  visualState,
  disabled,
  onPress,
  hitSlop = 0,
  layoutId = "grid",
}: CircleRuneProps) {
  const { fill, border: borderColor } = colorsForVisualState(visualState, layoutId);
  const runeNumber = cellId + 1;
  const gemSize = size * GEM_SCALE;
  const resting = isResting(visualState);
  const shape = runeGemShapeForLayout(layoutId);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rune ${runeNumber}, ${stateLabel(visualState)}`}
      accessibilityState={{
        disabled,
        selected: visualState === "selected" || visualState === "correct",
      }}
      disabled={disabled}
      hitSlop={hitSlop}
      onPress={() => onPress(cellId)}
      style={({ pressed }) => [
        styles.hitTarget,
        { width: size, height: size },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <GemFace
        shape={shape}
        size={gemSize}
        fill={fill}
        borderColor={borderColor}
        borderWidth={resting ? IDLE_OUTLINE : theme.pixel.outline}
        resting={resting}
        clipId={`rune-gem-${cellId}`}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    transform: [{ translateY: 1 }],
    opacity: 0.92,
  },
});
