import AsyncStorage from "@react-native-async-storage/async-storage";

import { createEconomyState } from "./economyEngine";
import { MAX_LEVEL, MAX_STORED_SCORE } from "./gameConfig";
import type { EconomyState } from "../types/economy";

const HIGH_SCORE_KEY = "glowbound:high-score";
const HIGHEST_REACHED_KEY = "glowbound:highest-reached-level";
const ECONOMY_KEY = "glowbound:economy";
const ANIMATED_BACKGROUNDS_KEY = "glowbound:animated-backgrounds";
const ADMIN_UNLOCK_ALL_KEY = "glowbound:admin-unlock-all";

function parseStoredInt(raw: string | null): number | null {
  if (raw == null) {
    return null;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function clampStoredScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(MAX_STORED_SCORE, Math.max(0, Math.floor(value)));
}

function clampStoredLevel(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(MAX_LEVEL, Math.max(0, Math.floor(value)));
}

function parseScore(raw: string | null): number {
  const parsed = parseStoredInt(raw);
  if (parsed == null || parsed <= 0) {
    return 0;
  }

  return clampStoredScore(parsed);
}

function parseReachedLevel(raw: string | null): number {
  const parsed = parseStoredInt(raw);
  if (parsed == null || parsed <= 0) {
    return 0;
  }

  return clampStoredLevel(parsed);
}

export async function getHighScore(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HIGH_SCORE_KEY);
    return parseScore(raw);
  } catch {
    return 0;
  }
}

export async function setHighScore(score: number): Promise<number> {
  const nextScore = clampStoredScore(score);

  try {
    const current = await getHighScore();
    const stored = Math.max(current, nextScore);
    await AsyncStorage.setItem(HIGH_SCORE_KEY, String(stored));
    return stored;
  } catch {
    return nextScore;
  }
}

export async function getHighestReachedLevel(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(HIGHEST_REACHED_KEY);
    return parseReachedLevel(raw);
  } catch {
    return 0;
  }
}

export async function setHighestReachedLevel(level: number): Promise<number> {
  const nextLevel = Math.max(1, clampStoredLevel(level) || 1);

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

export async function getAdminUnlockAll(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(ADMIN_UNLOCK_ALL_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export async function setAdminUnlockAll(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(ADMIN_UNLOCK_ALL_KEY, enabled ? "true" : "false");
  } catch {
    // Storage can be unavailable in some runtimes; keep gameplay working.
  }
}
