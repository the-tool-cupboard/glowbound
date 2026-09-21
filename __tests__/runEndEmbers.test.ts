import fs from "fs";
import path from "path";

describe("run-end ember grant wiring", () => {
  it("passes calculateEmbersEarned on game-over instead of a hardcoded zero", () => {
    const src = fs.readFileSync(path.join(__dirname, "../app/game.tsx"), "utf8");

    expect(src).toContain("calculateEmbersEarned");
    expect(src).not.toMatch(/embers:\s*"0"/);
  });

  it("applies the formula grant on results after economy storage is ready", () => {
    const src = fs.readFileSync(path.join(__dirname, "../app/results.tsx"), "utf8");

    expect(src).toContain("calculateEmbersEarned");
    expect(src).toContain("addEmbers");
    expect(src).toContain("economyReady");
  });
});
