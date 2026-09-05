import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { PhonePreview } from "@/components/PhonePreview";
import { GameEconomyProvider } from "@/hooks/useGameEconomy";
import { theme } from "@/lib/theme";

export default function RootLayout() {
  return (
    <PhonePreview>
      <GameEconomyProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            contentStyle: { backgroundColor: theme.colors.background, flex: 1 },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="difficulty" />
          <Stack.Screen name="shop" />
          <Stack.Screen name="levels" />
          <Stack.Screen name="game" />
          <Stack.Screen name="level-complete" />
          <Stack.Screen name="results" />
        </Stack>
        <StatusBar style="light" />
      </GameEconomyProvider>
    </PhonePreview>
  );
}
