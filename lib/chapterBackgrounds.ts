import type { ImageProps } from "expo-image";

import type { ChapterArtKey } from "../types/game";
import { getCheckpointForLevel } from "./gameConfig";

/**
 * TODO(art): replace placeholder GB_CastleGate.png … GB_TheBound.png with final
 * chapter paintings. Missing final assets: Castle Gate, Moonwell, Crystal Ascent,
 * Ember Bridge, The Tower, Starfall, Hollow Crown, Night Orchard, The Bound.
 * Sleeping Woods keeps GB_SleepingWoods-2.png.
 */
const CHAPTER_SOURCES: Record<ChapterArtKey, ImageProps["source"]> = {
  sleepingWoods: require("../assets/images/game images/GB_SleepingWoods-2.png"),
  castleGate: require("../assets/images/game images/GB_CastleGate.png"),
  moonwell: require("../assets/images/game images/GB_Moonwell.png"),
  crystalAscent: require("../assets/images/game images/GB_CrystalAscent.png"),
  emberBridge: require("../assets/images/game images/GB_EmberBridge.png"),
  theTower: require("../assets/images/game images/GB_TheTower.png"),
  starfall: require("../assets/images/game images/GB_Starfall.png"),
  hollowCrown: require("../assets/images/game images/GB_HollowCrown.png"),
  nightOrchard: require("../assets/images/game images/GB_NightOrchard.png"),
  theBound: require("../assets/images/game images/GB_TheBound.png"),
};

export const MISSING_FINAL_CHAPTER_ART: readonly ChapterArtKey[] = [
  "castleGate",
  "moonwell",
  "crystalAscent",
  "emberBridge",
  "theTower",
  "starfall",
  "hollowCrown",
  "nightOrchard",
  "theBound",
];

export function chapterArtKey(level: number): ChapterArtKey {
  return getCheckpointForLevel(level).artKey;
}

export function chapterBackground(level: number): ImageProps["source"] {
  return CHAPTER_SOURCES[chapterArtKey(level)];
}
