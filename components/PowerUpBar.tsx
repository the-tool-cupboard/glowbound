import { Pressable, StyleSheet, Text, View } from "react-native";

import { SHOP_ITEMS } from "@/lib/economyConfig";
import { theme } from "@/lib/theme";
import type { Inventory, PowerUpId } from "@/types/economy";

interface PowerUpBarProps {
  inventory: Inventory;
  disabled: boolean;
  wardArmed: boolean;
  onUse: (id: PowerUpId) => void;
}

const SHORT_LABEL: Record<PowerUpId, string> = {
  pathHint: "Hint",
  lanternOil: "Oil",
  secondSight: "Sight",
  ward: "Ward",
};

export function PowerUpBar({ inventory, disabled, wardArmed, onUse }: PowerUpBarProps) {
  return (
    <View style={styles.row} accessibilityLabel="Charms">
      {SHOP_ITEMS.map((item) => {
        const count = inventory[item.id];
        const itemDisabled = disabled || count <= 0 || (item.id === "ward" && wardArmed);

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Use ${item.name}, ${count} owned`}
            accessibilityState={{ disabled: itemDisabled }}
            disabled={itemDisabled}
            onPress={() => onUse(item.id)}
            style={({ pressed }) => [
              styles.chip,
              itemDisabled && styles.chipOff,
              pressed && !itemDisabled && styles.pressed,
            ]}
          >
            <Text numberOfLines={1} style={[styles.label, itemDisabled && styles.labelOff]}>
              {SHORT_LABEL[item.id]}
            </Text>
            <Text style={[styles.count, itemDisabled && styles.labelOff]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    width: "100%",
    gap: theme.spacing.xs,
  },
  chip: {
    flex: 1,
    minWidth: 0,
    minHeight: theme.minTapTarget,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    backgroundColor: theme.colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  chipOff: {
    opacity: 0.45,
    borderColor: "rgba(196, 184, 150, 0.28)",
  },
  pressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  label: {
    color: theme.colors.text,
    ...theme.typography.overline,
  },
  count: {
    color: theme.colors.accent,
    ...theme.typography.overline,
  },
  labelOff: {
    color: theme.colors.textMuted,
  },
});
