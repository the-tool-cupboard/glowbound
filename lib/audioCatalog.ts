import { getLevelInStage, getStageIndex } from "./gameConfig";

export type SfxId =
  | "uiTap"
  | "uiSelect"
  | "runeTap"
  | "runeCorrect"
  | "runeWrong"
  | "previewChime"
  | "stageClear"
  | "levelClear"
  | "gameOver"
  | "charmUse"
  | "wardArm"
  | "purchase"
  | "purchaseFail"
  | "emberGain"
  | "chapterUnlock"
  | "lastChanceSting"
  | "lanternTrialClear"
  | "chapterEnterSleepingWoods"
  | "chapterEnterCastleGate"
  | "chapterEnterMoonwell"
  | "chapterEnterCrystalAscent"
  | "chapterEnterEmberBridge"
  | "chapterEnterTheTower"
  | "chapterEnterStarfall"
  | "chapterEnterHollowCrown"
  | "chapterEnterNightOrchard"
  | "chapterEnterTheBound";

export type ChapterBedBgmId =
  | "chapterBedSleepingWoods"
  | "chapterBedCastleGate"
  | "chapterBedMoonwell"
  | "chapterBedCrystalAscent"
  | "chapterBedEmberBridge"
  | "chapterBedTheTower"
  | "chapterBedStarfall"
  | "chapterBedHollowCrown"
  | "chapterBedNightOrchard"
  | "chapterBedTheBound";

export type BgmId = "menuTheme" | "playTheme" | "resultsTheme" | ChapterBedBgmId;

export type AudioPriority = "low" | "medium" | "high";

export interface SfxEntry {
  id: SfxId;
  purpose: string;
  filename: string;
}

export interface BgmEntry {
  id: BgmId;
  purpose: string;
  filename: string;
  /** Relative path under assets/audio/music — file may be absent. */
  assetPath: string;
}

export interface AudioOpportunity {
  id: string;
  when: string;
  priority: AudioPriority;
}

/** Short-form sound effects — all ship with generated placeholder WAVs. */
export const SFX_CATALOG: readonly SfxEntry[] = [
  { id: "uiTap", purpose: "Primary and ghost button presses", filename: "ui-tap.wav" },
  { id: "uiSelect", purpose: "Difficulty card and selectable list item", filename: "ui-select.wav" },
  { id: "runeTap", purpose: "Rune press during player input", filename: "rune-tap.wav" },
  { id: "runeCorrect", purpose: "Correct rune selection", filename: "rune-correct.wav" },
  { id: "runeWrong", purpose: "Wrong rune selection", filename: "rune-wrong.wav" },
  { id: "previewChime", purpose: "Sequence preview pulse", filename: "preview-chime.wav" },
  { id: "stageClear", purpose: "Stage cleared within a level", filename: "stage-clear.wav" },
  { id: "levelClear", purpose: "Level cleared", filename: "level-clear.wav" },
  { id: "gameOver", purpose: "Run ends or last chance declined", filename: "game-over.wav" },
  { id: "charmUse", purpose: "Power-up or charm consumed", filename: "charm-use.wav" },
  { id: "wardArm", purpose: "Ward armed for next wrong tap", filename: "ward-arm.wav" },
  { id: "purchase", purpose: "Shop purchase success", filename: "purchase.wav" },
  { id: "purchaseFail", purpose: "Cannot afford shop item", filename: "purchase-fail.wav" },
  { id: "emberGain", purpose: "Embers awarded after level complete", filename: "ember-gain.wav" },
  { id: "chapterUnlock", purpose: "New checkpoint chapter becomes available", filename: "chapter-unlock.wav" },
  { id: "lastChanceSting", purpose: "Last-chance menu appears after a wrong rune", filename: "last-chance-sting.wav" },
  { id: "lanternTrialClear", purpose: "Level 100 Lantern Trial cleared", filename: "lantern-trial-clear.wav" },
  { id: "chapterEnterSleepingWoods", purpose: "Enter Sleeping Woods (levels 1–10)", filename: "chapter-enter-sleeping-woods.wav" },
  { id: "chapterEnterCastleGate", purpose: "Enter Castle Gate (levels 11–20)", filename: "chapter-enter-castle-gate.wav" },
  { id: "chapterEnterMoonwell", purpose: "Enter Moonwell (levels 21–30)", filename: "chapter-enter-moonwell.wav" },
  { id: "chapterEnterCrystalAscent", purpose: "Enter Crystal Ascent (levels 31–40)", filename: "chapter-enter-crystal-ascent.wav" },
  { id: "chapterEnterEmberBridge", purpose: "Enter Ember Bridge (levels 41–50)", filename: "chapter-enter-ember-bridge.wav" },
  { id: "chapterEnterTheTower", purpose: "Enter The Tower (levels 51–60)", filename: "chapter-enter-the-tower.wav" },
  { id: "chapterEnterStarfall", purpose: "Enter Starfall (levels 61–70)", filename: "chapter-enter-starfall.wav" },
  { id: "chapterEnterHollowCrown", purpose: "Enter Hollow Crown (levels 71–80)", filename: "chapter-enter-hollow-crown.wav" },
  { id: "chapterEnterNightOrchard", purpose: "Enter Night Orchard (levels 81–90)", filename: "chapter-enter-night-orchard.wav" },
  { id: "chapterEnterTheBound", purpose: "Enter The Bound (levels 91–100)", filename: "chapter-enter-the-bound.wav" },
] as const;

