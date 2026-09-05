import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import type { PowerUpId, ShopItem } from "@/types/economy";

const ITEM_MARK: Record<PowerUpId, string> = {
  pathHint: "H",
  lanternOil: "O",
  secondSight: "S",
  ward: "W",
};

interface ShopItemCardProps {
  item: ShopItem;
  owned: number;
  canAfford: boolean;
  instantBuy?: boolean;
  onBuy: () => void;
}

export function ShopItemCard({
  item,
  owned,
  canAfford,
  instantBuy = false,
  onBuy,
}: ShopItemCardProps) {
  const lastTapRef = useRef(0);
  const primeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    return () => {
      if (primeTimerRef.current != null) {
        clearTimeout(primeTimerRef.current);
      }
    };
  }, []);

  const buy = useCallback(() => {
    if (!canAfford) {
      return;
    }

    setPrimed(false);
    lastTapRef.current = 0;
    onBuy();
  }, [canAfford, onBuy]);

  const onPress = () => {
    if (!canAfford) {
      return;
    }

    if (instantBuy) {
      buy();
      return;
    }

    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (primeTimerRef.current != null) {
        clearTimeout(primeTimerRef.current);
        primeTimerRef.current = null;
      }
      buy();
      return;
    }

    lastTapRef.current = now;
    setPrimed(true);
    if (primeTimerRef.current != null) {
      clearTimeout(primeTimerRef.current);
    }
    primeTimerRef.current = setTimeout(() => {
      setPrimed(false);
      primeTimerRef.current = null;
    }, 320);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.description}, ${item.cost} embers, ${owned} owned`}
      accessibilityHint={
        canAfford
          ? instantBuy
            ? "Buys this charm"
            : "Double tap this charm to buy it"
          : "Not enough embers"
      }
      accessibilityState={{ disabled: !canAfford }}
      disabled={!canAfford}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        !canAfford && styles.tileLocked,
        primed && styles.tilePrimed,
        pressed && canAfford && styles.pressed,
      ]}
    >
      <View style={[styles.mark, !canAfford && styles.markLocked]}>
        <Text style={styles.markLabel}>{ITEM_MARK[item.id]}</Text>
      </View>
      <Text style={[styles.name, !canAfford && styles.muted]}>{item.name}</Text>
      <Text style={[styles.description, !canAfford && styles.muted]}>{item.description}</Text>
      <Text style={[styles.cost, !canAfford && styles.muted]}>{item.cost}</Text>
      <Text style={[styles.owned, !canAfford && styles.muted]} accessibilityLabel={`${owned} owned`}>
        {owned} owned
      </Text>
    </Pressable>
  );
}

export function ShopGoodsDisplay({
  items,
  inventory,
  embers,
  canAfford,
  onBuy,
}: {
  items: readonly ShopItem[];
  inventory: Record<PowerUpId, number>;
  embers: number;
  canAfford: (embers: number, cost: number) => boolean;
  onBuy: (id: PowerUpId) => void;
}) {
  const [instantBuy, setInstantBuy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (!cancelled) {
        setInstantBuy(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener("screenReaderChanged", setInstantBuy);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return (
    <View style={styles.stall}>
      <View style={styles.shelf}>
        {items.map((item) => (
          <ShopItemCard
            key={item.id}
            item={item}
            owned={inventory[item.id]}
            canAfford={canAfford(embers, item.cost)}
            instantBuy={instantBuy}
            onBuy={() => onBuy(item.id)}
          />
        ))}
      </View>
      <Text style={styles.hint}>
        {instantBuy ? "Tap a charm to buy it." : "Double tap a charm to buy it."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stall: {
    flex: 1,
    justifyContent: "center",
    gap: theme.spacing.md,
  },
  shelf: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  tile: {
    flexBasis: "46%",
    flexGrow: 1,
    maxWidth: "48%",
    minHeight: 168,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: 6,
  },
  tileLocked: {
    opacity: 0.45,
    borderColor: "rgba(196, 184, 150, 0.12)",
  },
  tilePrimed: {
    borderColor: theme.colors.accent,
    transform: [{ scale: 1.03 }],
  },
  pressed: {
    opacity: 0.9,
  },
  mark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(230, 195, 92, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(230, 195, 92, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  markLocked: {
    borderColor: "rgba(196, 184, 150, 0.2)",
    backgroundColor: "rgba(61, 74, 92, 0.4)",
  },
  markLabel: {
    color: theme.colors.accent,
    fontSize: 22,
    fontWeight: "700",
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontWeight: "700",
    textAlign: "center",
  },
  description: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    paddingHorizontal: 2,
  },
  cost: {
    color: theme.colors.accent,
    fontSize: theme.typography.heading,
    fontWeight: "700",
  },
  owned: {
    color: theme.colors.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  muted: {
    color: theme.colors.textMuted,
  },
  hint: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textAlign: "center",
    letterSpacing: 0.4,
  },
});
