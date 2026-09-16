import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CHARM_GLYPH_PAINT, ShopCharmMark } from "@/components/ShopCharmMark";
import { theme } from "@/lib/theme";
import { MAX_OWNED_PER_ITEM } from "@/lib/economyConfig";
import { isInventoryFull } from "@/lib/economyEngine";
import type { Inventory, PowerUpId, ShopItem } from "@/types/economy";

const BUY_FLASH_MS = 720;
const PRIME_WINDOW_MS = 650;
const SHOP_MARK_SIZE = 56;

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
    if (now - lastTapRef.current < PRIME_WINDOW_MS) {
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
    }, PRIME_WINDOW_MS);
  };

  const locked = !canAfford || atCap;
  const unaffordable = !canAfford && !atCap;
  const shortfall = Math.max(0, item.cost - embers);
  const paint = CHARM_GLYPH_PAINT[item.id];
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
        unaffordable && styles.tileUnaffordable,
        atCap && styles.tileCapped,
        primed && styles.tilePrimed,
        boughtFlash && styles.tileBought,
        pressed && !locked && styles.pressed,
      ]}
    >
      {primed ? (
        <>
          <View pointerEvents="none" style={styles.primeHilite} />
          <View pointerEvents="none" style={styles.primeRing} />
        </>
      ) : null}
      <View
        style={[
          styles.mark,
          { backgroundColor: paint.well, borderColor: paint.fill },
          unaffordable && styles.markUnaffordable,
          atCap && styles.markCapped,
        ]}
      >
        <View style={unaffordable ? styles.markDim : undefined}>
          <ShopCharmMark itemId={item.id} size={SHOP_MARK_SIZE} />
        </View>
        {atCap ? <View pointerEvents="none" style={styles.ownedPip} /> : null}
      </View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[styles.name, unaffordable && styles.copyDim]}
      >
        {item.name}
      </Text>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[styles.description, unaffordable && styles.copyDim]}
      >
        {item.description}
      </Text>
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
      <Text
        style={[styles.owned, atCap && styles.ownedCapped]}
        accessibilityLabel={`${owned} of ${MAX_OWNED_PER_ITEM} owned`}
      >
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
    // react-native-web always resolves isScreenReaderEnabled to true, which would
    // skip the double-tap confirm on every desktop preview. Native VoiceOver /
    // TalkBack still use the instant-buy path below.
    if (Platform.OS === "web") {
      setInstantBuy(false);
      return;
    }

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
      <View pointerEvents="box-none" style={styles.plate}>
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
            {instantBuy ? "Tap a charm to buy." : "Double-tap a charm to buy. Max 3 of each."}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stall: {
    flex: 1,
    justifyContent: "center",
  },
  plate: {
    backgroundColor: theme.overlay.stall,
    borderRadius: theme.radius.lg,
    borderWidth: theme.pixel.inset,
    borderColor: theme.overlay.stallRim,
    padding: theme.stallPlate.padding,
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
    minHeight: 188,
    backgroundColor: theme.colors.backgroundElevated,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    borderColor: "rgba(196, 184, 150, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    gap: 6,
    overflow: "hidden",
  },
  tileUnaffordable: {
    borderColor: "rgba(196, 184, 150, 0.2)",
    backgroundColor: "#10182A",
  },
  tileCapped: {
    borderColor: theme.colors.accent,
  },
  tilePrimed: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(230, 195, 92, 0.22)",
  },
  tileBought: {
    borderColor: theme.colors.accent,
    backgroundColor: "rgba(230, 195, 92, 0.28)",
  },
  primeHilite: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: theme.pixel.inset,
    backgroundColor: theme.button3d.highlight,
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
    width: 64,
    height: 64,
    borderRadius: theme.radius.pixel,
    borderWidth: theme.pixel.outline,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    overflow: "hidden",
  },
  markUnaffordable: {
    borderColor: "rgba(196, 184, 150, 0.28)",
    backgroundColor: "rgba(196, 184, 150, 0.08)",
  },
  markCapped: {
    borderColor: theme.colors.accent,
  },
  markDim: {
    opacity: 0.45,
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
  copyDim: {
    color: "rgba(196, 184, 150, 0.72)",
  },
  costBlock: {
    alignItems: "center",
    gap: 2,
    minHeight: 38,
    justifyContent: "center",
  },
  costValue: {
    color: theme.colors.accent,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.4,
    lineHeight: 22,
    fontVariant: ["tabular-nums"],
  },
  costLabel: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  needMore: {
    color: theme.colors.text,
    textAlign: "center",
    ...theme.typography.overline,
  },
  owned: {
    color: theme.colors.textMuted,
    ...theme.typography.overline,
  },
  ownedCapped: {
    color: theme.colors.accent,
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
    ...theme.artTextShadow,
  },
});