/** Chapter-enter stings in stage order (Sleeping Woods → The Bound). */
export const CHAPTER_ENTER_SFX_IDS: readonly SfxId[] = [
  "chapterEnterSleepingWoods",
  "chapterEnterCastleGate",
  "chapterEnterMoonwell",
  "chapterEnterCrystalAscent",
  "chapterEnterEmberBridge",
  "chapterEnterTheTower",
  "chapterEnterStarfall",
  "chapterEnterHollowCrown",
  "chapterEnterNightOrchard",
  "chapterEnterTheBound",
];

/** Matching chapter-enter sting for a play level, or null if unmapped. */
export function chapterEnterSfxForLevel(level: number): SfxId | null {
  return CHAPTER_ENTER_SFX_IDS[getStageIndex(level) - 1] ?? null;
}

/**
 * Play on run start at a chapter's first level, or when stage index increases
 * versus the previous level in the same run.
 */
export function shouldPlayChapterEnterSfx(previousLevel: number | null, level: number): boolean {
  if (previousLevel == null) {
    return getLevelInStage(level) === 1;
  }
  return getStageIndex(level) > getStageIndex(previousLevel);
}

/** Soft looping chapter beds in stage order (Sleeping Woods → The Bound). */
export const CHAPTER_BED_BGM_IDS: readonly ChapterBedBgmId[] = [
  "chapterBedSleepingWoods",
  "chapterBedCastleGate",
  "chapterBedMoonwell",
  "chapterBedCrystalAscent",
  "chapterBedEmberBridge",
  "chapterBedTheTower",
  "chapterBedStarfall",
  "chapterBedHollowCrown",
  "chapterBedNightOrchard",
  "chapterBedTheBound",
];

