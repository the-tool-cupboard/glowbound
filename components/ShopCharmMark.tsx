import { View } from "react-native";

import { theme } from "@/lib/theme";
import type { PowerUpId } from "@/types/economy";

const CELL = 2;
const GRID = 16;
const CANVAS = CELL * GRID;

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PATH_HINT: readonly PixelRect[] = [
  { x: 1, y: 12, w: 4, h: 3 },
  { x: 4, y: 11, w: 3, h: 2 },
  { x: 6, y: 7, w: 4, h: 3 },
  { x: 9, y: 6, w: 3, h: 2 },
  { x: 11, y: 2, w: 4, h: 3 },
];

const LANTERN_OIL: readonly PixelRect[] = [
  { x: 6, y: 0, w: 4, h: 2 },
  { x: 7, y: 2, w: 2, h: 2 },
  { x: 3, y: 4, w: 10, h: 2 },
  { x: 3, y: 6, w: 2, h: 7 },
  { x: 11, y: 6, w: 2, h: 7 },
  { x: 3, y: 13, w: 10, h: 1 },
  { x: 7, y: 7, w: 2, h: 4 },
  { x: 5, y: 14, w: 6, h: 2 },
];

const SECOND_SIGHT: readonly PixelRect[] = [
  { x: 6, y: 2, w: 4, h: 1 },
  { x: 4, y: 3, w: 2, h: 1 },
  { x: 10, y: 3, w: 2, h: 1 },
  { x: 3, y: 4, w: 2, h: 1 },
  { x: 11, y: 4, w: 2, h: 1 },
  { x: 2, y: 5, w: 2, h: 2 },
  { x: 12, y: 5, w: 2, h: 2 },
  { x: 3, y: 7, w: 2, h: 1 },
  { x: 11, y: 7, w: 2, h: 1 },
  { x: 4, y: 8, w: 2, h: 1 },
  { x: 10, y: 8, w: 2, h: 1 },
  { x: 6, y: 9, w: 4, h: 1 },
  { x: 7, y: 5, w: 2, h: 3 },
];

const WARD: readonly PixelRect[] = [
  { x: 4, y: 1, w: 8, h: 2 },
  { x: 3, y: 3, w: 2, h: 6 },
  { x: 11, y: 3, w: 2, h: 6 },
  { x: 4, y: 9, w: 2, h: 2 },
  { x: 10, y: 9, w: 2, h: 2 },
  { x: 5, y: 11, w: 2, h: 2 },
  { x: 9, y: 11, w: 2, h: 2 },
  { x: 7, y: 13, w: 2, h: 2 },
  { x: 7, y: 4, w: 2, h: 6 },
  { x: 5, y: 6, w: 6, h: 2 },
];

const GLYPHS: Record<PowerUpId, readonly PixelRect[]> = {
  pathHint: PATH_HINT,
  lanternOil: LANTERN_OIL,
  secondSight: SECOND_SIGHT,
  ward: WARD,
};

interface ShopCharmMarkProps {
  itemId: PowerUpId;
  size?: number;
}

export function ShopCharmMark({ itemId, size = CANVAS }: ShopCharmMarkProps) {
  const rects = GLYPHS[itemId];
  const cell = size / GRID;

  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{ width: size, height: size }}
    >
      {rects.map((rect) => (
        <View
          key={`${rect.x}-${rect.y}-${rect.w}-${rect.h}`}
          style={{
            position: "absolute",
            left: rect.x * cell,
            top: rect.y * cell,
            width: rect.w * cell,
            height: rect.h * cell,
            backgroundColor: theme.colors.accent,
          }}
        />
      ))}
    </View>
  );
}
