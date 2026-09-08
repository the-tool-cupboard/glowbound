import AsyncStorage from "@react-native-async-storage/async-storage";

import { createEconomyState } from "./economyEngine";
import type { EconomyState } from "../types/economy";

const HIGH_SCORE_KEY = "glowbound:high-score";
const HIGHEST_REACHED_KEY = "glowbound:highest-reached-level";
const ECONOMY_KEY = "glowbound:economy";
const ANIMATED_BACKGROUNDS_KEY = "glowbound:animated-backgrounds";

function parseScore(raw: string | null): number {
  if (raw == null) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export async function getHighScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return parseScore(raw);
  } catch {
    return 0;
  }
}

export async function setHighScore(score: number): Promise<void> {
  try {
    const nextScore = Math.max(0, Math.floor(score));
    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(nextScore));
  } catch {
    // Storage can be unavailable in some runtimes; keep gameplay working.
  }
}

export async function getHighestReachedLevel(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HIGHEST_REACHED_KEY);
    return parseScore(raw);
  } catch {
    return 0;
  }
}

export async function setHighestReachedLevel(level: number): Promise<number> {
  const nextLevel = Math.max(1, Math.floor(level));

  try {
    const current = await getHighestReachedLevel();
    const stored = Math.max(current, nextLevel);
    await AsyncStorage.setItem(HIGHEST_REACHED_KEY, String(stored));
    return stored;
  } catch {
    return nextLevel;
  }
}

function parseEconomy(raw: string | null): EconomyState {
  if (raw == null) {
    return createEconomyState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EconomyState>;
    return createEconomyState(parsed);
  } catch {
    return createEconomyState();
  }
}

export async function getEconomyState(): Promise<EconomyState> {
  try {
    const raw = await AsyncStorage.getItem(ECONOMY_KEY);
    return parseEconomy(raw);
  } catch {
    return createEconomyState();
  }
}

export async function setEconomyState(state: EconomyState): Promise<void> {
  try {
    await AsyncStorage.setItem(ECONOMY_KEY, JSON.stringify(createEconomyState(state)));
  } catch {
    // Storage can be unavailable in some runtimes; keep gameplay working.
  }
}

export async function getAnimatedBackgroundsEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ANIMATED_BACKGROUNDS_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function setAnimatedBackgroundsEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ANIMATED_BACKGROUNDS_KEY, enabled ? "true" : "false");
  } catch {
    // Storage can be unavailable in some runtimes; keep gameplay working.
  }
}
