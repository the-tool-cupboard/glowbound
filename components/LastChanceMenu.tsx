import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/lib/theme";
import type { Inventory, PowerUpId } from "@/types/economy";

interface LastChanceMenuProps {
  visible: boolean;
  inventory: Inventory;
  title?: string;
  question?: string;
  onUseItem: (id: PowerUpId) => void;
  onDecline: () => void;
}

export function LastChanceMenu({
  visible,
  inventory,
  title,
  question,
  onUseItem,
  onDecline,
}: LastChanceMenuProps) {
  if (!visible) {
    return null;
  }

  const hasWard = inventory.ward > 0;

  return (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityRole="alert">
      <View style={styles.card}>
        <Text style={styles.title}>{title ?? "Wrong rune"}</Text>
        <Text style={styles.question}>
          {question ??
            (hasWard
              ? "A Rune Ward can ignore this miss and let you keep going."
              : "You have no Rune Ward left.")}
        </Text>
        {hasWard ? (
          <PrimaryButton
            label="Use Rune Ward"
            fullWidth
            accessibilityHint="Consumes one Rune Ward and continues this run"
            onPress={() => onUseItem("ward")}
          />
        ) : null}
        <PrimaryButton
          label="End run"
          variant="ghost"
          fullWidth
          accessibilityHint="Ends this run and shows your results"
          onPress={onDecline}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(7, 11, 22, 0.78)",
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
    zIndex: 4,
  },
  card: {
    width: "100%",
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.pixel,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderWidth: theme.pixel.outline,
    borderColor: theme.colors.wrong,
    gap: theme.spacing.md,
    overflow: "hidden",
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
  },
  question: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
});
