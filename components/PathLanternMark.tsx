import { View } from "react-native";

import { theme } from "@/lib/theme";
import type { DifficultyId } from "@/types/economy";

const GRID = 16;

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const FRAME: readonly PixelRect[] = [
  { x: 7, y: 0, w: 2, h: 1 },
  { x: 7, y: 1, w: 2, h: 2 },
  { x: 5, y: 3, w: 6, h: 1 },
  { x: 4, y: 4, w: 8, h: 1 },
  { x: 3, y: 5, w: 2, h: 7 },
  { x: 11, y: 5, w: 2, h: 7 },
  { x: 4, y: 12, w: 8, h: 1 },
  { x: 5, y: 13, w: 6, h: 1 },
  { x: 6, y: 14, w: 4, h: 1 },
];

const FLAME: readonly PixelRect[] = [
  { x: 7, y: 6, w: 2, h: 4 },
  { x: 6, y: 7, w: 4, h: 2 },
];

function rectKey(rect: PixelRect): string {
  return `${rect.x}-${rect.y}-${rect.w}-${rect.h}`;
}

function PixelBlob({
  rect,
  cell,
  fill,
}: {
  rect: PixelRect;
  cell: number;
  fill: string;
}) {
  return (
    <View
      style={{
        position: "absolute",
        left: rect.x * cell,
        top: rect.y * cell,
        width: rect.w * cell,
        height: rect.h * cell,
        backgroundColor: fill,
      }}
    />
  );
}

interface PathLanternMarkProps {
  pathId: DifficultyId;
  selected?: boolean;
  size?: number;
}

export function PathLanternMark({
  pathId,
  selected = false,
  size = GRID * 2,
}: PathLanternMarkProps) {
  const paint = theme.path[pathId];
  const cell = size / GRID;
  const flame = selected ? paint.flameLit : paint.flame;

  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{ width: size, height: size }}
    >
      {FRAME.map((rect) => (
        <PixelBlob key={rectKey(rect)} rect={rect} cell={cell} fill={paint.metal} />
      ))}
      {FLAME.map((rect) => (
        <PixelBlob key={rectKey(rect)} rect={rect} cell={cell} fill={flame} />
      ))}
    </View>
  );
}
