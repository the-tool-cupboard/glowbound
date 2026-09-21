import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

import {
  BGM_SOURCES,
  SFX_SOURCES,
  type BgmId,
  type SfxId,
} from "@/lib/audioCatalog";

export const SFX_STORAGE_KEY = "glowbound.audio.sfx";
export const MUSIC_STORAGE_KEY = "glowbound.audio.music";
export const SFX_VOLUME_STORAGE_KEY = "glowbound.audio.sfxVolume";
export const MUSIC_VOLUME_STORAGE_KEY = "glowbound.audio.musicVolume";

export const BGM_VOLUME = 0.35;
/** Immediate duck when a bed leaves, before the remaining fade-out. */
export const BGM_DUCK_FACTOR = 0.32;
export const BGM_FADE_OUT_MS = 280;
export const BGM_FADE_STEPS = 7;
export const SFX_POOL_SIZE = 3;
export const DEFAULT_SFX_VOLUME = 1;
export const DEFAULT_MUSIC_VOLUME = 0.7;

/** SFX that fire rapidly and benefit from a small player pool. */
export const POOLED_SFX_IDS: readonly SfxId[] = ["uiTap", "uiSelect", "runeTap"];

export interface AudioPreferences {
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
}

export interface GameAudioEngine {
  playSfx: (id: SfxId) => void;
  playMusic: (id: BgmId) => void;
  stopMusic: () => void;
  setSfxEnabled: (enabled: boolean) => Promise<void>;
  setMusicEnabled: (enabled: boolean) => Promise<void>;
  setSfxVolume: (volume: number) => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
  getPreferences: () => AudioPreferences;
  dispose: () => void;
}

export function clampAudioVolume(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function duckedMusicVolume(fullVolume: number): number {
  return clampAudioVolume(fullVolume * BGM_DUCK_FACTOR);
}

/** Volume after `stepIndex` of `steps` on a linear fade from `fromVolume` to 0. */
export function musicFadeStepVolume(fromVolume: number, stepIndex: number, steps: number): number {
  if (steps <= 0 || stepIndex >= steps) {
    return 0;
  }
  if (stepIndex <= 0) {
    return clampAudioVolume(fromVolume);
  }
  return clampAudioVolume(fromVolume * (1 - stepIndex / steps));
}

function parseStoredVolume(raw: string | null, fallback: number): number {
  if (raw == null || raw === "") {
    return fallback;
  }
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clampAudioVolume(parsed);
}

function resolveMigratedVolume(
  volumeRaw: string | null,
  flagRaw: string | null,
  defaultVolume: number
): number {
  if (volumeRaw != null) {
    return parseStoredVolume(volumeRaw, defaultVolume);
  }
  if (flagRaw === "false") {
    return 0;
  }
  return defaultVolume;
}

function prefsFromVolumes(sfxVolume: number, musicVolume: number): AudioPreferences {
  const nextSfx = clampAudioVolume(sfxVolume);
  const nextMusic = clampAudioVolume(musicVolume);
  return {
    sfxVolume: nextSfx,
    musicVolume: nextMusic,
    sfxEnabled: nextSfx > 0,
    musicEnabled: nextMusic > 0,
  };
}

export async function configureAudioMode(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "mixWithOthers",
    });
  } catch {
    // Audio must never block gameplay.
  }
}

export async function loadAudioPreferences(): Promise<AudioPreferences> {
  try {
    const [sfxFlagRaw, musicFlagRaw, sfxVolumeRaw, musicVolumeRaw] = await Promise.all([
      AsyncStorage.getItem(SFX_STORAGE_KEY),
      AsyncStorage.getItem(MUSIC_STORAGE_KEY),
      AsyncStorage.getItem(SFX_VOLUME_STORAGE_KEY),
      AsyncStorage.getItem(MUSIC_VOLUME_STORAGE_KEY),
    ]);
    return prefsFromVolumes(
      resolveMigratedVolume(sfxVolumeRaw, sfxFlagRaw, DEFAULT_SFX_VOLUME),
      resolveMigratedVolume(musicVolumeRaw, musicFlagRaw, DEFAULT_MUSIC_VOLUME)
    );
  } catch {
    return prefsFromVolumes(DEFAULT_SFX_VOLUME, DEFAULT_MUSIC_VOLUME);
  }
}

