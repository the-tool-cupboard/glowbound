import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { CurrencyBalance } from "@/components/CurrencyBalance";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ShopGoodsDisplay } from "@/components/ShopItemCard";
import { StallStatPlate } from "@/components/StallStatPlate";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useGameAudio, useScreenMusic } from "@/hooks/useGameAudio";
import { SHOP_ITEMS } from "@/lib/economyConfig";
import { canAfford } from "@/lib/economyEngine";
import { levelCompleteView } from "@/lib/levelCompleteCopy";
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
  const shardsEarned = parseScoreParam(params.shards);
  const difficulty = parseDifficultyParam(params.difficulty);
  const view = levelCompleteView({
    clearedLevel: level,
    startLevel,
    score,
    shardsEarned,
    difficulty,
  });
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

  return (
    <ScreenContainer style={styles.screen} backgroundSource={passBackground}>
      <View style={styles.skyVeil}>
        {view.journeyComplete ? (
          <View style={styles.finaleBrand}>
            <Text
              accessibilityRole="header"
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              maxFontSizeMultiplier={1.2}
              style={styles.finaleTitle}
            >
              {view.title}
            </Text>
            <Text numberOfLines={3} maxFontSizeMultiplier={1.2} style={styles.copy}>
              {view.copy}
            </Text>
          </View>
        ) : (
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
                {view.title}
              </Text>
              <Text numberOfLines={2} maxFontSizeMultiplier={1.2} style={styles.copy}>
                {view.copy}
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
        )}
      </View>

      <View style={[styles.stage, view.journeyComplete && styles.finaleStage]}>
        {view.journeyComplete ? (
          <View style={styles.stats}>
            <StallStatPlate label="Score" value={score} />
            <StallStatPlate label="Level" value={level} accent />
          </View>
        ) : (
          <ShopGoodsDisplay
            items={SHOP_ITEMS}
            inventory={inventory}
            embers={embers}
            canAfford={canAfford}
            onBuy={handleBuy}
          />
        )}
      </View>

      <View style={styles.dockVeil}>
        {view.actions.map((action) => (
          <PrimaryButton
            key={action.id}
            label={action.label}
            variant={action.variant}
            fullWidth
            accessibilityHint={action.accessibilityHint}
            onPress={() => {
              if (action.id === "continue" || action.id === "retryTrial") {
                router.replace({
                  pathname: "/game",
                  params: action.route.params ?? {},
                });
                return;
              }
              if (action.id === "stages") {
                router.replace("/levels");
                return;
              }
              router.replace("/");
            }}
          />
        ))}
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
  finaleBrand: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.heading,
    ...theme.artTextShadow,
  },
  finaleTitle: {
    color: theme.colors.text,
    ...theme.typography.title,
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
  finaleStage: {
    justifyContent: "center",
    paddingVertical: theme.spacing.sm,
  },
  stats: {
    flexDirection: "row",
    gap: theme.spacing.sm,
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
