import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { BgmId, SfxId } from "@/lib/audioCatalog";
import {
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  clampAudioVolume,
  configureAudioMode,
  createGameAudioEngine,
  loadAudioPreferences,
  type GameAudioEngine,
} from "@/lib/audioEngine";

interface GameAudioContextValue {
  ready: boolean;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  playSfx: (id: SfxId) => void;
  playMusic: (id: BgmId) => void;
  stopMusic: () => void;
  setSfxEnabled: (enabled: boolean) => Promise<void>;
  setMusicEnabled: (enabled: boolean) => Promise<void>;
  setSfxVolume: (volume: number) => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
}

const GameAudioContext = createContext<GameAudioContextValue | null>(null);

function syncFromEngine(
  engine: GameAudioEngine | null,
  setSfxVolumeState: (volume: number) => void,
  setMusicVolumeState: (volume: number) => void,
  setSfxEnabledState: (enabled: boolean) => void,
  setMusicEnabledState: (enabled: boolean) => void
): void {
  const prefs = engine?.getPreferences();
  if (prefs == null) {
    return;
  }
  setSfxVolumeState(prefs.sfxVolume);
  setMusicVolumeState(prefs.musicVolume);
  setSfxEnabledState(prefs.sfxEnabled);
  setMusicEnabledState(prefs.musicEnabled);
}

export function GameAudioProvider({ children }: { children: ReactNode }) {
  const engineRef = useRef<GameAudioEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [sfxEnabled, setSfxEnabledState] = useState(true);
  const [musicEnabled, setMusicEnabledState] = useState(true);
  const [sfxVolume, setSfxVolumeState] = useState(DEFAULT_SFX_VOLUME);
  const [musicVolume, setMusicVolumeState] = useState(DEFAULT_MUSIC_VOLUME);

  useEffect(() => {
    let cancelled = false;
    let engine: GameAudioEngine | null = null;

    void (async () => {
      await configureAudioMode();
      const prefs = await loadAudioPreferences();
      if (cancelled) {
        return;
      }

      engine = createGameAudioEngine(prefs);
      engineRef.current = engine;
      setSfxEnabledState(prefs.sfxEnabled);
      setMusicEnabledState(prefs.musicEnabled);
      setSfxVolumeState(prefs.sfxVolume);
      setMusicVolumeState(prefs.musicVolume);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
    };
  }, []);

  const playSfx = useCallback((id: SfxId) => {
    engineRef.current?.playSfx(id);
  }, []);

  const playMusic = useCallback((id: BgmId) => {
    engineRef.current?.playMusic(id);
  }, []);

  const stopMusic = useCallback(() => {
    engineRef.current?.stopMusic();
  }, []);

  const setSfxVolume = useCallback(async (volume: number) => {
    const next = clampAudioVolume(volume);
    setSfxVolumeState(next);
    setSfxEnabledState(next > 0);
    await engineRef.current?.setSfxVolume(next);
    syncFromEngine(
      engineRef.current,
      setSfxVolumeState,
      setMusicVolumeState,
      setSfxEnabledState,
      setMusicEnabledState
    );
  }, []);

  const setMusicVolume = useCallback(async (volume: number) => {
    const next = clampAudioVolume(volume);
    setMusicVolumeState(next);
    setMusicEnabledState(next > 0);
    await engineRef.current?.setMusicVolume(next);
    syncFromEngine(
      engineRef.current,
      setSfxVolumeState,
      setMusicVolumeState,
      setSfxEnabledState,
      setMusicEnabledState
    );
  }, []);

  const setSfxEnabled = useCallback(async (enabled: boolean) => {
    await engineRef.current?.setSfxEnabled(enabled);
    syncFromEngine(
      engineRef.current,
      setSfxVolumeState,
      setMusicVolumeState,
      setSfxEnabledState,
      setMusicEnabledState
    );
    if (engineRef.current == null) {
      const next = enabled ? DEFAULT_SFX_VOLUME : 0;
      setSfxVolumeState(next);
      setSfxEnabledState(enabled);
    }
  }, []);

  const setMusicEnabled = useCallback(async (enabled: boolean) => {
    await engineRef.current?.setMusicEnabled(enabled);
    syncFromEngine(
      engineRef.current,
      setSfxVolumeState,
      setMusicVolumeState,
      setSfxEnabledState,
      setMusicEnabledState
    );
    if (engineRef.current == null) {
      const next = enabled ? DEFAULT_MUSIC_VOLUME : 0;
      setMusicVolumeState(next);
      setMusicEnabledState(enabled);
    }
  }, []);

  const value = useMemo<GameAudioContextValue>(
    () => ({
      ready,
      sfxEnabled,
      musicEnabled,
      sfxVolume,
      musicVolume,
      playSfx,
      playMusic,
      stopMusic,
      setSfxEnabled,
      setMusicEnabled,
      setSfxVolume,
      setMusicVolume,
    }),
    [
      ready,
      sfxEnabled,
      musicEnabled,
      sfxVolume,
      musicVolume,
      playSfx,
      playMusic,
      stopMusic,
      setSfxEnabled,
      setMusicEnabled,
      setSfxVolume,
      setMusicVolume,
    ]
  );

  return createElement(GameAudioContext.Provider, { value }, children);
}

export function useGameAudio(): GameAudioContextValue {
  const context = useContext(GameAudioContext);
  if (context == null) {
    throw new Error("useGameAudio must be used within GameAudioProvider");
  }
  return context;
}

/** Starts looping BGM for a screen. Same-track hub hops keep playing. */
export function useScreenMusic(trackId: BgmId | null): void {
  const { playMusic, musicEnabled, musicVolume } = useGameAudio();

  useEffect(() => {
    if (trackId == null || !(musicEnabled || musicVolume > 0)) {
      return;
    }

    playMusic(trackId);
  }, [trackId, playMusic, musicEnabled, musicVolume]);
}
