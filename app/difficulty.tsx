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
      <View style={styles.hero}>
        <Text style={styles.title}>Choose Your Path</Text>
        <Text style={styles.copy}>Glow, rune count, and embers change with the road.</Text>
      </View>

      <View style={styles.list}>
        {DIFFICULTIES.map((option) => (
          <DifficultyCard
            key={option.id}
            option={option}
            selected={selected === option.id}
            onSelect={() => setSelected(option.id)}
          />
        ))}
      </View>

      <View style={styles.actions}>
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
    justifyContent: "space-between",
    width: "100%",
  },
  hero: {
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    ...theme.typography.title,
    ...theme.artTextShadow,
  },
  copy: {
    color: theme.colors.textMuted,
    ...theme.typography.body,
    ...theme.artTextShadow,
  },
  list: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  actions: {
    alignSelf: "stretch",
    marginHorizontal: -theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    alignItems: "stretch",
  },
});
