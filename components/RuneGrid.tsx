import { StyleSheet, View } from "react-native";

import { getRuneVisualState, isInputEnabled } from "@/lib/gameEngine";
import { runeCellSize } from "@/lib/runeLayouts";
import type { CellId, GamePhase, RuneLayout } from "@/types/game";

import { CircleRune } from "./CircleRune";

interface RuneGridProps {
  layout: RuneLayout;
  slotWidth: number;
  slotHeight: number;
  phase: GamePhase;
  targetCellIds: readonly CellId[];
  selectedCellIds: readonly CellId[];
  hintCellIds?: readonly CellId[];
  previewCellIds?: readonly CellId[];
  glintCellIds?: readonly CellId[];
  ghostCellIds?: readonly CellId[];
  wrongCellId: CellId | null;
  cooledBoard?: boolean;
  onRunePress: (cellId: CellId) => void;
}

function cellSizeForBoard(layout: RuneLayout, boardSize: number): number {
  return runeCellSize(layout.points, boardSize);
}

export function RuneGrid({
  layout,
  slotWidth,
  slotHeight,
  phase,
  targetCellIds,
  selectedCellIds,
  hintCellIds = [],
  previewCellIds,
  glintCellIds = [],
  ghostCellIds = [],
  wrongCellId,
  cooledBoard = false,
  onRunePress,
}: RuneGridProps) {
  const boardSize = Math.max(0, Math.min(slotWidth, slotHeight));
  const cellSize = cellSizeForBoard(layout, boardSize);
  const usable = Math.max(0, boardSize - cellSize);
  const inputEnabled = isInputEnabled(phase);

  return (
    <View
      style={[styles.board, { width: boardSize, height: boardSize }]}
      accessibilityLabel={`${layout.name} rune board`}
    >
      {layout.points.map((point, cellId) => (
        <View
          key={cellId}
          style={{
            position: "absolute",
            width: cellSize,
            height: cellSize,
            left: point.x * usable,
            top: point.y * usable,
          }}
        >
          <CircleRune
            cellId={cellId}
            size={cellSize}
            visualState={getRuneVisualState(cellId, {
              phase,
              targetCellIds,
              selectedCellIds,
              hintCellIds,
              previewCellIds,
              glintCellIds,
              ghostCellIds,
              wrongCellId,
              cooledBoard,
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
  board: {
    position: "relative",
  },
});
