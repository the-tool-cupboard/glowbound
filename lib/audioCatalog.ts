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
  | "lanternTrialClear";

export type BgmId = "menuTheme" | "playTheme" | "resultsTheme";

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
] as const;

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
    purpose: "Active run on the game screen",
    filename: "play-theme.wav",
    assetPath: "assets/audio/music/play-theme.wav",
  },
  {
    id: "resultsTheme",
    purpose: "Results and level-complete screens",
    filename: "results-theme.wav",
    assetPath: "assets/audio/music/results-theme.wav",
  },
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
};

/**
 * Optional BGM requires — populate entries when music files are added.
 * Missing tracks are skipped silently at runtime.
 */
export const BGM_SOURCES: Partial<Record<BgmId, number>> = {
  menuTheme: require("../assets/audio/music/menu-theme.wav"),
  playTheme: require("../assets/audio/music/play-theme.wav"),
  resultsTheme: require("../assets/audio/music/results-theme.wav"),
};

/** Guard for tests — SFX filenames expected on disk. */
export const SFX_FILENAMES: Record<SfxId, string> = SFX_CATALOG.reduce(
  (acc, entry) => {
    acc[entry.id] = entry.filename;
    return acc;
  },
  {} as Record<SfxId, string>
);
