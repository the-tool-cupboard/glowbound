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
  { x: 6, y: 0, w: 4, h: 2 },
  { x: 7, y: 2, w: 2, h: 2 },
  { x: 2, y: 4, w: 12, h: 2 },
  { x: 2, y: 6, w: 3, h: 6 },
  { x: 11, y: 6, w: 3, h: 6 },
  { x: 2, y: 12, w: 12, h: 2 },
  { x: 4, y: 14, w: 8, h: 2 },
];

const GLASS: readonly PixelRect[] = [{ x: 5, y: 6, w: 6, h: 6 }];

const FLAME: readonly PixelRect[] = [
  { x: 7, y: 6, w: 2, h: 5 },
  { x: 6, y: 8, w: 4, h: 3 },
];

const FLAME_LIT: readonly PixelRect[] = [
  { x: 7, y: 5, w: 2, h: 6 },
  { x: 6, y: 7, w: 4, h: 4 },
  { x: 5, y: 8, w: 6, h: 2 },
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
  const flameRects = selected ? FLAME_LIT : FLAME;
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
      {GLASS.map((rect) => (
        <PixelBlob key={`glass-${rectKey(rect)}`} rect={rect} cell={cell} fill={paint.well} />
      ))}
      {flameRects.map((rect) => (
        <PixelBlob key={`flame-${rectKey(rect)}`} rect={rect} cell={cell} fill={flame} />
      ))}
    </View>
  );
}
