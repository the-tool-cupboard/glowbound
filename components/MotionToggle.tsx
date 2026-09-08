import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/lib/theme";

interface MotionToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function MotionToggle({ enabled, disabled = false, onToggle }: MotionToggleProps) {
  return (
    <View style={styles.slot}>
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={enabled ? "Animated backgrounds on" : "Animated backgrounds off"}
        accessibilityHint="Switches the camp between a looping video and a still painting"
        accessibilityState={{ checked: enabled, disabled }}
        disabled={disabled}
        hitSlop={theme.hitSlop}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.hit,
          enabled && styles.hitOn,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}
      >
        <Ionicons
          name={enabled ? "film" : "image"}
          size={22}
          color={enabled ? theme.colors.accent : theme.colors.textMuted}
          accessible={false}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: theme.minTapTarget,
    height: theme.minTapTarget,
    flexGrow: 0,
    flexShrink: 0,
  },
  hit: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    borderRadius: theme.radius.pixel,
    backgroundColor: theme.colors.backgroundElevated,
  },
  hitOn: {
    backgroundColor: "#1C2438",
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
});
