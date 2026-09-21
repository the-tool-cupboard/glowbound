import type { DifficultyId } from "../types/economy";
import { FROST_WICK_COST, FROST_WICK_SHOP_CAP, getDifficulty } from "./economyConfig";
import {
  CHECKPOINTS,
  STAGE_COUNT,
  getCheckpointForLevel,
  type Checkpoint,
} from "./gameConfig";

export const NIGHT_LANTERN_TIMEZONE = "America/New_York";
export const LANTERN_PATTERN_COUNT = 5;
export const LANTERN_ATTEMPTS_PER_DAY = 2;
export const LANTERN_MAX_STARS = 3;
export const LANTERN_FREEZE_OWNED_CAP = 99;
export { FROST_WICK_COST, FROST_WICK_SHOP_CAP };

export type LanternWeekdayBand = "easy" | "mid" | "spicy";
export type LanternStars = 0 | 1 | 2 | 3;
export type LanternAvailabilityReason = "available" | "rematch" | "complete";

export interface NightLanternState {
  lastPlayDate: string | null;
  attemptsToday: number;
  attemptsDate: string | null;
  streak: number;
  freezeOwned: number;
  bestStarsByDay: Record<string, number>;
  firstSeenDate: string;
  streakAwardedDate: string | null;
}

export interface LanternAttemptAvailability {
  canStart: boolean;
  canRematch: boolean;
  attemptsRemaining: number;
  reason: LanternAvailabilityReason;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function zonedParts(
  now: Date,
  timeZone: string
): { year: number; month: number; day: number; hour: number; minute: number; weekday: string } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    weekday: map.weekday ?? "Sun",
  };
}