const CHAPTER_BED_ENTRIES: readonly BgmEntry[] = [
  {
    id: "chapterBedSleepingWoods",
    purpose: "Sleeping Woods in-run bed (levels 1–10)",
    filename: "chapter-bed-sleeping-woods.wav",
    assetPath: "assets/audio/music/chapter-bed-sleeping-woods.wav",
  },
  {
    id: "chapterBedCastleGate",
    purpose: "Castle Gate in-run bed (levels 11–20)",
    filename: "chapter-bed-castle-gate.wav",
    assetPath: "assets/audio/music/chapter-bed-castle-gate.wav",
  },
  {
    id: "chapterBedMoonwell",
    purpose: "Moonwell in-run bed (levels 21–30)",
    filename: "chapter-bed-moonwell.wav",
    assetPath: "assets/audio/music/chapter-bed-moonwell.wav",
  },
  {
    id: "chapterBedCrystalAscent",
    purpose: "Crystal Ascent in-run bed (levels 31–40)",
    filename: "chapter-bed-crystal-ascent.wav",
    assetPath: "assets/audio/music/chapter-bed-crystal-ascent.wav",
  },
  {
    id: "chapterBedEmberBridge",
    purpose: "Ember Bridge in-run bed (levels 41–50)",
    filename: "chapter-bed-ember-bridge.wav",
    assetPath: "assets/audio/music/chapter-bed-ember-bridge.wav",
  },
  {
    id: "chapterBedTheTower",
    purpose: "The Tower in-run bed (levels 51–60)",
    filename: "chapter-bed-the-tower.wav",
    assetPath: "assets/audio/music/chapter-bed-the-tower.wav",
  },
  {
    id: "chapterBedStarfall",
    purpose: "Starfall in-run bed (levels 61–70)",
    filename: "chapter-bed-starfall.wav",
    assetPath: "assets/audio/music/chapter-bed-starfall.wav",
  },
  {
    id: "chapterBedHollowCrown",
    purpose: "Hollow Crown in-run bed (levels 71–80)",
    filename: "chapter-bed-hollow-crown.wav",
    assetPath: "assets/audio/music/chapter-bed-hollow-crown.wav",
  },
  {
    id: "chapterBedNightOrchard",
    purpose: "Night Orchard in-run bed (levels 81–90)",
    filename: "chapter-bed-night-orchard.wav",
    assetPath: "assets/audio/music/chapter-bed-night-orchard.wav",
  },
  {
    id: "chapterBedTheBound",
    purpose: "The Bound in-run bed (levels 91–100)",
    filename: "chapter-bed-the-bound.wav",
    assetPath: "assets/audio/music/chapter-bed-the-bound.wav",
  },
];

/** Fallback in-run bed when a chapter is unmapped or a bed file is missing. */
export const FALLBACK_CHAPTER_BED_ID: BgmId = "playTheme";

/** Matching chapter bed for a play level, or the shared play-theme fallback. */
export function chapterBedForLevel(level: number): BgmId {
  return CHAPTER_BED_BGM_IDS[getStageIndex(level) - 1] ?? FALLBACK_CHAPTER_BED_ID;
}

/** Background music slots — wired in engine; files optional. */
export const BGM_CATALOG: readonly BgmEntry[] = [
  {
    id: "menuTheme",
    purpose: "Home, difficulty, levels, and shop hubs",
    filename: "menu-theme.wav",
    assetPath: "assets/audio/music/menu-theme.wav",
  },
  {
    id: "playTheme",
    purpose: "Fallback in-run bed when a chapter bed is unmapped",
    filename: "play-theme.wav",
    assetPath: "assets/audio/music/play-theme.wav",
  },
  {
    id: "resultsTheme",
    purpose: "Results and level-complete screens",
    filename: "results-theme.wav",
    assetPath: "assets/audio/music/results-theme.wav",
  },
  ...CHAPTER_BED_ENTRIES,
] as const;

/** Future cues documented for design and implementation planning. */
export const AUDIO_OPPORTUNITIES: readonly AudioOpportunity[] = [
  {
    id: "pathSelectWhoosh",
    when: "Transition from difficulty selection into a run",
    priority: "medium",
  },
  {
    id: "shopOpen",
    when: "Shop screen opens from home ember balance",
    priority: "low",
  },
  {
    id: "highScoreFanfare",
    when: "Player beats their previous best score on results",
    priority: "medium",
  },
  {
    id: "calmPathStinger",
    when: "Calm difficulty selected or run started on calm path",
    priority: "low",
  },
  {
    id: "standardPathStinger",
    when: "Standard difficulty selected or run started",
    priority: "low",
  },
  {
    id: "harshPathStinger",
    when: "Harsh difficulty selected or run started",
    priority: "low",
  },
  {
    id: "lanternFlickerIdle",
    when: "Ambient idle loop on hub screens with lantern motif",
    priority: "low",
  },
  {
    id: "lowEmbersWarning",
    when: "Player attempts a purchase with embers near item cost",
    priority: "medium",
  },
] as const;

export type AudioSource = number | string | null;

