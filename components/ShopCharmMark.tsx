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

interface GlyphPaint {
  fill: string;
  accent: string;
  hilite: string;
  shade: string;
  well: string;
}

export const CHARM_GLYPH_PAINT: Record<PowerUpId, GlyphPaint> = {
  pathHint: {
    fill: "#E09A3A",
    accent: "#F6C56A",
    hilite: "rgba(255, 214, 140, 0.55)",
    shade: "rgba(90, 42, 8, 0.32)",
    well: "rgba(224, 154, 58, 0.18)",
  },
  lanternOil: {
    fill: "#E8B43C",
    accent: "#FFE08A",
    hilite: "rgba(255, 245, 204, 0.55)",
    shade: "rgba(90, 50, 8, 0.3)",
    well: "rgba(232, 180, 60, 0.18)",
  },
  secondSight: {
    fill: "#C5D0E4",
    accent: "#8A9BB8",
    hilite: "rgba(245, 250, 255, 0.55)",
    shade: "rgba(40, 52, 72, 0.32)",
    well: "rgba(197, 208, 228, 0.18)",
  },
  ward: {
    fill: "#6BA89A",
    accent: "#8EC4B6",
    hilite: "rgba(200, 236, 220, 0.45)",
    shade: "rgba(16, 40, 36, 0.32)",
    well: "rgba(107, 168, 154, 0.18)",
  },
};

const PATH_HINT: readonly PixelRect[] = [
  { x: 1, y: 12, w: 4, h: 3 },
  { x: 4, y: 11, w: 3, h: 2 },
  { x: 6, y: 7, w: 4, h: 3 },
  { x: 9, y: 6, w: 3, h: 2 },
  { x: 11, y: 2, w: 4, h: 3 },
];

const PATH_HINT_ACCENT: readonly PixelRect[] = [{ x: 11, y: 2, w: 4, h: 3 }];

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

const LANTERN_OIL_ACCENT: readonly PixelRect[] = [
  { x: 6, y: 0, w: 4, h: 2 },
  { x: 7, y: 2, w: 2, h: 2 },
  { x: 7, y: 7, w: 2, h: 4 },
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

const SECOND_SIGHT_ACCENT: readonly PixelRect[] = [{ x: 7, y: 5, w: 2, h: 3 }];

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

const WARD_ACCENT: readonly PixelRect[] = [
  { x: 7, y: 4, w: 2, h: 6 },
  { x: 5, y: 6, w: 6, h: 2 },
];

const GLYPHS: Record<PowerUpId, readonly PixelRect[]> = {
  pathHint: PATH_HINT,
  lanternOil: LANTERN_OIL,
  secondSight: SECOND_SIGHT,
  ward: WARD,
};

const GLYPH_ACCENTS: Record<PowerUpId, readonly PixelRect[]> = {
  pathHint: PATH_HINT_ACCENT,
  lanternOil: LANTERN_OIL_ACCENT,
  secondSight: SECOND_SIGHT_ACCENT,
  ward: WARD_ACCENT,
};

function rectKey(rect: PixelRect): string {
  return `${rect.x}-${rect.y}-${rect.w}-${rect.h}`;
}

function PixelBlob({
  rect,
  cell,
  fill,
  hilite,
  shade,
}: {
  rect: PixelRect;
  cell: number;
  fill: string;
  hilite: string;
  shade: string;
}) {
  const width = rect.w * cell;
  const height = rect.h * cell;
  const showFacet = height >= cell * 1.5;
  const hiliteHeight = Math.min(theme.pixel.inset, Math.max(1, height * 0.32));
  const shadeHeight = Math.min(theme.pixel.shade, Math.max(1, height * 0.38));

  return (
    <View
      style={{
        position: "absolute",
        left: rect.x * cell,
        top: rect.y * cell,
        width,
        height,
        backgroundColor: fill,
        overflow: "hidden",
      }}
    >
      {showFacet ? (
        <>
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: hiliteHeight,
              backgroundColor: hilite,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: shadeHeight,
              backgroundColor: shade,
            }}
          />
        </>
      ) : null}
    </View>
  );
}

interface ShopCharmMarkProps {
  itemId: PowerUpId;
  size?: number;
}

export function ShopCharmMark({ itemId, size = CANVAS }: ShopCharmMarkProps) {
  const paint = CHARM_GLYPH_PAINT[itemId];
  const rects = GLYPHS[itemId];
  const accents = new Set(GLYPH_ACCENTS[itemId].map(rectKey));
  const cell = size / GRID;

  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      style={{ width: size, height: size }}
    >
      {rects.map((rect) => (
        <PixelBlob
          key={rectKey(rect)}
          rect={rect}
          cell={cell}
          fill={accents.has(rectKey(rect)) ? paint.accent : paint.fill}
          hilite={paint.hilite}
          shade={paint.shade}
        />
      ))}
    </View>
  );
}
