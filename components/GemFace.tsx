import { StyleSheet, View } from "react-native";
import Svg, { Circle, ClipPath, Defs, G, Polygon, Rect } from "react-native-svg";

import {
  formatPolygonPoints,
  gemPolygonPoints,
  gemStrokeInset,
  type RuneGemShape,
} from "@/lib/runeGemShape";
import { theme } from "@/lib/theme";

interface GemFaceProps {
  shape: RuneGemShape;
  size: number;
  fill: string;
  borderColor: string;
  borderWidth: number;
  resting: boolean;
  clipId: string;
}

const HILITE = "rgba(255, 245, 204, 0.45)";
const SHADE = "rgba(10, 11, 15, 0.28)";

export function GemFace({
  shape,
  size,
  fill,
  borderColor,
  borderWidth,
  resting,
  clipId,
}: GemFaceProps) {
  if (shape === "square") {
    return (
      <View
        style={[
          styles.gem,
          {
            width: size,
            height: size,
            borderRadius: theme.radius.pixel,
            backgroundColor: fill,
            borderColor,
            borderWidth,
          },
        ]}
      >
        {resting ? null : (
          <>
            <View style={styles.pixelHilite} />
            <View style={styles.pixelShade} />
          </>
        )}
      </View>
    );
  }

  const inset = gemStrokeInset(borderWidth);
  const hilite = resting ? null : (
    <G clipPath={`url(#${clipId})`}>
      <Rect x={0} y={0} width={size} height={theme.pixel.inset} fill={HILITE} />
      <Rect
        x={0}
        y={size - theme.pixel.shade}
        width={size}
        height={theme.pixel.shade}
        fill={SHADE}
      />
    </G>
  );

  if (shape === "circle") {
    const radius = Math.max(0.5, size / 2 - inset);
    const center = size / 2;
    return (
      <Svg width={size} height={size} pointerEvents="none">
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={center} cy={center} r={radius} />
          </ClipPath>
        </Defs>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill={fill}
          stroke={borderColor}
          strokeWidth={borderWidth}
        />
        {hilite}
      </Svg>
    );
  }

  const points = formatPolygonPoints(gemPolygonPoints(shape, size, inset));
  const roundJoin = shape === "triangle";

  return (
    <Svg width={size} height={size} pointerEvents="none">
      <Defs>
        <ClipPath id={clipId}>
          <Polygon points={points} />
        </ClipPath>
      </Defs>
      <Polygon
        points={points}
        fill={fill}
        stroke={borderColor}
        strokeWidth={borderWidth}
        strokeLinejoin={roundJoin ? "round" : "miter"}
        strokeMiterlimit={2}
      />
      {hilite}
    </Svg>
  );
}

const styles = StyleSheet.create({
  gem: {
    overflow: "hidden",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: HILITE,
  },
  pixelShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: theme.pixel.shade,
    backgroundColor: SHADE,
  },
});
