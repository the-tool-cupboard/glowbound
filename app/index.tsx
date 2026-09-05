import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { CurrencyBalance } from "@/components/CurrencyBalance";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useHighScore } from "@/hooks/useHighScore";
import { theme } from "@/lib/theme";

const menuBackground = require("../assets/images/game images/GB_Menu-Background.png");

export default function HomeScreen() {
  const router = useRouter();
  const { highScore, ready: scoreReady } = useHighScore();
  const { embers, ready: economyReady } = useGameEconomy();

  return (
    <ScreenContainer style={styles.screen} backgroundSource={menuBackground}>
      <View style={styles.skyVeil}>
        <View style={styles.status}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              economyReady ? `Shop, ${embers} embers` : "Shop, loading embers"
            }
            accessibilityHint="Opens the ember shop"
            accessibilityState={{ busy: !economyReady }}
            hitSlop={theme.hitSlop}
            onPress={() => router.push("/shop")}
            style={({ pressed }) => [styles.shopHit, pressed && styles.pressed]}
          >
            <View style={!economyReady ? styles.pendingValue : undefined}>
              <CurrencyBalance embers={embers} align="left" accessible={false} onArt />
            </View>
            <View style={styles.shopMark} />
          </Pressable>
          <View
            style={styles.highScore}
            accessibilityLabel={scoreReady ? `Best score ${highScore}` : "Best score loading"}
          >
            <Text style={styles.scoreLabel}>Best Score</Text>
            <Text style={[styles.scoreValue, !scoreReady && styles.pendingValue]}>
              {scoreReady ? highScore : " "}
            </Text>
          </View>
        </View>

        <View style={styles.brand}>
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            maxFontSizeMultiplier={1.3}
            style={styles.title}
          >
            Glowbound
          </Text>
          <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            Follow the lantern. Remember the runes. Restore the kingdom.
          </Text>
        </View>
      </View>

      <View style={styles.stage} pointerEvents="none" accessible={false} />

      <View style={styles.dockVeil}>
        <PrimaryButton
          label="Begin Journey"
          fullWidth
          accessibilityHint="Opens difficulty selection, then starts from the Sleeping Woods"
          onPress={() => router.push("/difficulty")}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Levels"
          accessibilityHint="Opens chapters you can start from"
          hitSlop={theme.hitSlop}
          onPress={() => router.push("/levels")}
          style={({ pressed }) => [styles.levelsHit, pressed && styles.pressed]}
        >
          <Text style={styles.levelsLabel}>Levels</Text>
        </Pressable>
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
  status: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  shopHit: {
    minHeight: theme.minTapTarget,
    minWidth: theme.minTapTarget,
    justifyContent: "center",
    flexShrink: 1,
  },
  shopMark: {
    width: 28,
    height: 1,
    marginTop: 4,
    backgroundColor: theme.colors.accent,
    opacity: 0.7,
  },
  highScore: {
    alignItems: "flex-end",
    justifyContent: "center",
    minWidth: 88,
    minHeight: theme.minTapTarget,
    gap: 4,
  },
  scoreLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    ...theme.artTextShadow,
  },
  scoreValue: {
    color: theme.colors.text,
    fontSize: theme.typography.heading,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    ...theme.artTextShadow,
  },
  pendingValue: {
    opacity: 0.35,
  },
  brand: {
    alignItems: "center",
    width: "100%",
    marginTop: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.display,
    fontWeight: "700",
    letterSpacing: -1.2,
    textAlign: "center",
    ...theme.artTextShadow,
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 2 },
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    lineHeight: 18,
    textAlign: "center",
    alignSelf: "stretch",
    paddingHorizontal: theme.spacing.sm,
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
    gap: theme.spacing.xs,
  },
  levelsHit: {
    minHeight: theme.minTapTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  levelsLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontWeight: "600",
    letterSpacing: 0.4,
    ...theme.artTextShadow,
  },
  pressed: {
    opacity: 0.86,
  },
});
