import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Pressable, StyleSheet, Text, View } from "react-native";

import { ShopCharmMark } from "@/components/ShopCharmMark";
import { theme } from "@/lib/theme";
import { MAX_OWNED_PER_ITEM } from "@/lib/economyConfig";
import { isInventoryFull } from "@/lib/economyEngine";
import type { Inventory, PowerUpId, ShopItem } from "@/types/economy";

const BUY_FLASH_MS = 520;

interface ShopItemCardProps {
  item: ShopItem;
  owned: number;
  embers: number;
  canAfford: boolean;
  atCap: boolean;
  instantBuy?: boolean;
  onBuy: () => void;
}

export function ShopItemCard({
  item,
  owned,
  embers,
  canAfford,
  atCap,
  instantBuy = false,
  onBuy,
}: ShopItemCardProps) {
  const lastTapRef = useRef(0);
  const primeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [primed, setPrimed] = useState(false);
  const [boughtFlash, setBoughtFlash] = useState(false);

  useEffect(() => {
    return () => {
      if (primeTimerRef.current != null) {
        clearTimeout(primeTimerRef.current);
      }
      if (flashTimerRef.current != null) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  const flashBought = useCallback(() => {
    setBoughtFlash(true);
    if (flashTimerRef.current != null) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setBoughtFlash(false);
      flashTimerRef.current = null;
    }, BUY_FLASH_MS);
  }, []);

  const buy = useCallback(() => {
    if (!canAfford || atCap) {
      return;
    }

    setPrimed(false);
    lastTapRef.current = 0;
    flashBought();
    onBuy();
  }, [atCap, canAfford, flashBought, onBuy]);

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
  const unaffordable = !canAfford && !atCap;
  const shortfall = Math.max(0, item.cost - embers);
  const hint = atCap
    ? `You already own the maximum of ${MAX_OWNED_PER_ITEM}`
    : canAfford
      ? instantBuy
        ? "Buys this charm"
        : "Double tap this charm to buy it"
      : shortfall > 0
        ? `Need ${shortfall} more embers`
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
        atCap && styles.tileCapped,
        primed && styles.tilePrimed,
        boughtFlash && styles.tileBought,
        pressed && !locked && styles.pressed,
      ]}
    >
      {primed ? <View pointerEvents="none" style={styles.primeRing} /> : null}
      <View style={styles.mark}>
        <ShopCharmMark itemId={item.id} />
        {atCap ? <View pointerEvents="none" style={styles.ownedPip} /> : null}
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <View style={styles.costBlock} accessibilityElementsHidden>
        {unaffordable ? (
          <Text style={styles.needMore}>Need {shortfall} more</Text>
        ) : (
          <>
            <Text style={styles.costValue}>{item.cost}</Text>
            <Text style={styles.costLabel}>embers</Text>
          </>
        )}
      </View>
      <Text style={styles.owned} accessibilityLabel={`${owned} of ${MAX_OWNED_PER_ITEM} owned`}>
        {atCap ? `Max ${MAX_OWNED_PER_ITEM}` : `${owned} owned`}
      </Text>
      {boughtFlash ? (
        <View pointerEvents="none" style={styles.successFlash}>
          <View style={styles.tick}>
            <View style={styles.tickShort} />
            <View style={styles.tickLong} />
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

export function ShopGoodsDisplay({
  items,
  inventory,
  embers,
  canAfford,
  onBuy,
  showHint = true,
}: {
  items: readonly ShopItem[];
  inventory: Inventory;
  embers: number;
  canAfford: (embers: number, cost: number) => boolean;
  onBuy: (id: PowerUpId) => void;
  showHint?: boolean;
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
            embers={embers}
            canAfford={canAfford(embers, item.cost)}
            atCap={isInventoryFull(inventory, item.id)}
            instantBuy={instantBuy}
            onBuy={() => onBuy(item.id)}
          />
        ))}
      </View>
      {showHint ? (
        <Text style={styles.hint}>
          {instantBuy ? "Tap a charm to buy it." : "Double tap a charm to buy it. Max 3 of each."}
        </Text>
      ) : null}
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
  tileCapped: {
    borderColor: theme.colors.accent,
  },
  tilePrimed: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(230, 195, 92, 0.18)",
  },
  tileBought: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(230, 195, 92, 0.28)",
  },
  primeRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 4,
    borderWidth: theme.pixel.inset,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.pixel,
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
    overflow: "hidden",
  },
  ownedPip: {
    position: "absolute",
    right: 3,
    bottom: 3,
    width: 8,
    height: 8,
    backgroundColor: theme.colors.accent,
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
  costBlock: {
    alignItems: "center",
    gap: 2,
    minHeight: 34,
    justifyContent: "center",
  },
  costValue: {
    color: theme.colors.accent,
    fontVariant: ["tabular-nums"],
    ...theme.typography.overline,
  },
  costLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  needMore: {
    color: theme.colors.textMuted,
    textAlign: "center",
    ...theme.typography.overline,
  },
  owned: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  successFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(230, 195, 92, 0.42)",
    alignItems: "center",
    justifyContent: "center",
  },
  tick: {
    width: 28,
    height: 28,
  },
  tickShort: {
    position: "absolute",
    left: 4,
    top: 14,
    width: 10,
    height: 4,
    backgroundColor: theme.colors.buttonText,
    transform: [{ rotate: "-45deg" }],
  },
  tickLong: {
    position: "absolute",
    left: 8,
    top: 10,
    width: 18,
    height: 4,
    backgroundColor: theme.colors.buttonText,
    transform: [{ rotate: "45deg" }],
  },
  hint: {
    color: theme.colors.textMuted,
    textAlign: "center",
    ...theme.typography.caption,
  },
});
