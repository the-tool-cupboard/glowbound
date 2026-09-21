import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ghostImportFailureCopy, type GhostImportFailure } from "@/lib/lanternGhosts";
import { theme } from "@/lib/theme";

interface LanternGhostImportProps {
  pending?: boolean;
  onImport: (raw: string) => void;
  onCancel: () => void;
  error?: GhostImportFailure | null;
}

export function LanternGhostImport({
  pending = false,
  onImport,
  onCancel,
  error = null,
}: LanternGhostImportProps) {
  const [draft, setDraft] = useState("");

  return (
    <View
      accessible={false}
      accessibilityLabel="Import a friend's ghost seal"
      style={styles.plate}
    >
      <View style={styles.pixelHilite} />
      <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.title}>
        Import a friend's ghost
      </Text>
      <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.body}>
        Paste their GBG1 seal. It only stands beside yours — no scores compared.
      </Text>
      <TextInput
        accessibilityLabel="Friend ghost seal"
        accessibilityHint="Paste a GBG1 lantern ghost code"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        multiline
        value={draft}
        editable={!pending}
        onChangeText={setDraft}
        placeholder="GBG1|…"
        placeholderTextColor={theme.colors.textMuted}
        style={styles.input}
      />
      {error != null ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {ghostImportFailureCopy(error)}
        </Text>
      ) : null}
      <PrimaryButton
        label="Light their ghost"
        fullWidth
        accessibilityHint="Saves this friend's lantern beside yours"
        onPress={() => onImport(draft)}
      />
      <PrimaryButton
        label="Not now"
        variant="ghost"
        fullWidth
        accessibilityHint="Closes the import plate"
        onPress={onCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.outline,
    borderColor: theme.overlay.stallRim,
    padding: theme.stallPlate.padding,
    gap: theme.spacing.sm,
    overflow: "hidden",
  },
  pixelHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: "rgba(196, 184, 150, 0.16)",
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
  },
  body: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  input: {
    minHeight: 72,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.overlay.stallRim,
    backgroundColor: "rgba(11, 18, 32, 0.55)",
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    ...theme.typography.caption,
    textAlignVertical: "top",
  },
  error: {
    color: theme.colors.wrong,
    ...theme.typography.caption,
  },
});
