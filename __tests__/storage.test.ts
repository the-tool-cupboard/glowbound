import AsyncStorage from "@react-native-async-storage/async-storage";

import { STARTING_EMBERS } from "../lib/economyConfig";
import { createEconomyState } from "../lib/economyEngine";
import { MAX_LEVEL, MAX_STORED_SCORE } from "../lib/gameConfig";
import {
  getAdminUnlockAll,
  getAnimatedBackgroundsEnabled,
  getEconomyState,
  getHighScore,
  getHighestReachedLevel,
  setAdminUnlockAll,
  setAnimatedBackgroundsEnabled,
  setEconomyState,
  setHighScore,
  setHighestReachedLevel,
} from "../lib/storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockedStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("storage fallbacks", () => {
  beforeEach(() => {
    mockedStorage.getItem.mockReset();
    mockedStorage.setItem.mockReset();
  });

  it("returns 0 when a high score is missing, non-numeric, or unreadable", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);
    await expect(getHighScore()).resolves.toBe(0);

    mockedStorage.getItem.mockResolvedValueOnce("abc");
    await expect(getHighScore()).resolves.toBe(0);

    mockedStorage.getItem.mockRejectedValueOnce(new Error("unavailable"));
    await expect(getHighScore()).resolves.toBe(0);
  });

  it("returns 0 when highest reached level storage fails", async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error("unavailable"));
    await expect(getHighestReachedLevel()).resolves.toBe(0);
  });

  it("loads default economy when storage is empty", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);
    await expect(getEconomyState()).resolves.toEqual(createEconomyState());
  });

  it("loads default economy when stored JSON is corrupt", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("{not-json");
    await expect(getEconomyState()).resolves.toEqual(createEconomyState());
  });

  it("clamps a negative stored ember count through createEconomyState", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ embers: -90, inventory: { ward: 1 }, difficulty: "harsh" })
    );

    const loaded = await getEconomyState();
    expect(loaded.embers).toBe(0);
    expect(loaded.difficulty).toBe("harsh");
    expect(loaded.inventory.ward).toBe(1);
  });

  it("falls back to standard when stored difficulty is unknown", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(
      JSON.stringify({ embers: 40, inventory: {}, difficulty: "wanderer" })
    );

    const loaded = await getEconomyState();
    expect(loaded.difficulty).toBe("standard");
  });

  it("does not throw when persistence fails", async () => {
    mockedStorage.setItem.mockRejectedValue(new Error("unavailable"));

    await expect(setHighScore(40)).resolves.toBe(40);
    await expect(setEconomyState(createEconomyState({ embers: STARTING_EMBERS }))).resolves.toBeUndefined();
    await expect(setAnimatedBackgroundsEnabled(true)).resolves.toBeUndefined();
    await expect(setAdminUnlockAll(true)).resolves.toBeUndefined();
  });

  it("treats missing or unreadable animated-background flags as still images", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);
    await expect(getAnimatedBackgroundsEnabled()).resolves.toBe(false);

    mockedStorage.getItem.mockResolvedValueOnce("false");
    await expect(getAnimatedBackgroundsEnabled()).resolves.toBe(false);

    mockedStorage.getItem.mockRejectedValueOnce(new Error("unavailable"));
    await expect(getAnimatedBackgroundsEnabled()).resolves.toBe(false);
  });

  it("reads the animated-background flag when stored as true", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("true");
    await expect(getAnimatedBackgroundsEnabled()).resolves.toBe(true);
  });

  it("treats missing or unreadable admin-unlock flags as off", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(null);
    await expect(getAdminUnlockAll()).resolves.toBe(false);

    mockedStorage.getItem.mockResolvedValueOnce("false");
    await expect(getAdminUnlockAll()).resolves.toBe(false);

    mockedStorage.getItem.mockRejectedValueOnce(new Error("unavailable"));
    await expect(getAdminUnlockAll()).resolves.toBe(false);
  });

  it("reads the admin-unlock flag when stored as true", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("true");
    await expect(getAdminUnlockAll()).resolves.toBe(true);
  });

  it("clamps an oversized stored high score", async () => {
    mockedStorage.getItem.mockResolvedValueOnce(String(MAX_STORED_SCORE * 4));
    await expect(getHighScore()).resolves.toBe(MAX_STORED_SCORE);
  });

  it("clamps an oversized stored reached level to MAX_LEVEL", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("99999");
    await expect(getHighestReachedLevel()).resolves.toBe(MAX_LEVEL);
  });

  it("refuses to persist a reached level above MAX_LEVEL", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("12");
    mockedStorage.setItem.mockResolvedValueOnce(undefined);

    await expect(setHighestReachedLevel(500)).resolves.toBe(MAX_LEVEL);
    expect(mockedStorage.setItem).toHaveBeenCalledWith(
      "glowbound:highest-reached-level",
      String(MAX_LEVEL)
    );
  });

  it("keeps the higher of the current high score and the incoming score", async () => {
    mockedStorage.getItem.mockResolvedValueOnce("80");
    mockedStorage.setItem.mockResolvedValueOnce(undefined);

    await expect(setHighScore(40)).resolves.toBe(80);
    expect(mockedStorage.setItem).toHaveBeenCalledWith("glowbound:high-score", "80");
  });
});
