import { StyleSheet, Text, View } from "react-native";
import { useIsFocused, useRouter } from "expo-router";

import { CurrencyBalance } from "@/components/CurrencyBalance";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ShopGoodsDisplay } from "@/components/ShopItemCard";
import { useAnimatedBackgrounds } from "@/hooks/useAnimatedBackgrounds";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { SHOP_ITEMS } from "@/lib/economyConfig";
import { canAfford } from "@/lib/economyEngine";
import { theme } from "@/lib/theme";

const menuBackground = require("../assets/images/game images/GB_Menu-Background.png");
const menuVideo = require("../assets/video/GB_Menu-Background.mp4");

export default function ShopScreen() {
  const router = useRouter();
  const { embers, inventory, buyItem, ready } = useGameEconomy();
  const { playSfx } = useGameAudio();
  const { enabled: animatedBackgrounds } = useAnimatedBackgrounds();
  const focused = useIsFocused();
  useScreenMusic("menuTheme");

  const handleBuy = (id: Parameters<typeof buyItem>[0]) => {
    void buyItem(id).then((result) => {
      playSfx(result.ok ? "purchase" : "purchaseFail");
    });
  };

  return (
    <ScreenContainer
      style={styles.screen}
      backgroundSource={menuBackground}
      backgroundVideo={menuVideo}
      playBackgroundVideo={animatedBackgrounds && focused}
    >
      <View style={styles.skyVeil}>
        <View style={styles.hero}>
          <View style={styles.brand}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}
              style={styles.title}
            >
              Shop
            </Text>
            <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.copy}>
              Spend embers on charms. You can hold 3 of each.
            </Text>
          </View>
          <CurrencyBalance
            embers={embers}
            align="right"
            accessible
            onArt
            compact
            chip
            pending={!ready}
          />
        </View>
      </View>

      <View style={styles.stage}>
        <ShopGoodsDisplay
          items={SHOP_ITEMS}
          inventory={inventory}
          embers={embers}
          canAfford={canAfford}
          onBuy={handleBuy}
        />
      </View>

      <View style={styles.dockVeil}>
        <PrimaryButton
          label="Return Home"
          variant="ghost"
          fullWidth
          accessibilityHint="Returns to the home screen"
          onPress={() => router.replace("/")}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: "100%",
  },
  skyVeil: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.overlay.sky,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
  },
  brand: {
    flex: 1,
    minWidth: 0,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
    ...theme.artTextShadow,
  },
  copy: {
    color: theme.colors.textMuted,
    ...theme.typography.caption,
    ...theme.artTextShadow,
  },
  stage: {
    flex: 1,
    minHeight: 0,
    width: "100%",
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.overlay.dock,
  },
});