async function persistChannel(
  volumeKey: string,
  flagKey: string,
  volume: number
): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(volumeKey, String(volume)),
      AsyncStorage.setItem(flagKey, String(volume > 0)),
    ]);
  } catch {
    // Fail open.
  }
}

function safeRelease(player: AudioPlayer | null | undefined): void {
  if (player == null) {
    return;
  }
  try {
    player.pause();
    player.remove();
  } catch {
    // Ignore cleanup errors.
  }
}

function replayPlayer(player: AudioPlayer): void {
  try {
    player.seekTo(0);
    player.play();
  } catch {
    // Web autoplay restrictions and missing assets fail silently.
  }
}

function setPlayerVolume(player: AudioPlayer | null | undefined, volume: number): void {
  if (player == null) {
    return;
  }
  try {
    player.volume = volume;
  } catch {
    // Some platforms reject volume writes on released players.
  }
}

const POOLED_SFX = new Set<SfxId>(POOLED_SFX_IDS);

function createSfxPlayer(id: SfxId): AudioPlayer {
  return createAudioPlayer(SFX_SOURCES[id], { keepAudioSessionActive: true });
}

/**
 * SFX players are allocated on first play of that cue, not at engine boot.
 * Pooled cues still create SFX_POOL_SIZE players the first time they fire.
 */
