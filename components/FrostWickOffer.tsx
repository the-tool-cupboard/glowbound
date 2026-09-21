import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { ShopCharmMark } from "@/components/ShopCharmMark";
import { theme } from "@/lib/theme";

interface FrostWickOfferProps {
  streak: number;
  freezeOwned: number;
  pending?: boolean;
  onUse: () => void;
  onDecline: () => void;
}

export function FrostWickOffer({
  streak,
  freezeOwned,
  pending = false,
  onUse,
  onDecline,
}: FrostWickOfferProps) {
  const wickLabel = freezeOwned === 1 ? "1 Frost Wick" : `${freezeOwned} Frost Wicks`;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`The lantern dimmed. Use a Frost Wick to hold streak ${streak}. You have ${wickLabel}.`}
      style={styles.plate}
    >
      <View style={styles.pixelHilite} />
      <View style={styles.header}>
        <View style={styles.mark}>
          <ShopCharmMark itemId="frostWick" size={48} />
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} maxFontSizeMultiplier={1.2} style={styles.title}>
            The lantern dimmed.
          </Text>
          <Text numberOfLines={3} maxFontSizeMultiplier={1.2} style={styles.body}>
            Use a Frost Wick to hold streak {streak}. You have {wickLabel}.
          </Text>
        </View>
      </View>
      <PrimaryButton
        label="Use Frost Wick"
        fullWidth
        accessibilityHint="Consumes one Frost Wick and keeps your Night Lantern streak"
        onPress={onUse}
      />
      <PrimaryButton
        label="Let it fade"
        variant="ghost"
        fullWidth
        accessibilityHint="Lets the streak reset to zero"
        onPress={onDecline}
      />
      {pending ? <Text style={styles.pending}>Holding the wick…</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.outline,
    borderColor: theme.colors.accent,
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
    backgroundColor: theme.button3d.highlight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  mark: {
    width: 56,
    height: 56,
    flexShrink: 0,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: "#7EB4D6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(126, 180, 214, 0.18)",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
  },
  body: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
  },
  pending: {
    color: theme.colors.accent,
    textAlign: "center",
    ...theme.typography.overline,
  },
});
