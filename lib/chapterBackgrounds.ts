import type { ImageProps } from "expo-image";
import type { ImageStyle } from "react-native";

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

/** Square thumbs always cover-crop; never contain / letterbox. */
export const CHAPTER_THUMB_CONTENT_FIT: NonNullable<ImageProps["contentFit"]> = "cover";
export const CHAPTER_THUMB_CONTENT_POSITION: NonNullable<ImageProps["contentPosition"]> = "center";

/**
 * Chapter stills are 9:16 phone frames. Several stages keep a cinematic 16:9
 * plate with blurred letterbox bars. Square thumbs zoom so that plate fills
 * the frame the way Sleeping Woods already does with ordinary cover.
 */
export const CHAPTER_THUMB_COVER_SCALE = 16 / 9;

const thumbSizePercent = `${CHAPTER_THUMB_COVER_SCALE * 100}%`;
const thumbInsetPercent = `${-((CHAPTER_THUMB_COVER_SCALE - 1) / 2) * 100}%`;

export const CHAPTER_THUMB_CROP_STYLE: ImageStyle = {
  position: "absolute",
  width: thumbSizePercent,
  height: thumbSizePercent,
  top: thumbInsetPercent,
  left: thumbInsetPercent,
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
