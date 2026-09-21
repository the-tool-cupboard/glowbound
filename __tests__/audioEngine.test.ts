import { createAudioPlayer } from "expo-audio";

import { SFX_CATALOG } from "../lib/audioCatalog";
import {
  createGameAudioEngine,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  POOLED_SFX_IDS,
  SFX_POOL_SIZE,
  type AudioPreferences,
} from "../lib/audioEngine";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

type MockAudioPlayer = {
  volume: number;
  loop: boolean;
  playing: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  release: jest.Mock;
  seekTo: jest.Mock;
};

const mockedCreateAudioPlayer = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;

function createMockPlayer(): MockAudioPlayer {
  return {
    volume: 1,
    loop: false,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    release: jest.fn(),
    seekTo: jest.fn(),
  };
}

function enabledPrefs(overrides: Partial<AudioPreferences> = {}): AudioPreferences {
  return {
    sfxEnabled: true,
    musicEnabled: true,
    sfxVolume: DEFAULT_SFX_VOLUME,
    musicVolume: DEFAULT_MUSIC_VOLUME,
    ...overrides,
  };
}

describe("lazy SFX player pools", () => {
  beforeEach(() => {
    mockedCreateAudioPlayer.mockReset();
    mockedCreateAudioPlayer.mockImplementation(() => createMockPlayer() as never);
  });

  it("does not allocate AudioPlayers when the engine is constructed", () => {
    createGameAudioEngine(enabledPrefs());

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();
  });

  it("does not allocate when SFX are muted or volume is zero", () => {
    const muted = createGameAudioEngine(enabledPrefs({ sfxEnabled: false, sfxVolume: 0 }));
    muted.playSfx("uiTap");
    muted.playSfx("runeCorrect");

    const zeroVolume = createGameAudioEngine(enabledPrefs({ sfxEnabled: true, sfxVolume: 0 }));
    zeroVolume.playSfx("uiTap");

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();
  });

  it("allocates one player on first play of a single cue and reuses it", () => {
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("runeCorrect");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);

    engine.playSfx("runeCorrect");
    engine.playSfx("runeCorrect");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);

    const player = mockedCreateAudioPlayer.mock.results[0]?.value as MockAudioPlayer;
    expect(player.seekTo).toHaveBeenCalledTimes(3);
    expect(player.play).toHaveBeenCalledTimes(3);
  });

  it("allocates the full pool on first need and does not grow it again", () => {
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("uiTap");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(SFX_POOL_SIZE);

    engine.playSfx("uiTap");
    engine.playSfx("uiTap");
    engine.playSfx("uiTap");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(SFX_POOL_SIZE);
  });

  it("rotates pooled players so overlapping taps keep sounding", () => {
    const engine = createGameAudioEngine(enabledPrefs());
    engine.playSfx("runeTap");
    engine.playSfx("runeTap");
    engine.playSfx("runeTap");
    engine.playSfx("runeTap");

    const players = mockedCreateAudioPlayer.mock.results.map(
      (result) => result.value as MockAudioPlayer
    );
    expect(players).toHaveLength(SFX_POOL_SIZE);
    expect(players[0]?.play).toHaveBeenCalledTimes(2);
    expect(players[1]?.play).toHaveBeenCalledTimes(1);
    expect(players[2]?.play).toHaveBeenCalledTimes(1);
  });

  it("unlocks only the requested cue, not the rest of the catalog", () => {
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("previewChime");
    engine.playSfx("uiSelect");

    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1 + SFX_POOL_SIZE);
    expect(SFX_CATALOG.length).toBeGreaterThan(2);
    expect(POOLED_SFX_IDS).toContain("uiSelect");
  });

  it("does not retry a cue that failed to allocate", () => {
    mockedCreateAudioPlayer.mockImplementation(() => {
      throw new Error("missing asset");
    });
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("gameOver");
    engine.playSfx("gameOver");
    engine.playSfx("uiTap");
    engine.playSfx("uiTap");

    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2);
  });

  it("applies the current volume when a cue is first unlocked", async () => {
    const engine = createGameAudioEngine(enabledPrefs());
    await engine.setSfxVolume(0.4);

    engine.playSfx("purchase");

    const player = mockedCreateAudioPlayer.mock.results[0]?.value as MockAudioPlayer;
    expect(player.volume).toBe(0.4);
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it("updates volume on already-unlocked players without allocating new ones", async () => {
    const engine = createGameAudioEngine(enabledPrefs());
    engine.playSfx("emberGain");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);

    await engine.setSfxVolume(0.25);

    const player = mockedCreateAudioPlayer.mock.results[0]?.value as MockAudioPlayer;
    expect(player.volume).toBe(0.25);
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it("releases only unlocked SFX players on dispose", () => {
    const engine = createGameAudioEngine(enabledPrefs());
    engine.playSfx("wardArm");
    engine.playSfx("uiTap");

    const players = mockedCreateAudioPlayer.mock.results.map(
      (result) => result.value as MockAudioPlayer
    );
    expect(players).toHaveLength(1 + SFX_POOL_SIZE);

    engine.dispose();

    for (const player of players) {
      expect(player.pause).toHaveBeenCalled();
      expect(player.release).toHaveBeenCalled();
    }
  });
});
