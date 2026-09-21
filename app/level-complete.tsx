import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { CurrencyBalance } from "@/components/CurrencyBalance";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ShopGoodsDisplay } from "@/components/ShopItemCard";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { SHOP_ITEMS } from "@/lib/economyConfig";
import { canAfford } from "@/lib/economyEngine";
import { MAX_LEVEL } from "@/lib/gameConfig";
import { parseDifficultyParam, parsePlayLevel, parseScoreParam } from "@/lib/routeParams";
import { theme } from "@/lib/theme";

const passBackground = require("../assets/images/game images/GB_Results-Pass.png");

export default function LevelCompleteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    level?: string;
    score?: string;
    startLevel?: string;
    playLevel?: string;
    difficulty?: string;
    shards?: string;
  }>();
  const level = parsePlayLevel(params.level);
  const score = parseScoreParam(params.score);
  const startLevel = parsePlayLevel(params.startLevel);
  const playLevel = parsePlayLevel(params.playLevel, Math.min(MAX_LEVEL, level + 1));
  const shardsEarned = parseScoreParam(params.shards);
  const difficulty = parseDifficultyParam(params.difficulty);
  const { embers, inventory, buyItem, ready } = useGameEconomy();
  const { playSfx } = useGameAudio();
  useScreenMusic("resultsTheme");
  const celebrationPlayedRef = useRef(false);

  useEffect(() => {
    if (celebrationPlayedRef.current) {
      return;
    }
    celebrationPlayedRef.current = true;
    if (shardsEarned > 0) {
      playSfx("emberGain");
    }
  }, [playSfx, shardsEarned]);

  const handleBuy = (id: Parameters<typeof buyItem>[0]) => {
    void buyItem(id).then((result) => {
      playSfx(result.ok ? "purchase" : "purchaseFail");
    });
  };

  const continueRun = () => {
    router.replace({
      pathname: "/game",
      params: {
        startLevel: String(startLevel),
        playLevel: String(playLevel),
        resumeScore: String(score),
        difficulty: String(difficulty),
      },
    });
  };

  return (
    <ScreenContainer style={styles.screen} backgroundSource={passBackground}>
      <View style={styles.skyVeil}>
        <View style={styles.hero}>
          <View style={styles.brand}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              maxFontSizeMultiplier={1.2}
              style={styles.title}
            >
              Level {level} clear.
            </Text>
            <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.copy}>
              You earned {shardsEarned} embers.
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
          label="Continue"
          fullWidth
          accessibilityHint={`Continues this run at level ${playLevel}`}
          onPress={continueRun}
        />
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
    paddingVertical: theme.spacing.md,
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
    backgroundColor: theme.overlay.dock,
  },
});