/** Bundled SFX requires for Metro — every catalog SFX must resolve. */
export const SFX_SOURCES: Record<SfxId, number> = {
  uiTap: require("../assets/audio/sfx/ui-tap.wav"),
  uiSelect: require("../assets/audio/sfx/ui-select.wav"),
  runeTap: require("../assets/audio/sfx/rune-tap.wav"),
  runeCorrect: require("../assets/audio/sfx/rune-correct.wav"),
  runeWrong: require("../assets/audio/sfx/rune-wrong.wav"),
  previewChime: require("../assets/audio/sfx/preview-chime.wav"),
  stageClear: require("../assets/audio/sfx/stage-clear.wav"),
  levelClear: require("../assets/audio/sfx/level-clear.wav"),
  gameOver: require("../assets/audio/sfx/game-over.wav"),
  charmUse: require("../assets/audio/sfx/charm-use.wav"),
  wardArm: require("../assets/audio/sfx/ward-arm.wav"),
  purchase: require("../assets/audio/sfx/purchase.wav"),
  purchaseFail: require("../assets/audio/sfx/purchase-fail.wav"),
  emberGain: require("../assets/audio/sfx/ember-gain.wav"),
  chapterUnlock: require("../assets/audio/sfx/chapter-unlock.wav"),
  lastChanceSting: require("../assets/audio/sfx/last-chance-sting.wav"),
  lanternTrialClear: require("../assets/audio/sfx/lantern-trial-clear.wav"),
  chapterEnterSleepingWoods: require("../assets/audio/sfx/chapter-enter-sleeping-woods.wav"),
  chapterEnterCastleGate: require("../assets/audio/sfx/chapter-enter-castle-gate.wav"),
  chapterEnterMoonwell: require("../assets/audio/sfx/chapter-enter-moonwell.wav"),
  chapterEnterCrystalAscent: require("../assets/audio/sfx/chapter-enter-crystal-ascent.wav"),
  chapterEnterEmberBridge: require("../assets/audio/sfx/chapter-enter-ember-bridge.wav"),
  chapterEnterTheTower: require("../assets/audio/sfx/chapter-enter-the-tower.wav"),
  chapterEnterStarfall: require("../assets/audio/sfx/chapter-enter-starfall.wav"),
  chapterEnterHollowCrown: require("../assets/audio/sfx/chapter-enter-hollow-crown.wav"),
  chapterEnterNightOrchard: require("../assets/audio/sfx/chapter-enter-night-orchard.wav"),
  chapterEnterTheBound: require("../assets/audio/sfx/chapter-enter-the-bound.wav"),
};

/**
 * Optional BGM requires — populate entries when music files are added.
 * Missing tracks are skipped silently at runtime.
 */
export const BGM_SOURCES: Partial<Record<BgmId, number>> = {
  menuTheme: require("../assets/audio/music/menu-theme.wav"),
  playTheme: require("../assets/audio/music/play-theme.wav"),
  resultsTheme: require("../assets/audio/music/results-theme.wav"),
  chapterBedSleepingWoods: require("../assets/audio/music/chapter-bed-sleeping-woods.wav"),
  chapterBedCastleGate: require("../assets/audio/music/chapter-bed-castle-gate.wav"),
  chapterBedMoonwell: require("../assets/audio/music/chapter-bed-moonwell.wav"),
  chapterBedCrystalAscent: require("../assets/audio/music/chapter-bed-crystal-ascent.wav"),
  chapterBedEmberBridge: require("../assets/audio/music/chapter-bed-ember-bridge.wav"),
  chapterBedTheTower: require("../assets/audio/music/chapter-bed-the-tower.wav"),
  chapterBedStarfall: require("../assets/audio/music/chapter-bed-starfall.wav"),
  chapterBedHollowCrown: require("../assets/audio/music/chapter-bed-hollow-crown.wav"),
  chapterBedNightOrchard: require("../assets/audio/music/chapter-bed-night-orchard.wav"),
  chapterBedTheBound: require("../assets/audio/music/chapter-bed-the-bound.wav"),
};

/** Guard for tests — SFX filenames expected on disk. */
export const SFX_FILENAMES: Record<SfxId, string> = SFX_CATALOG.reduce(
  (acc, entry) => {
    acc[entry.id] = entry.filename;
    return acc;
  },
  {} as Record<SfxId, string>
);
