import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { getRuneVisualState, isInputEnabled } from "@/lib/gameEngine";
import { runeBoardMetrics, runeHitSlop } from "@/lib/runeLayouts";
import { theme } from "@/lib/theme";
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
  const metrics = useMemo(
    () => runeBoardMetrics(layout.points, boardSize),
    [boardSize, layout.points]
  );
  const usable = Math.max(0, boardSize - metrics.cellSize);
  const inputEnabled = isInputEnabled(phase);
  const hitSlop = runeHitSlop(metrics.cellSize, metrics.neighborGap, theme.minTapTarget);
  const platePad = theme.boardPlate.padding;
  const snapshot = useMemo(
    () => ({
      phase,
      targetCellIds,
      selectedCellIds,
      hintCellIds,
      previewCellIds,
      glintCellIds,
      ghostCellIds,
      wrongCellId,
      cooledBoard,
    }),
    [
      cooledBoard,
      ghostCellIds,
      glintCellIds,
      hintCellIds,
      phase,
      previewCellIds,
      selectedCellIds,
      targetCellIds,
      wrongCellId,
    ]
  );
  const cells = useMemo(
    () =>
      layout.points.map((point, cellId) => ({
        cellId,
        left: point.x * usable,
        top: point.y * usable,
      })),
    [layout.points, usable]
  );

  return (
    <View
      style={[styles.board, { width: boardSize, height: boardSize }]}
      accessibilityLabel={`${layout.name} rune board`}
    >
      <View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.plate,
          {
            top: -platePad,
            right: -platePad,
            bottom: -platePad,
            left: -platePad,
          },
        ]}
      />
      {cells.map(({ cellId, left, top }) => (
        <View
          key={cellId}
          style={[styles.cell, { width: metrics.cellSize, height: metrics.cellSize, left, top }]}
        >
          <CircleRune
            cellId={cellId}
            size={metrics.cellSize}
            layoutId={layout.id}
            visualState={getRuneVisualState(cellId, snapshot)}
            disabled={!inputEnabled}
            hitSlop={hitSlop}
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
  plate: {
    position: "absolute",
    backgroundColor: theme.overlay.board,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.boardRim,
  },
  cell: {
    position: "absolute",
  },
});
