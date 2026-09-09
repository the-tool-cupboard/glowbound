import { StyleSheet, View } from "react-native";

import { theme } from "@/lib/theme";

const CELL = 2;
const CANVAS = CELL * 16;

interface PixelRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const STALL: readonly PixelRect[] = [
  { x: 6, y: 0, w: 4, h: 1 },
  { x: 4, y: 1, w: 8, h: 1 },
  { x: 1, y: 2, w: 14, h: 2 },
  { x: 1, y: 4, w: 2, h: 1 },
  { x: 5, y: 4, w: 2, h: 1 },
  { x: 9, y: 4, w: 2, h: 1 },
  { x: 13, y: 4, w: 2, h: 1 },
  { x: 2, y: 5, w: 2, h: 8 },
  { x: 12, y: 5, w: 2, h: 8 },
  { x: 7, y: 5, w: 2, h: 2 },
  { x: 6, y: 7, w: 4, h: 3 },
  { x: 1, y: 13, w: 14, h: 2 },
];

export function ShopStallMark() {
  return (
    <View accessible={false} importantForAccessibility="no" style={styles.canvas}>
      {STALL.map((rect) => (
        <View
          key={`${rect.x}-${rect.y}-${rect.w}-${rect.h}`}
          style={{
            position: "absolute",
            left: rect.x * CELL,
            top: rect.y * CELL,
            width: rect.w * CELL,
            height: rect.h * CELL,
            backgroundColor: theme.colors.accent,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: CANVAS,
    height: CANVAS,
  },
});
