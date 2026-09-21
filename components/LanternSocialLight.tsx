import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { LanternGhostImport } from "@/components/LanternGhostImport";
import { LanternGhostRow } from "@/components/LanternGhostRow";
import { PrimaryButton } from "@/components/PrimaryButton";
import type { GhostImportFailure, LanternGhost } from "@/lib/lanternGhosts";
import { theme } from "@/lib/theme";

interface LanternSocialLightProps {
  ready: boolean;
  today: string;
  selfName: string | null;
  ghosts: readonly LanternGhost[];
  whisperTitle: string;
  whisperIsTonight: boolean;
  hideActions?: boolean;
  onChangeName: (name: string) => void;
  onShare: () => void;
  onImport: (raw: string) => Promise<GhostImportFailure | null>;
  onRemoveGhost: (ghostId: string) => void;
}

export function LanternSocialLight({
  ready,
  today,
  selfName,
  ghosts,
  whisperTitle,
  whisperIsTonight,
  hideActions = false,
  onChangeName,
  onShare,
  onImport,
  onRemoveGhost,
}: LanternSocialLightProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<GhostImportFailure | null>(null);
  const [nameDraft, setNameDraft] = useState(selfName ?? "");

  useEffect(() => {
    setNameDraft(selfName ?? "");
  }, [selfName]);

  const whisperLine = whisperIsTonight
    ? `Tonight carries this week's whisper.`
    : `This week whispers ${whisperTitle}.`;

  return (
    <View style={styles.wrap}>
      <Text
        accessible
        accessibilityLabel={whisperLine}
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[styles.whisper, whisperIsTonight && styles.whisperTonight]}
      >
        {whisperLine}
      </Text>
      <LanternGhostRow ghosts={ghosts} today={today} onRemove={ready ? onRemoveGhost : undefined} />
      {hideActions ? null : importOpen ? (
        <LanternGhostImport
          pending={!ready}
          error={importError}
          onCancel={() => {
            setImportOpen(false);
            setImportError(null);
          }}
          onImport={(raw) => {
            void onImport(raw).then((failure) => {
              if (failure == null) {
                setImportOpen(false);
                setImportError(null);
                return;
              }
              setImportError(failure);
            });
          }}
        />
      ) : (
        <View style={styles.actions}>
          <TextInput
            accessibilityLabel="Sign your ghost seal"
            accessibilityHint="Optional name included when you share a ghost seal"
            autoCapitalize="words"
            autoCorrect={false}
            value={nameDraft}
            editable={ready}
            onChangeText={setNameDraft}
            onEndEditing={() => onChangeName(nameDraft)}
            placeholder="Sign as (optional)"
            placeholderTextColor={theme.colors.textMuted}
            style={styles.nameInput}
          />
          <PrimaryButton
            label="Share a ghost seal"
            fullWidth
            accessibilityHint="Opens the share sheet with tonight's streak, chapter, and stars"
            onPress={() => {
              if (!ready) {
                return;
              }
              onChangeName(nameDraft);
              onShare();
            }}
          />
          <PrimaryButton
            label="Import a friend's ghost"
            variant="ghost"
            fullWidth
            accessibilityHint="Opens a paste field for a GBG1 ghost seal"
            onPress={() => {
              if (!ready) {
                return;
              }
              setImportError(null);
              setImportOpen(true);
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: theme.spacing.sm,
  },
  whisper: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
    ...theme.artTextShadow,
  },
  whisperTonight: {
    color: theme.colors.accent,
  },
  actions: {
    gap: theme.spacing.xs,
  },
  nameInput: {
    minHeight: 44,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.overlay.stallRim,
    backgroundColor: theme.overlay.stall,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.sm,
    ...theme.typography.caption,
  },
});
