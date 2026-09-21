import { CHECKPOINTS, LEVELS_PER_STAGE, getRuneCountForLevel } from "../lib/gameConfig";
import {
  LANTERN_ATTEMPTS_PER_DAY,
  LANTERN_PATTERN_COUNT,
  addCalendarDays,
  addFrostWick,
  applyFrostWickFreeze,
  applyLanternResult,
  beginLanternAttempt,
  calendarDateInZone,
  calendarDaysMissed,
  canOfferFrostWick,
  chapterIndexFromDayIndex,
  checkpointForDayIndex,
  createNightLanternState,
  dayIndexFromDate,
  declineFrostWickFreeze,
  formatRelitCountdown,
  lanternAttemptAvailability,
  lanternDifficulty,
  lanternEmberDrip,
  lanternPlayLevelFromDayIndex,
  lanternRoundTargetCount,
  lanternShareCopy,
  lanternShareMessage,
  lanternShareTitle,
  lanternStars,
  lanternStarsCopy,
  lanternTargetCount,
  lanternWeekdayBandFromWeekday,
  lanternWeeklyWhisper,
  lanternWrongTapEndsRun,
  instantForZonedWallClock,
  nextZonedMidnightUtc,
  pruneBestStarsByDay,
  purchaseFrostWick,
  rollNightLanternDay,
  weekdayInZone,
  weekIndexFromDate,
  whisperedCheckpointFromDate,
} from "../lib/nightLantern";

describe("chapter of the day", () => {
  it("maps dayIndex % 10 onto campaign stages 1–10", () => {
    expect(chapterIndexFromDayIndex(0)).toBe(0);
    expect(checkpointForDayIndex(0).title).toBe("Sleeping Woods");
    expect(lanternPlayLevelFromDayIndex(0)).toBe(1);

    expect(chapterIndexFromDayIndex(9)).toBe(9);
    expect(checkpointForDayIndex(9).title).toBe("The Bound");
    expect(lanternPlayLevelFromDayIndex(9)).toBe(9 * LEVELS_PER_STAGE + 1);

    expect(chapterIndexFromDayIndex(10)).toBe(0);
    expect(chapterIndexFromDayIndex(-1)).toBe(9);
  });

  it("uses each checkpoint start level so lantern never needs highestReached", () => {
    for (let i = 0; i < CHECKPOINTS.length; i += 1) {
      expect(lanternPlayLevelFromDayIndex(i)).toBe(CHECKPOINTS[i]?.startLevel);
    }
  });
});

describe("weekly chapter whisper", () => {
  it("uses floor(dayIndex / 7) % 10 and stays put for a seven-day week", () => {
    expect(weekIndexFromDate("1970-01-01")).toBe(0);
    expect(whisperedCheckpointFromDate("1970-01-01").title).toBe("Sleeping Woods");
    expect(whisperedCheckpointFromDate("1970-01-07").title).toBe("Sleeping Woods");
    expect(whisperedCheckpointFromDate("1970-01-08").title).toBe("Castle Gate");
  });

  it("is independent of the daily chapter rotation except when they happen to match", () => {
    const monday = new Date("1970-01-05T17:00:00.000Z");
    const whisper = lanternWeeklyWhisper(monday, "UTC");
    expect(whisper.title).toBe("Sleeping Woods");
    expect(whisper.isTonight).toBe(false);
    expect(checkpointForDayIndex(dayIndexFromDate("1970-01-05")).title).toBe("Ember Bridge");

    const woodsNight = lanternWeeklyWhisper(new Date("1970-01-01T17:00:00.000Z"), "UTC");
    expect(woodsNight.title).toBe("Sleeping Woods");
    expect(woodsNight.isTonight).toBe(true);
  });
});

describe("weekday pattern length", () => {
  it("uses Woods/Gate-ish counts on Sun–Tue and spicy later in the week", () => {
    expect(lanternWeekdayBandFromWeekday(0)).toBe("easy");
    expect(lanternWeekdayBandFromWeekday(2)).toBe("easy");
    expect(lanternWeekdayBandFromWeekday(3)).toBe("mid");
    expect(lanternWeekdayBandFromWeekday(4)).toBe("mid");
    expect(lanternWeekdayBandFromWeekday(5)).toBe("spicy");
    expect(lanternWeekdayBandFromWeekday(6)).toBe("spicy");
  });

  it("keeps easy days at five targets even on Bound-sized boards", () => {
    const boundRunes = getRuneCountForLevel(91);
    expect(boundRunes).toBeGreaterThan(9);
    expect(lanternTargetCount(boundRunes, "easy")).toBe(5);
    expect(lanternTargetCount(boundRunes, "mid")).toBe(7);
    expect(lanternTargetCount(boundRunes, "spicy")).toBe(9);
  });

  it("applies a mild difficulty overlay on top of the weekday band", () => {
    expect(lanternRoundTargetCount(27, "easy", "calm")).toBe(4);
    expect(lanternRoundTargetCount(27, "easy", "standard")).toBe(5);
    expect(lanternRoundTargetCount(27, "easy", "harsh")).toBe(6);
    expect(lanternTargetCount(9, "spicy")).toBe(8);
  });
});

