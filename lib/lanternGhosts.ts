import { CHECKPOINTS } from "./gameConfig";
import {
  addCalendarDays,
  clampLanternStars,
  type LanternStars,
} from "./nightLantern";

export const LANTERN_GHOST_CAP = 3;
export const LANTERN_GHOST_MARK = "GBG1";
export const LANTERN_GHOST_NAME_MAX = 16;
export const LANTERN_GHOST_CHAPTER_MAX = 40;
export const LANTERN_GHOST_ID_MAX = 16;

export interface LanternGhostSeal {
  id: string;
  name: string | null;
  streak: number;
  chapterTitle: string;
  stars: LanternStars;
  litDate: string;
}

export interface LanternGhost extends LanternGhostSeal {
  importedAt: string;
}

export interface LanternGhostBook {
  selfId: string;
  selfName: string | null;
  ghosts: readonly LanternGhost[];
}

export type GhostImportFailure = "empty" | "invalid" | "self";

export type GhostImportResult =
  | { ok: true; book: LanternGhostBook; ghost: LanternGhost; updated: boolean }
  | { ok: false; reason: GhostImportFailure };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[a-z0-9]{4,16}$/;
const ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function stripControls(value: string): string {
  return value.replace(/[\u0000-\u001F\u007F]/g, "");
}

export function createGhostSealId(random: () => number = Math.random): string {
  let id = "";
  for (let i = 0; i < 6; i += 1) {
    const index = Math.min(ID_ALPHABET.length - 1, Math.max(0, Math.floor(random() * ID_ALPHABET.length)));
    id += ID_ALPHABET[index] ?? ID_ALPHABET[0];
  }
  return id;
}

export function sanitizeGhostId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim().toLowerCase();
  if (!ID_RE.test(cleaned)) {
    return null;
  }

  return cleaned.slice(0, LANTERN_GHOST_ID_MAX);
}

export function sanitizeGhostName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = stripControls(value).replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) {
    return null;
  }

  return cleaned.slice(0, LANTERN_GHOST_NAME_MAX);
}

export function canonicalizeGhostChapter(value: unknown): string {
  if (typeof value !== "string") {
    return "the night";
  }

  const cleaned = stripControls(value).replace(/\s+/g, " ").trim().slice(0, LANTERN_GHOST_CHAPTER_MAX);
  if (cleaned.length === 0) {
    return "the night";
  }

  if (Number.isFinite(asIndex) && asIndex >= 1 && asIndex <= CHECKPOINTS.length && String(asIndex) === cleaned) {
    return CHECKPOINTS[asIndex - 1]?.title ?? cleaned;
  }

  const lower = cleaned.toLowerCase();
  const match = CHECKPOINTS.find((checkpoint) => checkpoint.title.toLowerCase() === lower);
  return match?.title ?? cleaned;
}

export function sanitizeLitDate(value: unknown, fallback: string): string {
  if (typeof value === "string" && DATE_RE.test(value)) {
    return value;
  }

  return DATE_RE.test(fallback) ? fallback : "1970-01-01";
}

export function createLanternGhostSeal(
  partial: Partial<LanternGhostSeal> | null | undefined,
  fallbackDate: string
): LanternGhostSeal | null {
  const id = sanitizeGhostId(partial?.id);
  if (id == null) {
    return null;
  }

  return {
    id,
    name: sanitizeGhostName(partial?.name),
    streak: clampInt(partial?.streak, 0, 10_000, 0),
    chapterTitle: canonicalizeGhostChapter(partial?.chapterTitle),
    stars: clampLanternStars(partial?.stars ?? 0),
    litDate: sanitizeLitDate(partial?.litDate, fallbackDate),
  };
}

