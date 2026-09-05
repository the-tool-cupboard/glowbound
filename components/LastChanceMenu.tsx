import { StyleSheet, Text, View } from "react-native";

import { PowerUpBar } from "@/components/PowerUpBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/lib/theme";
import type { Inventory, PowerUpId } from "@/types/economy";

interface LastChanceMenuProps {
  visible: boolean;
  inventory: Inventory;
  onUseItem: (id: PowerUpId) => void;
  onDecline: () => void;
}

export function LastChanceMenu({
  visible,
  inventory,
  onUseItem,
  onDecline,
}: LastChanceMenuProps) {
  if (!visible) {
    return null;
  }

  const hasItems = Object.values(inventory).some((count) => count > 0);

  return (
    <View style={styles.overlay} accessibilityViewIsModal accessibilityRole="alert">
      <View style={styles.card}>
        <Text style={styles.title}>Wrong rune</Text>
        <Text style={styles.question}>
          {hasItems
            ? "Use a charm to continue, or end this run."
            : "You have no charms left."}
        </Text>
        {hasItems ? (
          <PowerUpBar
            inventory={inventory}
            disabled={false}
            wardArmed={false}
            onUse={onUseItem}
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
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(224, 122, 106, 0.35)",
    gap: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: "700",
  },
  question: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
});
