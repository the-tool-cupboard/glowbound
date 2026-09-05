import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { CurrencyBalance } from "@/components/CurrencyBalance";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ShopGoodsDisplay } from "@/components/ShopItemCard";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { SHOP_ITEMS } from "@/lib/economyConfig";
import { canAfford } from "@/lib/economyEngine";
import { theme } from "@/lib/theme";

export default function ShopScreen() {
  const router = useRouter();
  const { embers, inventory, buyItem } = useGameEconomy();

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Shop</Text>
        <Text style={styles.copy}>Spend embers on charms.</Text>
        <CurrencyBalance embers={embers} />
      </View>

      <ShopGoodsDisplay
        items={SHOP_ITEMS}
        inventory={inventory}
        embers={embers}
        canAfford={canAfford}
        onBuy={(id) => {
          void buyItem(id);
        }}
      />

      <PrimaryButton
        label="Return Home"
        variant="ghost"
        fullWidth
        accessibilityHint="Returns to the home screen"
        onPress={() => router.replace("/")}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
  },
  hero: {
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: "center",
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "700",
    letterSpacing: -0.8,
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
});
