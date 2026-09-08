import { Pressable, StyleSheet, Text, View } from "react-native";

import { useGameAudio } from "@/hooks/useGameAudio";
import { theme } from "@/lib/theme";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  accessibilityHint?: string;
  variant?: "primary" | "ghost";
  fullWidth?: boolean;
}

export function PrimaryButton({
  label,
  onPress,
  accessibilityHint,
  variant = "primary",
  fullWidth = false,
}: PrimaryButtonProps) {
  const isGhost = variant === "ghost";
  const { playSfx } = useGameAudio();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={theme.hitSlop}
      onPress={() => {
        playSfx("uiTap");
        onPress();
      }}
      style={({ pressed }) => [
        styles.root,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
      ]}
    >
      {({ pressed }) =>
        isGhost ? (
          <View style={styles.ghostOuter}>
            <View style={[styles.ghostFace, pressed && styles.ghostFacePressed]}>
              <View style={[styles.pixelHilite, pressed && styles.pixelHilitePressed]} />
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                maxFontSizeMultiplier={1.2}
                style={styles.ghostLabel}
              >
                {label}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.outer}>
            <View style={styles.shade}>
              <View style={[styles.face, pressed && styles.facePressed]}>
                <View style={[styles.pixelHilite, pressed && styles.pixelHilitePressed]} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                  maxFontSizeMultiplier={1.2}
                  style={styles.label}
                >
                  {label}
                </Text>
              </View>
            </View>
          </View>
        )
      }
    </Pressable>
  );
}

const BUTTON_HEIGHT = theme.minTapTarget;

const styles = StyleSheet.create({
  root: {
    height: BUTTON_HEIGHT,
    minHeight: BUTTON_HEIGHT,
    maxHeight: BUTTON_HEIGHT,
  },
  fullWidth: {
    alignSelf: "stretch",
    width: "100%",
  },
  pressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  outer: {
    flex: 1,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
  },
  shade: {
    flex: 1,
    borderRadius: theme.radius.pixel - 1,
    backgroundColor: theme.button3d.shade,
    paddingBottom: theme.pixel.shade - 1,
    overflow: "hidden",
  },
  face: {
    flex: 1,
    borderRadius: theme.radius.pixel - 1,
    backgroundColor: theme.button3d.face,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    overflow: "hidden",
  },
  facePressed: {
    backgroundColor: theme.button3d.facePressed,
    paddingTop: theme.pixel.inset,
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: theme.button3d.highlight,
  },
  pixelHilitePressed: {
    backgroundColor: theme.button3d.shade,
    opacity: 0.55,
  },
  label: {
    ...theme.typography.button,
    color: theme.colors.buttonText,
    textAlign: "center",
    width: "100%",
    letterSpacing: 0.8,
    textShadowColor: "rgba(255, 245, 204, 0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
  },
  ghostOuter: {
    flex: 1,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    overflow: "hidden",
  },
  ghostFace: {
    flex: 1,
    borderRadius: theme.radius.pixel - 1,
    backgroundColor: theme.button3d.ghostFace,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    borderWidth: theme.pixel.inset,
    borderTopColor: theme.button3d.ghostRimHighlight,
    borderLeftColor: theme.button3d.ghostRimHighlight,
    borderBottomColor: theme.button3d.ghostRimShade,
    borderRightColor: theme.button3d.ghostRimShade,
    overflow: "hidden",
  },
  ghostFacePressed: {
    paddingTop: theme.pixel.inset,
    borderTopColor: theme.button3d.ghostRimShade,
    borderLeftColor: theme.button3d.ghostRimShade,
  },
  ghostLabel: {
    ...theme.typography.button,
    color: theme.colors.text,
    textAlign: "center",
    width: "100%",
    letterSpacing: 0.8,
    ...theme.artTextShadow,
  },
});
