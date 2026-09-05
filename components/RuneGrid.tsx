import { StyleSheet, View } from "react-native";

import { useScreenMetrics } from "@/components/ScreenContainer";
import { getRuneVisualState, isInputEnabled } from "@/lib/gameEngine";
import { theme } from "@/lib/theme";
import type { CellId, GamePhase } from "@/types/game";

import { CircleRune } from "./CircleRune";

interface RuneGridProps {
  gridSize: number;
  phase: GamePhase;
  targetCellIds: readonly CellId[];
  selectedCellIds: readonly CellId[];
  hintCellIds?: readonly CellId[];
  wrongCellId: CellId | null;
  onRunePress: (cellId: CellId) => void;
}

export function RuneGrid({
  gridSize,
  phase,
  targetCellIds,
  selectedCellIds,
  hintCellIds = [],
  wrongCellId,
  onRunePress,
}: RuneGridProps) {
  const { width, height } = useScreenMetrics();
  const availableWidth = Math.max(width, 0);
  const availableHeight = Math.max(height * 0.58, 180);
  const maxGrid = Math.min(availableWidth, availableHeight);
  const gap = gridSize >= 5 ? theme.spacing.sm : theme.spacing.md;
  const cellSize = Math.max(0, (maxGrid - gap * (gridSize - 1)) / gridSize);
  const gridWidth = cellSize * gridSize + gap * (gridSize - 1);
  const inputEnabled = isInputEnabled(phase);
  const cells = Array.from({ length: gridSize * gridSize }, (_, cellId) => cellId);

  return (
    <View
      style={[styles.grid, { width: gridWidth, gap }]}
      accessibilityLabel="Rune grid"
    >
      {cells.map((cellId) => (
        <View key={cellId} style={{ width: cellSize, height: cellSize }}>
          <CircleRune
            cellId={cellId}
            size={cellSize}
            visualState={getRuneVisualState(cellId, {
              phase,
              targetCellIds,
              selectedCellIds,
              hintCellIds,
              wrongCellId,
            })}
            disabled={!inputEnabled}
            onPress={onRunePress}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignSelf: "center",
  },
});
