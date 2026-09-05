import { Pressable, StyleSheet, Text } from "react-native";

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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      hitSlop={theme.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        fullWidth && styles.fullWidth,
        isGhost && styles.ghostButton,
        pressed && styles.pressed,
      ]}
    >
      <Text
        numberOfLines={2}
        style={[styles.label, isGhost && styles.ghostLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: theme.minTapTarget,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  fullWidth: {
    alignSelf: "stretch",
    minHeight: 60,
    paddingVertical: theme.spacing.sm,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.35)",
  },
  label: {
    color: theme.colors.buttonText,
    fontSize: theme.typography.heading,
    fontWeight: "700",
    letterSpacing: 0.4,
    textAlign: "center",
  },
  ghostLabel: {
    color: theme.colors.text,
  },
});
