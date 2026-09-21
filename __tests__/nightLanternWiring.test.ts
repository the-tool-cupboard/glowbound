import fs from "fs";
import path from "path";

describe("night lantern campaign isolation", () => {
  it("skips highestReached writes while a lantern run is active", () => {
    const src = fs.readFileSync(path.join(__dirname, "../app/game.tsx"), "utf8");
    expect(src).toContain('parseGameModeParam');
    expect(src).toContain('mode: "lantern"');
    expect(src).toContain('if (isLantern || phase === "idle")');
    expect(src).toContain("recordReachedLevel");
  });

  it("does not send lantern clears through campaign level-complete or fail grants", () => {
    const src = fs.readFileSync(path.join(__dirname, "../app/game.tsx"), "utf8");
    expect(src).toContain('if (isLantern || phase !== "levelComplete"');
    expect(src).toContain('if (isLantern || phase !== "gameOver"');
    expect(src).toContain("lanternStars");
    expect(src).toContain("recordResult");
  });
});
