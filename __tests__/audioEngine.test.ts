import { createAudioPlayer } from "expo-audio";

import { BGM_SOURCES, SFX_SOURCES, type SfxId } from "../lib/audioCatalog";
import {
  BGM_VOLUME,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  POOLED_SFX_IDS,
  SFX_POOL_SIZE,
  createGameAudioEngine,
  type AudioPreferences,
} from "../lib/audioEngine";

jest.mock("expo-audio", () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

interface MockAudioPlayer {
  volume: number;
  loop: boolean;
  playing: boolean;
  play: jest.Mock;
  pause: jest.Mock;
  seekTo: jest.Mock;
  release: jest.Mock;
}

const mockedCreateAudioPlayer = createAudioPlayer as jest.MockedFunction<typeof createAudioPlayer>;

function makePlayer(): MockAudioPlayer {
  return {
    volume: 1,
    loop: false,
    playing: false,
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(),
    release: jest.fn(),
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

function createdPlayers(): MockAudioPlayer[] {
  return mockedCreateAudioPlayer.mock.results
    .filter((result) => result.type === "return")
    .map((result) => result.value as unknown as MockAudioPlayer);
}

function eagerSfxPlayerCount(): number {
  const ids = Object.keys(SFX_SOURCES) as SfxId[];
  const pooled = new Set<SfxId>(POOLED_SFX_IDS);
  return ids.reduce((count, id) => count + (pooled.has(id) ? SFX_POOL_SIZE : 1), 0);
}

describe("createGameAudioEngine lazy SFX", () => {
  beforeEach(() => {
    mockedCreateAudioPlayer.mockReset();
    mockedCreateAudioPlayer.mockImplementation(() => makePlayer() as never);
  });

  it("does not allocate AudioPlayers when the engine is constructed", () => {
    createGameAudioEngine(enabledPrefs());

    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();
    expect(eagerSfxPlayerCount()).toBeGreaterThanOrEqual(26);
  });

  it("allocates a single-cue player only on first play of that cue", () => {
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("runeCorrect");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockedCreateAudioPlayer).toHaveBeenCalledWith(SFX_SOURCES.runeCorrect, {
      keepAudioSessionActive: true,
    });

    engine.playSfx("runeCorrect");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);

    engine.playSfx("runeWrong");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2);
    expect(mockedCreateAudioPlayer).toHaveBeenLastCalledWith(SFX_SOURCES.runeWrong, {
      keepAudioSessionActive: true,
    });
  });

  it("allocates the full pool on first play of a pooled cue and then rotates", () => {
    const engine = createGameAudioEngine(enabledPrefs());

    engine.playSfx("uiTap");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(SFX_POOL_SIZE);
    for (const call of mockedCreateAudioPlayer.mock.calls) {
      expect(call[0]).toBe(SFX_SOURCES.uiTap);
      expect(call[1]).toEqual({ keepAudioSessionActive: true });
    }

    const [first, second, third] = createdPlayers();
    expect(first.seekTo).toHaveBeenCalledWith(0);
    expect(first.play).toHaveBeenCalledTimes(1);
    expect(second.play).not.toHaveBeenCalled();
    expect(third.play).not.toHaveBeenCalled();

    engine.playSfx("uiTap");
    engine.playSfx("uiTap");
    engine.playSfx("uiTap");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(SFX_POOL_SIZE);
    expect(first.play).toHaveBeenCalledTimes(2);
    expect(second.play).toHaveBeenCalledTimes(1);
    expect(third.play).toHaveBeenCalledTimes(1);
  });

  it("does not allocate players when SFX are muted", () => {
    const engine = createGameAudioEngine(
      enabledPrefs({ sfxEnabled: false, sfxVolume: 0 })
    );

    engine.playSfx("uiTap");
    engine.playSfx("runeCorrect");
    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();
  });

  it("replays with the current SFX volume and does not change timing helpers", () => {
    const engine = createGameAudioEngine(enabledPrefs({ sfxVolume: 0.4 }));

    engine.playSfx("previewChime");
    const [player] = createdPlayers();
    expect(player.volume).toBe(0.4);
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("applies later volume changes only to already allocated SFX players", async () => {
    const engine = createGameAudioEngine(enabledPrefs());
    engine.playSfx("levelClear");
    const [player] = createdPlayers();

    await engine.setSfxVolume(0.2);
    expect(player.volume).toBe(0.2);

    engine.playSfx("gameOver");
    const [, second] = createdPlayers();
    expect(second.volume).toBe(0.2);
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2);
  });

  it("skips a cue after createAudioPlayer throws and does not retry that cue", () => {
    mockedCreateAudioPlayer
      .mockImplementationOnce(() => {
        throw new Error("missing asset");
      })
      .mockImplementation(() => makePlayer() as never);

    const engine = createGameAudioEngine(enabledPrefs());
    expect(() => engine.playSfx("purchaseFail")).not.toThrow();
    expect(() => engine.playSfx("purchaseFail")).not.toThrow();
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);

    engine.playSfx("purchase");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(2);
    expect(createdPlayers()).toHaveLength(1);
  });

  it("releases only allocated SFX players on dispose", () => {
    const engine = createGameAudioEngine(enabledPrefs());
    engine.playSfx("uiSelect");
    engine.playSfx("wardArm");

    const players = createdPlayers();
    expect(players).toHaveLength(SFX_POOL_SIZE + 1);

    engine.dispose();
    for (const player of players) {
      expect(player.pause).toHaveBeenCalled();
      expect(player.release).toHaveBeenCalled();
    }
  });

  it("plays every catalog SFX id without requiring boot-time allocation", () => {
    const engine = createGameAudioEngine(enabledPrefs());
    const ids = Object.keys(SFX_SOURCES) as SfxId[];

    for (const id of ids) {
      expect(() => engine.playSfx(id)).not.toThrow();
    }

    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(eagerSfxPlayerCount());
    for (const id of ids) {
      expect(mockedCreateAudioPlayer).toHaveBeenCalledWith(SFX_SOURCES[id], {
        keepAudioSessionActive: true,
      });
    }
  });

  it("keeps BGM allocation independent of SFX laziness", () => {
    const engine = createGameAudioEngine(enabledPrefs());
    expect(mockedCreateAudioPlayer).not.toHaveBeenCalled();

    engine.playMusic("menuTheme");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1);
    expect(mockedCreateAudioPlayer).toHaveBeenCalledWith(BGM_SOURCES.menuTheme);

    const [bgm] = createdPlayers();
    expect(bgm.loop).toBe(true);
    expect(bgm.volume).toBe(DEFAULT_MUSIC_VOLUME * BGM_VOLUME);
    expect(bgm.play).toHaveBeenCalledTimes(1);

    engine.playSfx("uiTap");
    expect(mockedCreateAudioPlayer).toHaveBeenCalledTimes(1 + SFX_POOL_SIZE);
  });
});
