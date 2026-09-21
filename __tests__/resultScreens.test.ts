import fs from "fs";
import path from "path";

const GAME_IMAGES = path.join(__dirname, "../assets/images/game images");

function pngSize(filePath: string): { width: number; height: number } {
  const data = fs.readFileSync(filePath);
  expect(data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20),
  };
}

describe("result screen art", () => {
  it("ships locked fail and pass stills at 1536x2720", () => {
    const fail = path.join(GAME_IMAGES, "GB_Results-Fail.png");
    const pass = path.join(GAME_IMAGES, "GB_Results-Pass.png");

    expect(fs.existsSync(fail)).toBe(true);
    expect(fs.existsSync(pass)).toBe(true);
    expect(pngSize(fail)).toEqual({ width: 1536, height: 2720 });
    expect(pngSize(pass)).toEqual({ width: 1536, height: 2720 });
  });
});