function sealFromUnknown(value: unknown, fallbackDate: string): LanternGhostSeal | null {
  if (value == null || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  return createLanternGhostSeal(
    {
      id: record.id,
      name: record.n ?? record.name,
      streak: record.s ?? record.streak,
      chapterTitle: record.ch ?? record.chapterTitle ?? record.chapter,
      stars: record.st ?? record.stars,
      litDate: record.d ?? record.litDate,
    },
    fallbackDate
  );
}

export function encodeLanternGhostSeal(seal: LanternGhostSeal): string {
  const name = encodeURIComponent(seal.name ?? "");
  const chapter = encodeURIComponent(seal.chapterTitle);
  return `${LANTERN_GHOST_MARK}|${seal.id}|${name}|${seal.streak}|${chapter}|${seal.stars}|${seal.litDate}`;
}

export function encodeLanternGhostJson(seal: LanternGhostSeal): string {
  return JSON.stringify({
    v: 1,
    id: seal.id,
    n: seal.name ?? "",
    s: seal.streak,
    ch: seal.chapterTitle,
    st: seal.stars,
    d: seal.litDate,
  });
}

function decodePipeField(value: string | undefined): string {
  if (value == null || value === "") {
    return "";
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCompactSeal(token: string, fallbackDate: string): LanternGhostSeal | null {
  const parts = token.trim().split("|");
  if (parts.length < 7 || parts[0] !== LANTERN_GHOST_MARK) {
    return null;
  }

  return createLanternGhostSeal(
    {
      id: parts[1],
      name: decodePipeField(parts[2]),
      streak: Number(parts[3]),
      chapterTitle: decodePipeField(parts[4]),
      stars: Number(parts[5]),
      litDate: (parts[6] ?? "").replace(/[^0-9-].*$/, ""),
    },
    fallbackDate
  );
}

function extractCompactToken(raw: string): string | null {
  const match = raw.match(/GBG1\|[^\s]+/);
  return match?.[0] ?? null;
}

function parseJsonSeal(raw: string, fallbackDate: string): LanternGhostSeal | null {
  const trimmed = raw.trim();
  const candidates: string[] = [];
  if (trimmed.startsWith("{")) {
    candidates.push(trimmed);
  }

  const embedded = trimmed.match(/\{[\s\S]*\}/);
  if (embedded != null && embedded[0] !== candidates[0]) {
    candidates.push(embedded[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      const seal = sealFromUnknown(parsed, fallbackDate);
      if (seal != null) {
        return seal;
      }
    } catch {
      // Try the next candidate — share text may wrap extra braces.
    }
  }

  return null;
}

export function parseLanternGhostSeal(
  raw: string,
  fallbackDate: string = "1970-01-01"
): LanternGhostSeal | null {
  if (typeof raw !== "string") {
    return null;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const compact = extractCompactToken(trimmed);
  if (compact != null) {
    const fromCompact = parseCompactSeal(compact, fallbackDate);
    if (fromCompact != null) {
      return fromCompact;
    }
  }

  if (trimmed.startsWith(`${LANTERN_GHOST_MARK}|`)) {
    const fromFull = parseCompactSeal(trimmed.split(/\s+/)[0] ?? trimmed, fallbackDate);
    if (fromFull != null) {
      return fromFull;
    }
  }

  return parseJsonSeal(trimmed, fallbackDate);
}

export function lanternGhostShareMessage(human: string, seal: LanternGhostSeal): string {
  return `${human}\n\nA ghost seal for a friend — paste it in Camp.\n${encodeLanternGhostSeal(seal)}`;
}

export function lanternGhostDisplayName(name: string | null): string {
  return name ?? "A friend";
}

export function lanternGhostStatusCopy(ghost: LanternGhostSeal, today: string): string {
  const who = lanternGhostDisplayName(ghost.name);
  if (ghost.litDate === today) {
    return `${who} lit theirs`;
  }
  if (ghost.litDate === addCalendarDays(today, -1)) {
    return `${who} lit last night`;
  }
  return `${who} · ${ghost.chapterTitle}`;
}

function sanitizeGhost(value: unknown, fallbackDate: string): LanternGhost | null {
  if (value == null || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const seal = createLanternGhostSeal(
    {
      id: record.id,
      name: record.name,
      streak: record.streak,
      chapterTitle: record.chapterTitle,
      stars: record.stars,
      litDate: record.litDate,
    },
    fallbackDate
  );
  if (seal == null) {
    return null;
  }

  return {
    ...seal,
    importedAt: sanitizeLitDate(record.importedAt, fallbackDate),
  };
}

function sanitizeGhosts(raw: unknown, fallbackDate: string): LanternGhost[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const seen = new Set<string>();
  const next: LanternGhost[] = [];
  for (const item of raw) {
    const ghost = sanitizeGhost(item, fallbackDate);
    if (ghost == null || seen.has(ghost.id)) {
      continue;
    }
    seen.add(ghost.id);
    next.push(ghost);
    if (next.length >= LANTERN_GHOST_CAP) {
      break;
    }
  }
  return next;
}

export function createLanternGhostBook(
  partial?: Partial<LanternGhostBook> | null,
  options?: { today?: string; random?: () => number }
): LanternGhostBook {
  const today = options?.today ?? "1970-01-01";
  const selfId = sanitizeGhostId(partial?.selfId) ?? createGhostSealId(options?.random);
  return {
    selfId,
    selfName: sanitizeGhostName(partial?.selfName),
    ghosts: sanitizeGhosts(partial?.ghosts, today),
  };
}

export function setLanternGhostSelfName(book: LanternGhostBook, name: string): LanternGhostBook {
  return {
    ...book,
    selfName: sanitizeGhostName(name),
  };
}

export function exportLanternGhostSeal(
  book: LanternGhostBook,
  input: {
    streak: number;
    chapterTitle: string;
    stars: number;
    litDate: string;
  }
): LanternGhostSeal {
  return {
    id: book.selfId,
    name: book.selfName,
    streak: clampInt(input.streak, 0, 10_000, 0),
    chapterTitle: canonicalizeGhostChapter(input.chapterTitle),
    stars: clampLanternStars(input.stars),
    litDate: sanitizeLitDate(input.litDate, input.litDate),
  };
}

export function removeLanternGhost(book: LanternGhostBook, ghostId: string): LanternGhostBook {
  const id = sanitizeGhostId(ghostId);
  if (id == null) {
    return book;
  }

  return {
    ...book,
    ghosts: book.ghosts.filter((ghost) => ghost.id !== id),
  };
}

export function importLanternGhost(
  book: LanternGhostBook,
  raw: string,
  today: string
): GhostImportResult {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "empty" };
  }

  const seal = parseLanternGhostSeal(trimmed, today);
  if (seal == null) {
    return { ok: false, reason: "invalid" };
  }

  if (seal.id === book.selfId) {
    return { ok: false, reason: "self" };
  }

  const ghost: LanternGhost = { ...seal, importedAt: today };
  const existingIndex = book.ghosts.findIndex((item) => item.id === ghost.id);
  if (existingIndex >= 0) {
    const ghosts = book.ghosts.map((item, index) => (index === existingIndex ? ghost : item));
    return { ok: true, book: { ...book, ghosts }, ghost, updated: true };
  }

  const kept =
    book.ghosts.length < LANTERN_GHOST_CAP
      ? [...book.ghosts]
      : [...book.ghosts].sort((a, b) => a.importedAt.localeCompare(b.importedAt)).slice(1);

  return {
    ok: true,
    book: { ...book, ghosts: [...kept, ghost] },
    ghost,
    updated: false,
  };
}

export function ghostImportFailureCopy(reason: GhostImportFailure): string {
  if (reason === "self") {
    return "That's your own lantern.";
  }
  if (reason === "empty") {
    return "Paste a friend's ghost seal first.";
  }
  return "That seal didn't catch.";
}
