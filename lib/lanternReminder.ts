import {
  NIGHT_LANTERN_TIMEZONE,
  addCalendarDays,
  calendarDateInZone,
  instantForZonedWallClock,
} from "./nightLantern";

export const LANTERN_REMINDER_HOUR = 20;
export const LANTERN_REMINDER_MINUTE = 0;
export const LANTERN_REMINDER_LOOKAHEAD_DAYS = 7;
export const LANTERN_REMINDER_IDENTIFIER_PREFIX = "glowbound.lantern.evening.";
export const LANTERN_REMINDER_CHANNEL_ID = "lantern-evening";
export const LANTERN_REMINDER_TITLE = "Your lantern waits";
export const LANTERN_REMINDER_BODY =
  "Tonight's wick is still unlit — a short lighting, if you wish.";

export interface LanternReminderSlot {
  identifier: string;
  civilDate: string;
  fireAt: Date;
}

export interface LanternReminderPlanInput {
  now: Date;
  optedIn: boolean;
  lastPlayDate: string | null;
  timeZone?: string;
}

export function lanternReminderIdentifier(civilDate: string): string {
  return `${LANTERN_REMINDER_IDENTIFIER_PREFIX}${civilDate}`;
}

export function isLanternReminderIdentifier(identifier: string): boolean {
  return identifier.startsWith(LANTERN_REMINDER_IDENTIFIER_PREFIX);
}

export function planLanternReminders(input: LanternReminderPlanInput): LanternReminderSlot[] {
  if (!input.optedIn) {
    return [];
  }

  const timeZone = input.timeZone ?? NIGHT_LANTERN_TIMEZONE;
  const today = calendarDateInZone(input.now, timeZone);
  const slots: LanternReminderSlot[] = [];

  for (let i = 0; i <= LANTERN_REMINDER_LOOKAHEAD_DAYS; i += 1) {
    const civilDate = addCalendarDays(today, i);
    if (civilDate === input.lastPlayDate) {
      continue;
    }

    const fireAt = instantForZonedWallClock(
      civilDate,
      LANTERN_REMINDER_HOUR,
      LANTERN_REMINDER_MINUTE,
      timeZone
    );
    if (!Number.isFinite(fireAt.getTime()) || fireAt.getTime() <= input.now.getTime()) {
      continue;
    }

    slots.push({
      identifier: lanternReminderIdentifier(civilDate),
      civilDate,
      fireAt,
    });
    if (slots.length >= LANTERN_REMINDER_LOOKAHEAD_DAYS) {
      break;
    }
  }

  return slots;
}

export function lanternReminderReconcileActions(
  plan: LanternReminderSlot[],
  existingIdentifiers: string[]
): { cancel: string[]; schedule: LanternReminderSlot[] } {
  const plannedIds = new Set(plan.map((slot) => slot.identifier));
  const existing = existingIdentifiers.filter(isLanternReminderIdentifier);
  const existingSet = new Set(existing);
  return {
    cancel: existing.filter((id) => !plannedIds.has(id)),
    schedule: plan.filter((slot) => !existingSet.has(slot.identifier)),
  };
}