describe("stars", () => {
  it("awards 3 for a clean five-pattern clear", () => {
    expect(
      lanternStars({ patternsCleared: 5, lastChanceUsed: false, wardUsed: false })
    ).toBe(3);
  });

  it("awards 2 when all five clear after Last Chance or Ward", () => {
    expect(
      lanternStars({ patternsCleared: 5, lastChanceUsed: true, wardUsed: false })
    ).toBe(2);
    expect(
      lanternStars({ patternsCleared: 5, lastChanceUsed: false, wardUsed: true })
    ).toBe(2);
  });

  it("awards 1 after failing with at least three patterns sealed", () => {
    expect(
      lanternStars({ patternsCleared: 3, lastChanceUsed: false, wardUsed: false })
    ).toBe(1);
    expect(
      lanternStars({ patternsCleared: 4, lastChanceUsed: true, wardUsed: true })
    ).toBe(1);
  });

  it("awards 0 when two or fewer patterns are sealed", () => {
    expect(
      lanternStars({ patternsCleared: 0, lastChanceUsed: false, wardUsed: false })
    ).toBe(0);
    expect(
      lanternStars({ patternsCleared: 2, lastChanceUsed: true, wardUsed: false })
    ).toBe(0);
  });

  it("uses near-miss copy from the spec table", () => {
    expect(lanternStarsCopy(3)).toBe("The lantern holds till dawn.");
    expect(lanternStarsCopy(2)).toBe("The lantern almost held.");
    expect(lanternStarsCopy(1)).toBe("Embers flickered — one more lighting?");
  });
});

describe("ember drip", () => {
  it("follows 3 + stars*2 + floor(streak/7) and never returns zero", () => {
    expect(lanternEmberDrip(0, 0)).toBe(3);
    expect(lanternEmberDrip(1, 0)).toBe(5);
    expect(lanternEmberDrip(2, 0)).toBe(7);
    expect(lanternEmberDrip(3, 0)).toBe(9);
    expect(lanternEmberDrip(3, 6)).toBe(9);
    expect(lanternEmberDrip(3, 7)).toBe(10);
    expect(lanternEmberDrip(1, 14)).toBe(7);
  });
});

describe("attempts cap and rematch", () => {
  it("allows a first lighting and one rematch only when stars are at most 1", () => {
    const today = "2026-09-21";
    let state = createNightLanternState({ firstSeenDate: today }, today);
    expect(lanternAttemptAvailability(state, today)).toMatchObject({
      canStart: true,
      canRematch: false,
      reason: "available",
    });

    state = applyLanternResult(state, today, 0);
    expect(state.attemptsToday).toBe(1);
    expect(lanternAttemptAvailability(state, today)).toMatchObject({
      canStart: true,
      canRematch: true,
      attemptsRemaining: 1,
      reason: "rematch",
    });

    state = applyLanternResult(state, today, 3);
    expect(state.attemptsToday).toBe(LANTERN_ATTEMPTS_PER_DAY);
    expect(lanternAttemptAvailability(state, today)).toMatchObject({
      canStart: false,
      canRematch: false,
      reason: "complete",
    });
    expect(beginLanternAttempt(state, today)).toBeNull();
    expect(applyLanternResult(state, today, 3).attemptsToday).toBe(LANTERN_ATTEMPTS_PER_DAY);
  });

  it("blocks a rematch after 2★ or 3★ even with an attempt remaining", () => {
    const today = "2026-09-21";
    const state = applyLanternResult(
      createNightLanternState({ firstSeenDate: today }, today),
      today,
      2
    );
    expect(state.attemptsToday).toBe(1);
    expect(lanternAttemptAvailability(state, today).canStart).toBe(false);
    expect(lanternAttemptAvailability(state, today).canRematch).toBe(false);
    expect(beginLanternAttempt(state, today)).toBeNull();
  });

  it("ends the lantern on the second miss after one mercy", () => {
    expect(lanternWrongTapEndsRun(false)).toBe(false);
    expect(lanternWrongTapEndsRun(true)).toBe(true);
  });
});

