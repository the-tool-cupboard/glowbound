import fs from "fs";
import path from "path";

describe("night lantern campaign isolation", () => {
  it("skips highestReached writes while a lantern run is active", () => {
    const src = fs.readFileSync(path.join(__dirname, "../app/game.tsx"), "utf8");
    expect(src).toContain("parseGameModeParam");
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

describe("night lantern phase 2 juice wiring", () => {
  it("sells Frost Wick from the shop stall without putting it on the in-run charm bar", () => {
    const shop = fs.readFileSync(path.join(__dirname, "../app/shop.tsx"), "utf8");
    const bar = fs.readFileSync(path.join(__dirname, "../components/PowerUpBar.tsx"), "utf8");
    expect(shop).toContain("SHOP_GOODS");
    expect(shop).toContain("frostWick");
    expect(shop).toContain("grantFrostWick");
    expect(bar).toContain("SHOP_ITEMS");
    expect(bar).not.toContain("frostWick");
  });

  it("offers Frost Wick on Camp and glows the lantern card at streak 7", () => {
    const camp = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf8");
    const card = fs.readFileSync(path.join(__dirname, "../components/NightLanternCard.tsx"), "utf8");
    expect(camp).toContain("FrostWickOffer");
    expect(camp).toContain("applyFreeze");
    expect(camp).toContain("declineFreeze");
    expect(card).toContain("LanternStreakGlow");
    expect(card).toContain("streak >= 7");
  });

  it("shares lantern results from a Kindled card plus the system share sheet", () => {
    const results = fs.readFileSync(path.join(__dirname, "../app/results.tsx"), "utf8");
    expect(results).toContain("LanternShareCard");
    expect(results).toContain("shareLanternSeal");
    expect(results).toContain('label="Share"');
    expect(results).toContain("lanternShareMessage");
    expect(results).toContain("composeShare");
  });
});

describe("night lantern phase 3 social light wiring", () => {
  it("imports and displays friend ghosts on Camp without a backend", () => {
    const camp = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf8");
    expect(camp).toContain("LanternSocialLight");
    expect(camp).toContain("composeShare");
    expect(camp).toContain("importSeal");
    expect(camp).toContain("shareLanternSeal");
    expect(camp).not.toContain("firebase");
  });

  it("keeps the weekly whisper cosmetic on the lantern card", () => {
    const camp = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf8");
    const card = fs.readFileSync(path.join(__dirname, "../components/NightLanternCard.tsx"), "utf8");
    expect(camp).toContain("weeklyWhisper={whisper.isTonight}");
    expect(card).toContain("This week's whisper");
  });
});

describe("night lantern phase 2.5 reminder wiring", () => {
  it("opts in from Camp only and never fetches a remote push token", () => {
    const camp = fs.readFileSync(path.join(__dirname, "../app/index.tsx"), "utf8");
    const layout = fs.readFileSync(path.join(__dirname, "../app/_layout.tsx"), "utf8");
    const notifications = fs.readFileSync(
      path.join(__dirname, "../lib/lanternReminderNotifications.ts"),
      "utf8"
    );
    const hook = fs.readFileSync(path.join(__dirname, "../hooks/useLanternReminder.ts"), "utf8");

    expect(camp).toContain("LanternReminderToggle");
    expect(camp).toContain("toggleLanternReminder");
    expect(layout).toContain("installLanternReminderRuntime");
    expect(camp).not.toContain("requestLanternReminderPermission");
    expect(layout).not.toContain("requestLanternReminderPermission");
    expect(notifications).not.toContain("getExpoPushTokenAsync");
    expect(notifications).not.toContain("getDevicePushTokenAsync");
    expect(hook).toContain("if (next)");
    expect(hook).toContain("requestLanternReminderPermission");
  });

  it("resyncs reminders after a lantern attempt is persisted", () => {
    const lanternHook = fs.readFileSync(path.join(__dirname, "../hooks/useNightLantern.ts"), "utf8");
    expect(lanternHook).toContain("syncLanternReminders");
    expect(lanternHook).toContain("lastPlayDate: next.lastPlayDate");
  });
});
