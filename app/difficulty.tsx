import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { DifficultyCard } from "@/components/DifficultyCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useGameEconomy } from "@/hooks/useGameEconomy";
import { DIFFICULTIES } from "@/lib/economyConfig";
import { isDifficultyId } from "@/lib/economyEngine";
import { theme } from "@/lib/theme";
import type { DifficultyId } from "@/types/economy";

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
    <ScreenContainer style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.title}>Difficulty</Text>
        <Text style={styles.copy}>This sets glow time, how many runes appear, and embers earned.</Text>
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
          label={`Start ${selectedName} run`}
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
    paddingTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.title,
    fontWeight: "700",
    letterSpacing: -0.8,
    marginBottom: theme.spacing.sm,
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    lineHeight: 22,
  },
  list: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  actions: {
    width: "100%",
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
});
