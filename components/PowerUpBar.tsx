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
            <Text style={[styles.label, itemDisabled && styles.labelOff]}>
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
    flexWrap: "wrap",
    justifyContent: "center",
    gap: theme.spacing.xs,
  },
  chip: {
    minHeight: 44,
    minWidth: 68,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.4)",
    backgroundColor: theme.colors.backgroundElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOff: {
    opacity: 0.45,
    borderColor: "rgba(196, 184, 150, 0.16)",
  },
  pressed: {
    opacity: 0.86,
  },
  label: {
    color: theme.colors.text,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  count: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  labelOff: {
    color: theme.colors.textMuted,
  },
});
