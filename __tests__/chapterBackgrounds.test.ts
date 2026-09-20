import {
  CHAPTER_ART_CONTENT_FIT,
  CHAPTER_ART_CONTENT_POSITION,
  CHAPTER_PLAYFIELD_COVER_SCALE,
  CHAPTER_PLAYFIELD_CROP_STYLE,
  CHAPTER_THUMB_CONTENT_FIT,
  CHAPTER_THUMB_CONTENT_POSITION,
  CHAPTER_THUMB_COVER_SCALE,
  CHAPTER_THUMB_CROP_STYLE,
  chapterArtKey,
  chapterCoverCropStyle,
  chapterPlayfieldCoverScale,
  chapterPlayfieldCropStyle,
} from "../lib/chapterBackgrounds";
import type { ChapterArtKey } from "../types/game";

const LETTERBOXED_PLAYFIELD_ART: readonly ChapterArtKey[] = [
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

describe("chapter thumbnail cover crop", () => {
  it("uses cover, never contain, for every square stage thumb", () => {
    expect(CHAPTER_THUMB_CONTENT_FIT).toBe("cover");
    expect(CHAPTER_THUMB_CONTENT_POSITION).toBe("center");
    expect(CHAPTER_THUMB_CONTENT_FIT).not.toBe("contain");
    expect(CHAPTER_THUMB_CONTENT_FIT).toBe(CHAPTER_ART_CONTENT_FIT);
    expect(CHAPTER_THUMB_CONTENT_POSITION).toBe(CHAPTER_ART_CONTENT_POSITION);
  });

  it("zooms 16/9 so a cinematic plate fills a square inside 9:16 chapter art", () => {
    const canvasWidth = 1536;
    const squareCoverSourceHeight = canvasWidth;
    const cinematicPlateHeight = canvasWidth * (9 / 16);

    expect(CHAPTER_THUMB_COVER_SCALE).toBeCloseTo(16 / 9);
    expect(squareCoverSourceHeight / CHAPTER_THUMB_COVER_SCALE).toBeCloseTo(cinematicPlateHeight);

    expect(CHAPTER_THUMB_CROP_STYLE).toEqual(chapterCoverCropStyle(CHAPTER_THUMB_COVER_SCALE));
    expect(CHAPTER_THUMB_CROP_STYLE.position).toBe("absolute");
    expect(CHAPTER_THUMB_CROP_STYLE.width).toBe(`${CHAPTER_THUMB_COVER_SCALE * 100}%`);
    expect(CHAPTER_THUMB_CROP_STYLE.height).toBe(`${CHAPTER_THUMB_COVER_SCALE * 100}%`);
    expect(CHAPTER_THUMB_CROP_STYLE.top).toBe(
      `${-((CHAPTER_THUMB_COVER_SCALE - 1) / 2) * 100}%`
    );
    expect(CHAPTER_THUMB_CROP_STYLE.left).toBe(
      `${-((CHAPTER_THUMB_COVER_SCALE - 1) / 2) * 100}%`
    );
  });

  it("keeps chapter art keys stable for Stages list thumbs", () => {
    expect(chapterArtKey(1)).toBe("sleepingWoods");
    expect(chapterArtKey(11)).toBe("castleGate");
    expect(chapterArtKey(21)).toBe("moonwell");
    expect(chapterArtKey(31)).toBe("crystalAscent");
  });
});

describe("chapter playfield cover crop", () => {
  it("uses cover, never contain, for in-run chapter backgrounds", () => {
    expect(CHAPTER_ART_CONTENT_FIT).toBe("cover");
    expect(CHAPTER_ART_CONTENT_POSITION).toBe("center");
    expect(CHAPTER_ART_CONTENT_FIT).not.toBe("contain");
  });

  it("zooms (16/9)^2 so a 16:9 plate covers a 9:16 phone frame", () => {
    const canvasWidth = 1536;
    const canvasHeight = canvasWidth * (16 / 9);
    const cinematicPlateHeight = canvasWidth * (9 / 16);

    expect(CHAPTER_PLAYFIELD_COVER_SCALE).toBeCloseTo((16 / 9) * (16 / 9));
    expect(canvasHeight / CHAPTER_PLAYFIELD_COVER_SCALE).toBeCloseTo(cinematicPlateHeight);
    expect(CHAPTER_PLAYFIELD_CROP_STYLE).toEqual(
      chapterCoverCropStyle(CHAPTER_PLAYFIELD_COVER_SCALE)
    );
  });

  it("keeps Sleeping Woods at identity so the full-bleed plate is not over-cropped", () => {
    expect(chapterPlayfieldCoverScale("sleepingWoods")).toBe(1);
    expect(chapterPlayfieldCropStyle("sleepingWoods")).toEqual(chapterCoverCropStyle(1));
    expect(chapterPlayfieldCropStyle("sleepingWoods").width).toBe("100%");
    expect(chapterPlayfieldCropStyle("sleepingWoods").top).toBe("0%");
  });

  it("cover-crops every letterboxed chapter onto the playfield", () => {
    for (const artKey of LETTERBOXED_PLAYFIELD_ART) {
      expect(chapterPlayfieldCoverScale(artKey)).toBe(CHAPTER_PLAYFIELD_COVER_SCALE);
      expect(chapterPlayfieldCropStyle(artKey)).toEqual(CHAPTER_PLAYFIELD_CROP_STYLE);
    }
  });
});
