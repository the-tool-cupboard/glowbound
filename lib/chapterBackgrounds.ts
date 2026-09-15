import type { ImageProps } from "expo-image";

import type { ChapterArtKey } from "../types/game";
import { getCheckpointForLevel } from "./gameConfig";

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

export function chapterArtKey(level: number): ChapterArtKey {
  return getCheckpointForLevel(level).artKey;
}

export function chapterArtSource(artKey: ChapterArtKey): ImageProps["source"] {
  return CHAPTER_SOURCES[artKey];
}

export function chapterBackground(level: number): ImageProps["source"] {
  return chapterArtSource(chapterArtKey(level));
}