describe("streak day rollover", () => {
  it("increments streak once per calendar day when stars are at least 1", () => {
    const today = "2026-09-21";
    let state = applyLanternResult(
      createNightLanternState({ firstSeenDate: today }, today),
      today,
      1
    );
    expect(state.streak).toBe(1);
    expect(state.attemptsToday).toBe(1);

    state = applyLanternResult(state, today, 0);
    expect(state.streak).toBe(1);
    expect(state.attemptsToday).toBe(2);
  });

  it("does not increment on a 0★ day that was still played", () => {
    const today = "2026-09-21";
    const state = applyLanternResult(
      createNightLanternState(
        { firstSeenDate: today, streak: 4, lastPlayDate: "2026-09-20" },
        today
      ),
      today,
      0
    );
    expect(state.streak).toBe(4);
    expect(state.attemptsToday).toBe(1);
  });

  it("resets streak when a calendar day is missed", () => {
    const today = "2026-09-21";
    const skipped = rollNightLanternDay(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-10",
          lastPlayDate: "2026-09-19",
          streak: 6,
          attemptsToday: 2,
          attemptsDate: "2026-09-19",
        },
        today
      ),
      today
    );

    expect(skipped.streak).toBe(0);
    expect(skipped.attemptsToday).toBe(0);
    expect(addCalendarDays("2026-09-19", 1)).toBe("2026-09-20");
  });

  it("keeps streak alive when yesterday was the last play date", () => {
    const today = "2026-09-21";
    const rolled = rollNightLanternDay(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-01",
          lastPlayDate: "2026-09-20",
          streak: 6,
          attemptsToday: 2,
          attemptsDate: "2026-09-20",
        },
        today
      ),
      today
    );

    expect(rolled.streak).toBe(6);
    expect(rolled.attemptsToday).toBe(0);

    const played = applyLanternResult(rolled, today, 1);
    expect(played.streak).toBe(7);
    expect(played.attemptsToday).toBe(1);
  });

  it("does not spend freezeOwned until a Frost Wick is used", () => {
    const today = "2026-09-21";
    const rolled = rollNightLanternDay(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-01",
          lastPlayDate: "2026-09-19",
          streak: 8,
          freezeOwned: 2,
        },
        today
      ),
      today
    );
    expect(rolled.streak).toBe(8);
    expect(rolled.freezeOwned).toBe(2);
    expect(canOfferFrostWick(rolled, today)).toBe(true);
  });
});

describe("Frost Wick purchase and streak freeze", () => {
  it("buys a wick for 40 embers and stops at the shop cap of 3", () => {
    expect(purchaseFrostWick(40, 0)).toEqual({ ok: true, embers: 0, freezeOwned: 1 });
    expect(purchaseFrostWick(39, 0)).toEqual({ ok: false, reason: "cannotAfford" });
    expect(purchaseFrostWick(120, 3)).toEqual({ ok: false, reason: "capReached" });

    const granted = addFrostWick(createNightLanternState({ freezeOwned: 2 }, "2026-09-21"));
    expect(granted?.freezeOwned).toBe(3);
    expect(addFrostWick(createNightLanternState({ freezeOwned: 3 }, "2026-09-21"))).toBeNull();
  });

  it("holds streak when exactly one calendar day was missed and a wick is used", () => {
    const today = "2026-09-21";
    const atRisk = createNightLanternState(
      {
        firstSeenDate: "2026-09-01",
        lastPlayDate: "2026-09-19",
        streak: 6,
        freezeOwned: 1,
      },
      today
    );

    expect(calendarDaysMissed("2026-09-19", today)).toBe(1);
    expect(canOfferFrostWick(atRisk, today)).toBe(true);

    const held = applyFrostWickFreeze(atRisk, today);
    expect(held).not.toBeNull();
    expect(held?.streak).toBe(6);
    expect(held?.freezeOwned).toBe(0);
    expect(held?.lastPlayDate).toBe("2026-09-20");
    expect(canOfferFrostWick(held!, today)).toBe(false);

    const played = applyLanternResult(held!, today, 1);
    expect(played.streak).toBe(7);
    expect(played.freezeOwned).toBe(0);
  });

  it("resets streak when the freeze is declined", () => {
    const today = "2026-09-21";
    const declined = declineFrostWickFreeze(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-01",
          lastPlayDate: "2026-09-19",
          streak: 6,
          freezeOwned: 2,
        },
        today
      ),
      today
    );

    expect(declined.streak).toBe(0);
    expect(declined.freezeOwned).toBe(2);
    expect(canOfferFrostWick(declined, today)).toBe(false);
  });

  it("cannot cover a two-day gap even with a wick in the pack", () => {
    const today = "2026-09-21";
    const skipped = rollNightLanternDay(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-01",
          lastPlayDate: "2026-09-18",
          streak: 9,
          freezeOwned: 2,
        },
        today
      ),
      today
    );

    expect(calendarDaysMissed("2026-09-18", today)).toBe(2);
    expect(skipped.streak).toBe(0);
    expect(skipped.freezeOwned).toBe(2);
    expect(canOfferFrostWick(skipped, today)).toBe(false);
    expect(applyFrostWickFreeze(skipped, today)).toBeNull();
  });

  it("consumes one wick if a result is recorded while the freeze is still pending", () => {
    const today = "2026-09-21";
    const played = applyLanternResult(
      createNightLanternState(
        {
          firstSeenDate: "2026-09-01",
          lastPlayDate: "2026-09-19",
          streak: 4,
          freezeOwned: 1,
        },
        today
      ),
      today,
      2
    );

    expect(played.streak).toBe(5);
    expect(played.freezeOwned).toBe(0);
    expect(played.lastPlayDate).toBe(today);
  });
});

