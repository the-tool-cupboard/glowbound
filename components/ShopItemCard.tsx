import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { theme } from "@/lib/theme";
import { MAX_OWNED_PER_ITEM } from "@/lib/economyConfig";
import { isInventoryFull } from "@/lib/economyEngine";
import type { Inventory, PowerUpId, ShopItem } from "@/types/economy";

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
  atCap: boolean;
  instantBuy?: boolean;
  onBuy: () => void;
}

export function ShopItemCard({
  item,
  owned,
  canAfford,
  atCap,
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
    if (!canAfford || atCap) {
      return;
    }

    setPrimed(false);
    lastTapRef.current = 0;
    onBuy();
  }, [atCap, canAfford, onBuy]);

  const onPress = () => {
    if (!canAfford || atCap) {
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

  const locked = !canAfford || atCap;
  const hint = atCap
    ? `You already own the maximum of ${MAX_OWNED_PER_ITEM}`
    : canAfford
      ? instantBuy
        ? "Buys this charm"
        : "Double tap this charm to buy it"
      : "Not enough embers";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.description}, ${item.cost} embers, ${owned} of ${MAX_OWNED_PER_ITEM} owned`}
      accessibilityHint={hint}
      accessibilityState={{ disabled: locked }}
      disabled={locked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        locked && styles.tileLocked,
        primed && styles.tilePrimed,
        pressed && !locked && styles.pressed,
      ]}
    >
      <View style={[styles.mark, locked && styles.markLocked]}>
        <Text style={styles.markLabel}>{ITEM_MARK[item.id]}</Text>
      </View>
      <Text style={[styles.name, locked && styles.muted]}>{item.name}</Text>
      <Text style={[styles.description, locked && styles.muted]}>{item.description}</Text>
      <Text style={[styles.cost, locked && styles.muted]}>{item.cost} embers</Text>
      <Text style={[styles.owned, locked && styles.muted]} accessibilityLabel={`${owned} of ${MAX_OWNED_PER_ITEM} owned`}>
        {atCap ? `Max ${MAX_OWNED_PER_ITEM}` : `${owned} owned`}
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
  inventory: Inventory;
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
            atCap={isInventoryFull(inventory, item.id)}
            instantBuy={instantBuy}
            onBuy={() => onBuy(item.id)}
          />
        ))}
      </View>
      <Text style={styles.hint}>
        {instantBuy ? "Tap a charm to buy it." : "Double tap a charm to buy it. Max 3 of each."}
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
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: theme.button3d.rim,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: 6,
    overflow: "hidden",
  },
  tileLocked: {
    opacity: 0.45,
    borderColor: "rgba(196, 184, 150, 0.28)",
  },
  tilePrimed: {
    borderColor: theme.colors.accent,
    backgroundColor: "#1C2438",
  },
  pressed: {
    transform: [{ translateY: theme.pixel.inset }],
  },
  mark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pixel,
    backgroundColor: "rgba(230, 195, 92, 0.16)",
    borderWidth: theme.pixel.outline,
    borderColor: theme.colors.accent,
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
    ...theme.typography.heading,
  },
  name: {
    color: theme.colors.text,
    textAlign: "center",
    ...theme.typography.heading,
  },
  description: {
    color: theme.colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 2,
    ...theme.typography.caption,
  },
  cost: {
    color: theme.colors.accent,
    fontVariant: ["tabular-nums"],
    ...theme.typography.multiplier,
  },
  owned: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  hint: {
    color: theme.colors.textMuted,
    textAlign: "center",
    ...theme.typography.caption,
  },
});
