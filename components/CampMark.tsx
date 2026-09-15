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

const TENT: readonly PixelRect[] = [
  { x: 7, y: 1, w: 2, h: 1 },
  { x: 6, y: 2, w: 4, h: 1 },
  { x: 5, y: 3, w: 6, h: 1 },
  { x: 4, y: 4, w: 8, h: 1 },
  { x: 3, y: 5, w: 10, h: 1 },
  { x: 2, y: 6, w: 12, h: 2 },
  { x: 2, y: 8, w: 2, h: 6 },
  { x: 12, y: 8, w: 2, h: 6 },
  { x: 7, y: 8, w: 2, h: 6 },
  { x: 2, y: 14, w: 12, h: 1 },
];

export function CampMark() {
  return (
    <View accessible={false} importantForAccessibility="no" style={styles.canvas}>
      {TENT.map((rect) => (
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
