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
import { theme } from "@/lib/theme";

function asCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function asScore(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

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
  const level = asCount(params.level) || 1;
  const score = asScore(params.score);
  const startLevel = asCount(params.startLevel) || 1;
  const playLevel = asCount(params.playLevel) || level + 1;
  const shardsEarned = asScore(params.shards);
  const difficulty = params.difficulty ?? "standard";
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
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Level {level} complete</Text>
        <Text style={styles.copy}>You earned {shardsEarned} embers.</Text>
        <CurrencyBalance embers={embers} pending={!ready} />
      </View>

      <ShopGoodsDisplay
        items={SHOP_ITEMS}
        inventory={inventory}
        embers={embers}
        canAfford={canAfford}
        onBuy={handleBuy}
      />

      <View style={styles.actions}>
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
  hero: {
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    color: theme.colors.text,
    ...theme.typography.title,
  },
  copy: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
  },
  actions: {
    width: "100%",
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
