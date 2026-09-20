import {
  CHAPTER_THUMB_CONTENT_FIT,
  CHAPTER_THUMB_CONTENT_POSITION,
  CHAPTER_THUMB_COVER_SCALE,
  CHAPTER_THUMB_CROP_STYLE,
  chapterArtKey,
} from "../lib/chapterBackgrounds";

describe("chapter thumbnail cover crop", () => {
  it("uses cover, never contain, for every square stage thumb", () => {
    expect(CHAPTER_THUMB_CONTENT_FIT).toBe("cover");
    expect(CHAPTER_THUMB_CONTENT_POSITION).toBe("center");
    expect(CHAPTER_THUMB_CONTENT_FIT).not.toBe("contain");
  });

  it("zooms 16/9 so a cinematic plate fills a square inside 9:16 chapter art", () => {
    const canvasWidth = 1536;
    const squareCoverSourceHeight = canvasWidth;
    const cinematicPlateHeight = canvasWidth * (9 / 16);

    expect(CHAPTER_THUMB_COVER_SCALE).toBeCloseTo(16 / 9);
    expect(squareCoverSourceHeight / CHAPTER_THUMB_COVER_SCALE).toBeCloseTo(cinematicPlateHeight);

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