export function createGameAudioEngine(initialPrefs: AudioPreferences): GameAudioEngine {
  let prefs = prefsFromVolumes(initialPrefs.sfxVolume, initialPrefs.musicVolume);
  const poolCursor: Partial<Record<SfxId, number>> = {};
  const pools: Partial<Record<SfxId, AudioPlayer[]>> = {};
  const singles: Partial<Record<SfxId, AudioPlayer>> = {};
  const failedSfx = new Set<SfxId>();

  let bgmPlayer: AudioPlayer | null = null;
  let currentBgmId: BgmId | null = null;
  const fadingPlayers: AudioPlayer[] = [];
  const fadeTimers: ReturnType<typeof setInterval>[] = [];

  const applySfxVolume = (volume: number): void => {
    for (const pool of Object.values(pools)) {
      if (pool == null) {
        continue;
      }
      for (const player of pool) {
        setPlayerVolume(player, volume);
      }
    }
    for (const player of Object.values(singles)) {
      setPlayerVolume(player, volume);
    }
  };

  const mixedMusicVolume = (): number => prefs.musicVolume * BGM_VOLUME;

  const applyMusicMix = (): void => {
    setPlayerVolume(bgmPlayer, mixedMusicVolume());
  };

  const ensurePooledPlayers = (id: SfxId): AudioPlayer[] | undefined => {
    const existing = pools[id];
    if (existing != null) {
      return existing;
    }
    if (failedSfx.has(id)) {
      return undefined;
    }
    try {
      const created = Array.from({ length: SFX_POOL_SIZE }, () => createSfxPlayer(id));
      for (const player of created) {
        setPlayerVolume(player, prefs.sfxVolume);
      }
      pools[id] = created;
      return created;
    } catch {
      failedSfx.add(id);
      return undefined;
    }
  };

  const ensureSinglePlayer = (id: SfxId): AudioPlayer | undefined => {
    const existing = singles[id];
    if (existing != null) {
      return existing;
    }
    if (failedSfx.has(id)) {
      return undefined;
    }
    try {
      const created = createSfxPlayer(id);
      setPlayerVolume(created, prefs.sfxVolume);
      singles[id] = created;
      return created;
    } catch {
      failedSfx.add(id);
      return undefined;
    }
  };

  const playSfx = (id: SfxId): void => {
    if (!prefs.sfxEnabled || prefs.sfxVolume <= 0) {
      return;
    }

    if (POOLED_SFX.has(id)) {
      const pool = ensurePooledPlayers(id);
      if (pool == null || pool.length === 0) {
        return;
      }
      const cursor = poolCursor[id] ?? 0;
      const player = pool[cursor % pool.length];
      poolCursor[id] = (cursor + 1) % pool.length;
      setPlayerVolume(player, prefs.sfxVolume);
      replayPlayer(player);
      return;
    }

    const single = ensureSinglePlayer(id);
    if (single != null) {
      setPlayerVolume(single, prefs.sfxVolume);
      replayPlayer(single);
    }
  };

  const releaseFadingPlayer = (player: AudioPlayer): void => {
    const index = fadingPlayers.indexOf(player);
    if (index >= 0) {
      fadingPlayers.splice(index, 1);
    }
    safeRelease(player);
  };

  const beginMusicFade = (player: AudioPlayer): void => {
    const start = duckedMusicVolume(mixedMusicVolume());
    setPlayerVolume(player, start);
    fadingPlayers.push(player);
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setPlayerVolume(player, musicFadeStepVolume(start, step, BGM_FADE_STEPS));
      if (step >= BGM_FADE_STEPS) {
        clearInterval(timer);
        const timerIndex = fadeTimers.indexOf(timer);
        if (timerIndex >= 0) {
          fadeTimers.splice(timerIndex, 1);
        }
        releaseFadingPlayer(player);
      }
    }, Math.max(16, Math.round(BGM_FADE_OUT_MS / BGM_FADE_STEPS)));
    fadeTimers.push(timer);
  };

  const releaseAllFades = (): void => {
    for (const timer of fadeTimers) {
      clearInterval(timer);
    }
    fadeTimers.length = 0;
    for (const player of fadingPlayers) {
      safeRelease(player);
    }
    fadingPlayers.length = 0;
  };

  const stopMusic = (mode: "fade" | "immediate" = "fade"): void => {
    const player = bgmPlayer;
    bgmPlayer = null;
    currentBgmId = null;
    if (player == null) {
      return;
    }
    if (mode === "immediate") {
      safeRelease(player);
      return;
    }
    beginMusicFade(player);
  };

  const playMusic = (id: BgmId): void => {
    if (!prefs.musicEnabled || prefs.musicVolume <= 0) {
      return;
    }

    const source = BGM_SOURCES[id] ?? BGM_SOURCES.playTheme;
    if (source == null) {
      return;
    }

    if (currentBgmId === id && bgmPlayer != null) {
      applyMusicMix();
      try {
        if (!bgmPlayer.playing) {
          bgmPlayer.play();
        }
      } catch {
        // Ignore resume errors.
      }
      return;
    }

    stopMusic("fade");

    try {
      const player = createAudioPlayer(source);
      player.loop = true;
      player.volume = mixedMusicVolume();
      player.play();
      bgmPlayer = player;
      currentBgmId = id;
    } catch {
      // Missing BGM asset or autoplay restriction.
    }
  };

  const setSfxVolume = async (volume: number): Promise<void> => {
    prefs = prefsFromVolumes(volume, prefs.musicVolume);
    applySfxVolume(prefs.sfxVolume);
    await persistChannel(SFX_VOLUME_STORAGE_KEY, SFX_STORAGE_KEY, prefs.sfxVolume);
  };

  const setMusicVolume = async (volume: number): Promise<void> => {
    prefs = prefsFromVolumes(prefs.sfxVolume, volume);
    if (prefs.musicVolume <= 0) {
      stopMusic("immediate");
    } else {
      applyMusicMix();
    }
    await persistChannel(MUSIC_VOLUME_STORAGE_KEY, MUSIC_STORAGE_KEY, prefs.musicVolume);
  };

  const setSfxEnabled = async (enabled: boolean): Promise<void> => {
    if (enabled) {
      await setSfxVolume(prefs.sfxVolume > 0 ? prefs.sfxVolume : DEFAULT_SFX_VOLUME);
      return;
    }
    await setSfxVolume(0);
  };

  const setMusicEnabled = async (enabled: boolean): Promise<void> => {
    if (enabled) {
      await setMusicVolume(prefs.musicVolume > 0 ? prefs.musicVolume : DEFAULT_MUSIC_VOLUME);
      return;
    }
    await setMusicVolume(0);
  };

  const dispose = (): void => {
    releaseAllFades();
    stopMusic("immediate");
    for (const pool of Object.values(pools)) {
      if (pool == null) {
        continue;
      }
      for (const player of pool) {
        safeRelease(player);
      }
    }
    for (const player of Object.values(singles)) {
      safeRelease(player);
    }
  };

  return {
    playSfx,
    playMusic,
    stopMusic,
    setSfxEnabled,
    setMusicEnabled,
    setSfxVolume,
    setMusicVolume,
    getPreferences: () => ({ ...prefs }),
    dispose,
  };
}
