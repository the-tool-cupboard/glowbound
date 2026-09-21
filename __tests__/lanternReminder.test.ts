import {
  LANTERN_REMINDER_BODY,
  LANTERN_REMINDER_HOUR,
  LANTERN_REMINDER_IDENTIFIER_PREFIX,
  LANTERN_REMINDER_LOOKAHEAD_DAYS,
  LANTERN_REMINDER_TITLE,
  lanternReminderIdentifier,
  lanternReminderReconcileActions,
  planLanternReminders,
} from "../lib/lanternReminder";
import { calendarDateInZone } from "../lib/nightLantern";

describe("lantern reminder planning", () => {
  it("schedules nothing until the player opts in", () => {
    const now = new Date("2026-09-21T16:00:00.000Z");
    expect(
      planLanternReminders({
        now,
        optedIn: false,
        lastPlayDate: null,
      })
    ).toEqual([]);
  });

  it("uses soft fantasy copy and a single identifier per civil day", () => {
    expect(LANTERN_REMINDER_TITLE).toBe("Your lantern waits");
    expect(LANTERN_REMINDER_BODY.toLowerCase()).toContain("unlit");
    expect(lanternReminderIdentifier("2026-09-21")).toBe(
      `${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21`
    );
  });

  it("schedules tonight's 20:00 ET when the lantern is still dark", () => {
    const now = new Date("2026-09-21T16:00:00.000Z");
    const plan = planLanternReminders({
      now,
      optedIn: true,
      lastPlayDate: null,
    });

    expect(plan[0]?.civilDate).toBe("2026-09-21");
    expect(calendarDateInZone(plan[0]?.fireAt ?? now)).toBe("2026-09-21");
    expect(
      Math.abs((plan[0]?.fireAt.getTime() ?? 0) - Date.parse("2026-09-22T00:00:00.000Z"))
    ).toBeLessThan(1000);
    expect(plan).toHaveLength(LANTERN_REMINDER_LOOKAHEAD_DAYS);
    expect(new Set(plan.map((slot) => slot.civilDate)).size).toBe(plan.length);
  });

  it("skips tonight after dusk and after a completed attempt", () => {
    const afterDusk = planLanternReminders({
      now: new Date("2026-09-22T01:10:00.000Z"),
      optedIn: true,
      lastPlayDate: null,
    });
    expect(afterDusk[0]?.civilDate).toBe("2026-09-22");
    expect(afterDusk.some((slot) => slot.civilDate === "2026-09-21")).toBe(false);

    const alreadyLit = planLanternReminders({
      now: new Date("2026-09-21T16:00:00.000Z"),
      optedIn: true,
      lastPlayDate: "2026-09-21",
    });
    expect(alreadyLit[0]?.civilDate).toBe("2026-09-22");
    expect(alreadyLit.some((slot) => slot.civilDate === "2026-09-21")).toBe(false);
  });

  it("cancels leftover days and never stacks two reminders on one date", () => {
    const now = new Date("2026-09-21T16:00:00.000Z");
    const plan = planLanternReminders({
      now,
      optedIn: true,
      lastPlayDate: "2026-09-21",
    });
    const leftover = `${LANTERN_REMINDER_IDENTIFIER_PREFIX}2026-09-21`;
    const actions = lanternReminderReconcileActions(plan, [
      leftover,
      plan[0]?.identifier ?? "",
      "other.notification",
    ]);

    expect(actions.cancel).toEqual([leftover]);
    expect(actions.schedule.some((slot) => slot.identifier === leftover)).toBe(false);
    expect(plan[0]?.identifier).not.toBe(leftover);
    expect(LANTERN_REMINDER_HOUR).toBe(20);
  });
});
