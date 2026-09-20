import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { DifficultyCard } from "@/components/DifficultyCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { useScreenMusic } from "@/hooks/useGameAudio";
import { DIFFICULTIES } from "@/lib/economyConfig";
import { isDifficultyId } from "@/lib/economyEngine";
import { theme } from "@/lib/theme";
import type { DifficultyId } from "@/types/economy";

const pathBackground = require("../assets/images/game images/GB_Difficulty-Background.png");

function asCount(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export default function DifficultyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ startLevel?: string }>();
  const startLevel = asCount(params.startLevel) || 1;
  const { difficulty, ready, setDifficulty } = useGameEconomy();
  const [selected, setSelected] = useState<DifficultyId>("standard");
  useScreenMusic("menuTheme");

  useEffect(() => {
    if (ready && isDifficultyId(difficulty)) {
      setSelected(difficulty);
    }
  }, [difficulty, ready]);

  const selectedName =
    DIFFICULTIES.find((option) => option.id === selected)?.name ?? "Standard";

  const begin = () => {
    void setDifficulty(selected);
    router.push({
      pathname: "/game",
      params: {
        startLevel: String(startLevel),
        difficulty: selected,
      },
    });
  };

  return (
    <ScreenContainer style={styles.screen} backgroundSource={pathBackground}>
      <View style={styles.skyVeil}>
        <Text
          accessibilityRole="header"
          numberOfLines={1}
          maxFontSizeMultiplier={1.3}
          style={styles.title}
        >
          Choose Your Path
        </Text>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.3} style={styles.copy}>
          Glow, rune count, and embers change with the road.
        </Text>
      </View>

      <View style={styles.stage}>
        {DIFFICULTIES.map((option) => (
          <DifficultyCard
            key={option.id}
            option={option}
            selected={selected === option.id}
            onSelect={() => setSelected(option.id)}
          />
        ))}
      </View>

      <View style={styles.dockVeil}>
        <PrimaryButton
          label={`Walk the ${selectedName} road`}
          fullWidth
          accessibilityHint={`Starts a ${selectedName} run from level ${startLevel}`}
          onPress={begin}
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
    gap: theme.spacing.xs,
    backgroundColor: theme.overlay.sky,
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
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  dockVeil: {
    marginHorizontal: -theme.spacing.lg,
    marginBottom: -theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    backgroundColor: theme.overlay.dock,
  },
});
