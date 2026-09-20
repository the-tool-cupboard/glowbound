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

/** Full-bleed 9:16 plates. Identity crop on the playfield; square thumbs still cover. */
const FULL_BLEED_PLAYFIELD_ART: ReadonlySet<ChapterArtKey> = new Set(["sleepingWoods"]);

/** Chapter art always cover-crops; never contain / letterbox. */
export const CHAPTER_ART_CONTENT_FIT: NonNullable<ImageProps["contentFit"]> = "cover";
export const CHAPTER_ART_CONTENT_POSITION: NonNullable<ImageProps["contentPosition"]> = "center";

export const CHAPTER_THUMB_CONTENT_FIT = CHAPTER_ART_CONTENT_FIT;
export const CHAPTER_THUMB_CONTENT_POSITION = CHAPTER_ART_CONTENT_POSITION;

/**
 * Chapter stills are 9:16 phone frames. Several stages keep a cinematic 16:9
 * plate with blurred letterbox bars. Square thumbs zoom so that plate fills
 * the frame the way Sleeping Woods already does with ordinary cover.
 *
 * Playfields are already 9:16, so they need an extra 16/9 (the square-cover
 * step thumbs get for free) — `(16/9)^2` — for the same plate to fill the phone.
 */
export const CHAPTER_THUMB_COVER_SCALE = 16 / 9;
export const CHAPTER_PLAYFIELD_COVER_SCALE = CHAPTER_THUMB_COVER_SCALE * CHAPTER_THUMB_COVER_SCALE;

export function chapterCoverCropStyle(scale: number): ImageStyle {
  const sizePercent = `${scale * 100}%` as `${number}%`;
  const insetPercent = `${-((scale - 1) / 2) * 100}%` as `${number}%`;
  return {
    position: "absolute",
    width: sizePercent,
    height: sizePercent,
    top: insetPercent,
    left: insetPercent,
  };
}

export const CHAPTER_THUMB_CROP_STYLE: ImageStyle = chapterCoverCropStyle(CHAPTER_THUMB_COVER_SCALE);
export const CHAPTER_PLAYFIELD_CROP_STYLE: ImageStyle = chapterCoverCropStyle(
  CHAPTER_PLAYFIELD_COVER_SCALE
);

export function chapterArtKey(level: number): ChapterArtKey {
  return getCheckpointForLevel(level).artKey;
}

export function chapterArtSource(artKey: ChapterArtKey): ImageProps["source"] {
  return CHAPTER_SOURCES[artKey];
}

export function chapterBackground(level: number): ImageProps["source"] {
  return chapterArtSource(chapterArtKey(level));
}

export function chapterPlayfieldCoverScale(artKey: ChapterArtKey): number {
  return FULL_BLEED_PLAYFIELD_ART.has(artKey) ? 1 : CHAPTER_PLAYFIELD_COVER_SCALE;
}

export function chapterPlayfieldCropStyle(artKey: ChapterArtKey): ImageStyle {
  return chapterCoverCropStyle(chapterPlayfieldCoverScale(artKey));
}