export function calendarDateInZone(
  now: Date,
  timeZone: string = NIGHT_LANTERN_TIMEZONE
): string {
  const parts = zonedParts(now, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

export function addCalendarDays(dateStr: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match == null) {
    return dateStr;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

export function dayIndexFromDate(dateStr: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (match == null) {
    return 0;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function weekdayInZone(now: Date, timeZone: string = NIGHT_LANTERN_TIMEZONE): number {
  const short = zonedParts(now, timeZone).weekday;
  const index = WEEKDAY_SHORT.indexOf(short as (typeof WEEKDAY_SHORT)[number]);
  return index >= 0 ? index : 0;
}

export function lanternWeekdayBandFromWeekday(weekday: number): LanternWeekdayBand {
  const day = ((Math.floor(weekday) % 7) + 7) % 7;
  if (day <= 2) {
    return "easy";
  }
  if (day <= 4) {
    return "mid";
  }
  return "spicy";
}

export function lanternWeekdayBand(
  now: Date,
  timeZone: string = NIGHT_LANTERN_TIMEZONE
): LanternWeekdayBand {
  return lanternWeekdayBandFromWeekday(weekdayInZone(now, timeZone));
}

/** Stage 1–10 from a civil day index. 0 → Sleeping Woods, 9 → The Bound. */
export function chapterIndexFromDayIndex(dayIndex: number): number {
  const safe = Number.isFinite(dayIndex) ? Math.floor(dayIndex) : 0;
  return ((safe % STAGE_COUNT) + STAGE_COUNT) % STAGE_COUNT;
}

export function checkpointForDayIndex(dayIndex: number): Checkpoint {
  const index = chapterIndexFromDayIndex(dayIndex);
  return CHECKPOINTS[index] ?? CHECKPOINTS[0] ?? getCheckpointForLevel(1);
}

export function lanternPlayLevelFromDayIndex(dayIndex: number): number {
  return checkpointForDayIndex(dayIndex).startLevel;
}

export function lanternPlayLevel(
  now: Date,
  timeZone: string = NIGHT_LANTERN_TIMEZONE
): number {
  return lanternPlayLevelFromDayIndex(dayIndexFromDate(calendarDateInZone(now, timeZone)));
}

export function lanternTargetCount(runeCount: number, band: LanternWeekdayBand): number {
  const capacity = Math.max(0, Math.floor(runeCount));
  if (capacity <= 1) {
    return capacity;
  }

  const desired = band === "easy" ? 5 : band === "mid" ? 7 : 9;
  return Math.min(capacity - 1, Math.max(1, desired));
}

export function lanternRoundTargetCount(
  runeCount: number,
  band: LanternWeekdayBand,
  difficulty: DifficultyId
): number {
  const capacity = Math.max(0, Math.floor(runeCount));
  if (capacity <= 1) {
    return capacity;
  }

  const extra = getDifficulty(difficulty).extraTargets;
  return Math.min(capacity - 1, Math.max(1, lanternTargetCount(capacity, band) + extra));
}

export function lanternDifficulty(
  campaignDifficulty: DifficultyId,
  options: {
    firstSeenDate: string;
    today: string;
    highestReachedLevel: number;
  }
): DifficultyId {
  if (campaignDifficulty !== "harsh") {
    return campaignDifficulty;
  }

  const daysSinceSeen = dayIndexFromDate(options.today) - dayIndexFromDate(options.firstSeenDate);
  const newInstall = Math.max(0, Math.floor(options.highestReachedLevel)) <= 1;
  if (newInstall && daysSinceSeen < 3) {
    return "standard";
  }

  return "harsh";
}

export function clampLanternStars(value: number): LanternStars {
  const clamped = clampInt(value, 0, LANTERN_MAX_STARS, 0);
  return clamped as LanternStars;
}

export function lanternStars(input: {
  patternsCleared: number;
  lastChanceUsed: boolean;
  wardUsed: boolean;
}): LanternStars {
  const cleared = Math.max(0, Math.floor(input.patternsCleared));
  if (cleared >= LANTERN_PATTERN_COUNT) {
    if (!input.lastChanceUsed && !input.wardUsed) {
      return 3;
    }
    return 2;
  }
  if (cleared >= 3) {
    return 1;
  }
  return 0;
}

export function lanternStarsCopy(stars: number): string {
  const safe = clampLanternStars(stars);
  if (safe >= 3) {
    return "The lantern holds till dawn.";
  }
  if (safe === 2) {
    return "The lantern almost held.";
  }
  if (safe === 1) {
    return "Embers flickered — one more lighting?";
  }
  return "The wick caught, then dimmed.";
}

export function lanternEmberDrip(stars: number, streak: number): number {
  const safeStars = clampLanternStars(stars);
  const safeStreak = Math.max(0, Number.isFinite(streak) ? Math.floor(streak) : 0);
  return 3 + safeStars * 2 + Math.floor(safeStreak / 7);
}

export function lanternShareCopy(input: {
  patternsCleared: number;
  chapterTitle: string;
  streak: number;
}): string {
  const patterns = Math.max(0, Math.floor(input.patternsCleared));
  const streak = Math.max(0, Math.floor(input.streak));
  const title = input.chapterTitle.trim() || "the night";
  return `Sealed ${patterns} pattern${patterns === 1 ? "" : "s"} under ${title} · streak ${streak}`;
}

export function lanternShareTitle(streak: number): string {
  return Math.max(0, Math.floor(streak)) >= 3 ? "Kindled" : "Lantern seal";
}

export function lanternShareMessage(input: {
  patternsCleared: number;
  chapterTitle: string;
  streak: number;
}): string {
  const body = lanternShareCopy(input);
  return Math.max(0, Math.floor(input.streak)) >= 3 ? `Kindled\n${body}` : body;
}

/** After one Last Chance / Ward recovery, the next miss ends the lantern. */
export function lanternWrongTapEndsRun(mercyAlreadyUsed: boolean): boolean {
  return mercyAlreadyUsed;
}

function sanitizeBestStars(raw: unknown): Record<string, number> {
  if (raw == null || typeof raw !== "object") {
    return {};
  }

  const next: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      continue;
    }
    next[key] = clampLanternStars(typeof value === "number" ? value : Number(value));
  }
  return next;
}

export function pruneBestStarsByDay(
  map: Record<string, number>,
  today: string,
  keepDays = 40
): Record<string, number> {
  const keep: Record<string, number> = {};
  const span = Math.max(1, Math.floor(keepDays));
  for (let i = 0; i < span; i += 1) {
    const date = addCalendarDays(today, -i);
    const stars = map[date];
    if (stars != null) {
      keep[date] = clampLanternStars(stars);
    }
  }
  return keep;
}

export function createNightLanternState(
  partial?: Partial<NightLanternState>,
  today: string = calendarDateInZone(new Date())
): NightLanternState {
  const firstSeen =
    typeof partial?.firstSeenDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(partial.firstSeenDate)
      ? partial.firstSeenDate
      : today;

  return {
    lastPlayDate:
      typeof partial?.lastPlayDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(partial.lastPlayDate)
        ? partial.lastPlayDate
        : null,
    attemptsToday: clampInt(partial?.attemptsToday, 0, LANTERN_ATTEMPTS_PER_DAY, 0),
    attemptsDate:
      typeof partial?.attemptsDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(partial.attemptsDate)
        ? partial.attemptsDate
        : null,
    streak: clampInt(partial?.streak, 0, 10_000, 0),
    freezeOwned: clampInt(partial?.freezeOwned, 0, LANTERN_FREEZE_OWNED_CAP, 0),
    bestStarsByDay: sanitizeBestStars(partial?.bestStarsByDay),
    firstSeenDate: firstSeen,
    streakAwardedDate:
      typeof partial?.streakAwardedDate === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(partial.streakAwardedDate)
        ? partial.streakAwardedDate
        : null,
  };
}

/** Calendar days between last play and today, not counting either endpoint. */
export function calendarDaysMissed(lastPlayDate: string | null, today: string): number {
  if (lastPlayDate == null || lastPlayDate === today) {
    return 0;
  }

  return Math.max(0, dayIndexFromDate(today) - dayIndexFromDate(lastPlayDate) - 1);
}

export function canOfferFrostWick(state: NightLanternState, today: string): boolean {
  const current = createNightLanternState(state, today);
  return (
    calendarDaysMissed(current.lastPlayDate, today) === 1 &&
    current.streak > 0 &&
    current.freezeOwned > 0
  );
}

export function purchaseFrostWick(
  embers: number,
  freezeOwned: number
):
  | { ok: true; embers: number; freezeOwned: number }
  | { ok: false; reason: "cannotAfford" | "capReached" } {
  const safeEmbers = Math.max(0, Number.isFinite(embers) ? Math.floor(embers) : 0);
  const owned = clampInt(freezeOwned, 0, LANTERN_FREEZE_OWNED_CAP, 0);
  if (owned >= FROST_WICK_SHOP_CAP) {
    return { ok: false, reason: "capReached" };
  }
  if (safeEmbers < FROST_WICK_COST) {
    return { ok: false, reason: "cannotAfford" };
  }

  return {
    ok: true,
    embers: safeEmbers - FROST_WICK_COST,
    freezeOwned: owned + 1,
  };
}

export function addFrostWick(state: NightLanternState): NightLanternState | null {
  const current = createNightLanternState(state);
  if (current.freezeOwned >= FROST_WICK_SHOP_CAP) {
    return null;
  }

  return {
    ...current,
    freezeOwned: current.freezeOwned + 1,
  };
}

export function applyFrostWickFreeze(
  state: NightLanternState,
  today: string
): NightLanternState | null {
  const current = createNightLanternState(state, today);
  if (!canOfferFrostWick(current, today)) {
    return null;
  }

  return {
    ...current,
    freezeOwned: current.freezeOwned - 1,
    lastPlayDate: addCalendarDays(today, -1),
  };
}

export function declineFrostWickFreeze(state: NightLanternState, today: string): NightLanternState {
  const current = createNightLanternState(state, today);
  return {
    ...current,
    streak: 0,
  };
}

export function rollNightLanternDay(state: NightLanternState, today: string): NightLanternState {
  const current = createNightLanternState(state, today);
  const missed = calendarDaysMissed(current.lastPlayDate, today);
  let streak = current.streak;

  if (missed >= 1 && !canOfferFrostWick(current, today)) {
    streak = 0;
  }

  const sameAttemptDay = current.attemptsDate === today;
  return {
    ...current,
    streak,
    attemptsToday: sameAttemptDay ? current.attemptsToday : 0,
    attemptsDate: sameAttemptDay ? current.attemptsDate : today,
  };
}

export function lanternAttemptAvailability(
  state: NightLanternState,
  today: string
): LanternAttemptAvailability {
  const rolled = rollNightLanternDay(state, today);
  const remaining = Math.max(0, LANTERN_ATTEMPTS_PER_DAY - rolled.attemptsToday);
  if (remaining <= 0) {
    return { canStart: false, canRematch: false, attemptsRemaining: 0, reason: "complete" };
  }

  if (rolled.attemptsToday <= 0) {
    return { canStart: true, canRematch: false, attemptsRemaining: remaining, reason: "available" };
  }

  const best = clampLanternStars(rolled.bestStarsByDay[today] ?? 0);
  if (best <= 1) {
    return { canStart: true, canRematch: true, attemptsRemaining: remaining, reason: "rematch" };
  }

  return { canStart: false, canRematch: false, attemptsRemaining: remaining, reason: "complete" };
}

export function beginLanternAttempt(
  state: NightLanternState,
  today: string
): NightLanternState | null {
  const held = canOfferFrostWick(state, today)
    ? (applyFrostWickFreeze(state, today) ?? declineFrostWickFreeze(state, today))
    : state;
  const rolled = rollNightLanternDay(held, today);
  const availability = lanternAttemptAvailability(rolled, today);
  if (!availability.canStart) {
    return null;
  }

  return {
    ...rolled,
    attemptsToday: rolled.attemptsToday + 1,
    attemptsDate: today,
    lastPlayDate: today,
  };
}

export function applyLanternResult(
  state: NightLanternState,
  today: string,
  stars: number
): NightLanternState {
  const held = canOfferFrostWick(state, today)
    ? (applyFrostWickFreeze(state, today) ?? declineFrostWickFreeze(state, today))
    : state;
  const rolled = rollNightLanternDay(held, today);
  const availability = lanternAttemptAvailability(rolled, today);
  const attemptsToday = availability.canStart
    ? Math.min(LANTERN_ATTEMPTS_PER_DAY, rolled.attemptsToday + 1)
    : rolled.attemptsToday;
  const safeStars = clampLanternStars(stars);
  const previousBest = clampLanternStars(rolled.bestStarsByDay[today] ?? 0);
  const best = Math.max(previousBest, safeStars) as LanternStars;
  let streak = rolled.streak;
  let streakAwardedDate = rolled.streakAwardedDate;
  if (availability.canStart && safeStars >= 1 && streakAwardedDate !== today) {
    streak += 1;
    streakAwardedDate = today;
  }

  return {
    ...rolled,
    attemptsToday,
    attemptsDate: today,
    lastPlayDate: today,
    streak,
    streakAwardedDate,
    bestStarsByDay: pruneBestStarsByDay({ ...rolled.bestStarsByDay, [today]: best }, today),
  };
}

export function nextZonedMidnightUtc(
  now: Date,
  timeZone: string = NIGHT_LANTERN_TIMEZONE
): Date {
  const today = calendarDateInZone(now, timeZone);
  let lo = now.getTime();
  let hi = lo + 36 * 3_600_000;
  while (hi - lo > 250) {
    const mid = Math.floor((lo + hi) / 2);
    if (calendarDateInZone(new Date(mid), timeZone) === today) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return new Date(hi);
}

export function formatRelitCountdown(ms: number): string {
  const totalMin = Math.max(0, Math.ceil(ms / 60_000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  return `Relit in ${hours}h ${pad2(minutes)}m`;
}

export function lanternRelitLabel(
  now: Date,
  timeZone: string = NIGHT_LANTERN_TIMEZONE
): string {
  const ms = nextZonedMidnightUtc(now, timeZone).getTime() - now.getTime();
  return formatRelitCountdown(ms);
}