describe("difficulty overlay", () => {
  it("does not force Harsh on the first three install days of a new campaign", () => {
    expect(
      lanternDifficulty("harsh", {
        firstSeenDate: "2026-09-21",
        today: "2026-09-23",
        highestReachedLevel: 1,
      })
    ).toBe("standard");
    expect(
      lanternDifficulty("harsh", {
        firstSeenDate: "2026-09-21",
        today: "2026-09-24",
        highestReachedLevel: 1,
      })
    ).toBe("harsh");
  });

  it("keeps Calm/Standard and does not nerf veterans who already left Woods", () => {
    expect(
      lanternDifficulty("calm", {
        firstSeenDate: "2026-09-21",
        today: "2026-09-21",
        highestReachedLevel: 1,
      })
    ).toBe("calm");
    expect(
      lanternDifficulty("harsh", {
        firstSeenDate: "2026-09-21",
        today: "2026-09-21",
        highestReachedLevel: 12,
      })
    ).toBe("harsh");
  });
});

describe("calendar helpers", () => {
  it("formats America/New_York civil dates and weekdays", () => {
    const mondayAfternoonUtc = new Date("2026-09-21T20:00:00.000Z");
    expect(calendarDateInZone(mondayAfternoonUtc)).toBe("2026-09-21");
    expect(weekdayInZone(mondayAfternoonUtc)).toBe(1);
    expect(dayIndexFromDate("1970-01-01")).toBe(0);
  });

  it("counts down to the next New York midnight", () => {
    const beforeMidnight = new Date("2026-09-22T03:10:00.000Z");
    expect(calendarDateInZone(beforeMidnight)).toBe("2026-09-21");
    const next = nextZonedMidnightUtc(beforeMidnight);
    expect(calendarDateInZone(next)).toBe("2026-09-22");
    expect(formatRelitCountdown(75 * 60 * 1000)).toBe("Relit in 1h 15m");
  });

  it("resolves 20:00 America/New_York in EDT and EST", () => {
    const duskEdt = instantForZonedWallClock("2026-09-21", 20, 0);
    expect(Math.abs(duskEdt.getTime() - Date.parse("2026-09-22T00:00:00.000Z"))).toBeLessThan(1000);
    expect(calendarDateInZone(duskEdt)).toBe("2026-09-21");

    const duskEst = instantForZonedWallClock("2026-01-15", 20, 0);
    expect(Math.abs(duskEst.getTime() - Date.parse("2026-01-16T01:00:00.000Z"))).toBeLessThan(1000);
    expect(calendarDateInZone(duskEst)).toBe("2026-01-15");
  });

  it("prunes old best-star days and writes share copy", () => {
    const pruned = pruneBestStarsByDay(
      { "2026-09-21": 3, "2025-01-01": 2 },
      "2026-09-21",
      7
    );
    expect(pruned["2026-09-21"]).toBe(3);
    expect(pruned["2025-01-01"]).toBeUndefined();
    expect(
      lanternShareCopy({ patternsCleared: 5, chapterTitle: "Moonwell", streak: 3 })
    ).toBe("Sealed 5 patterns under Moonwell · streak 3");
    expect(lanternShareTitle(3)).toBe("Kindled");
    expect(lanternShareTitle(2)).toBe("Lantern seal");
    expect(
      lanternShareMessage({ patternsCleared: 5, chapterTitle: "Moonwell", streak: 3 })
    ).toBe("Kindled\nSealed 5 patterns under Moonwell · streak 3");
    expect(LANTERN_PATTERN_COUNT).toBe(5);
  });
});
