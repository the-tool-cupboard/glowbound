import { Pressable, StyleSheet, Text, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { theme } from "@/lib/theme";

interface LanternReminderToggleProps {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function LanternReminderToggle({
  enabled,
  disabled = false,
  onToggle,
}: LanternReminderToggleProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={enabled ? "Evening lantern reminder on" : "Evening lantern reminder off"}
      accessibilityHint="Schedules one quiet evening reminder if you have not lit today's lantern. Off by default."
      accessibilityState={{ checked: enabled, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        enabled && styles.rowOn,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.mark, enabled && styles.markOn]}>
        <Ionicons
          name={enabled ? "notifications" : "notifications-off"}
          size={22}
          color={enabled ? theme.colors.accent : theme.colors.textMuted}
          accessible={false}
        />
      </View>
      <View style={styles.copy}>
        <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.title}>
          Evening chime
        </Text>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.meta}>
          {enabled ? "Your lantern waits at dusk" : "Off — no reminders"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: theme.minTapTarget,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    overflow: "hidden",
    borderColor: theme.button3d.rim,
    backgroundColor: theme.overlay.stall,
  },
  rowOn: {
    backgroundColor: theme.colors.backgroundElevated,
    borderColor: theme.colors.accent,
  },
  pressed: {
    opacity: 0.86,
  },
  disabled: {
    opacity: 0.45,
  },
  mark: {
    width: 44,
    height: 44,
    flexShrink: 0,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.path.standard.well,
  },
  markOn: {
    borderColor: theme.path.standard.rim,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.4,
  },
  meta: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
});
