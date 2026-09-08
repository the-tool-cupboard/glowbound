import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import { PixelSlider } from "@/components/PixelSlider";
import { theme } from "@/lib/theme";

type AudioChannel = "music" | "sfx";

interface AudioMuteBarProps {
  musicVolume: number;
  sfxVolume: number;
  disabled?: boolean;
  onChangeMusicVolume: (volume: number) => void;
  onChangeSfxVolume: (volume: number) => void;
  onPreviewSfx?: () => void;
}

interface VolumeIconProps {
  volume: number;
  open: boolean;
  disabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  mutedIcon: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
}

function VolumeIcon({
  volume,
  open,
  disabled,
  icon,
  mutedIcon,
  accessibilityLabel,
  onPress,
}: VolumeIconProps) {
  const muted = volume <= 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={
        open
          ? "Closes the volume slider"
          : "Opens the volume slider"
      }
      accessibilityState={{ expanded: open, disabled }}
      disabled={disabled}
      hitSlop={theme.hitSlop}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconHit,
        open && styles.iconHitOpen,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons
        name={muted ? mutedIcon : icon}
        size={22}
        color={muted ? theme.colors.textMuted : theme.colors.accent}
        accessible={false}
      />
    </Pressable>
  );
}

export function AudioMuteBar({
  musicVolume,
  sfxVolume,
  disabled = false,
  onChangeMusicVolume,
  onChangeSfxVolume,
  onPreviewSfx,
}: AudioMuteBarProps) {
  const [open, setOpen] = useState<AudioChannel | null>(null);

  const toggle = (channel: AudioChannel) => {
    setOpen((current) => (current === channel ? null : channel));
    onPreviewSfx?.();
  };

  return (
    <View style={styles.row}>
      <VolumeIcon
        volume={musicVolume}
        open={open === "music"}
        disabled={disabled}
        icon="musical-notes"
        mutedIcon="musical-notes-outline"
        accessibilityLabel="Camp song volume"
        onPress={() => toggle("music")}
      />
      {open === "music" ? (
        <PixelSlider
          value={musicVolume}
          accessibilityLabel="Camp song volume"
          disabled={disabled}
          onChange={onChangeMusicVolume}
        />
      ) : null}
      <VolumeIcon
        volume={sfxVolume}
        open={open === "sfx"}
        disabled={disabled}
        icon="sparkles"
        mutedIcon="sparkles-outline"
        accessibilityLabel="Rune effects volume"
        onPress={() => toggle("sfx")}
      />
      {open === "sfx" ? (
        <PixelSlider
          value={sfxVolume}
          accessibilityLabel="Rune effects volume"
          disabled={disabled}
          onChange={onChangeSfxVolume}
          onDragPreview={onPreviewSfx}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    width: "100%",
    minHeight: theme.minTapTarget,
    flexShrink: 1,
  },
  iconHit: {
    width: theme.minTapTarget,
    height: theme.minTapTarget,
    minWidth: theme.minTapTarget,
    minHeight: theme.minTapTarget,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    borderRadius: theme.radius.pixel,
    backgroundColor: theme.colors.backgroundElevated,
  },
  iconHitOpen: {
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
