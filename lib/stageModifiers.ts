import type { DifficultyId } from "../types/economy";
import type { CellId, RuneLayout, RunePoint, StageModifierId } from "../types/game";
import {
  CALM_WOODS_PREVIEW_BONUS_MS,
  getCheckpointForLevel,
  isLanternTrial,
} from "./gameConfig";
import type { Rng } from "./gameEngine";

export const MIRROR_GHOST_MS = 380;
export const MIRROR_SETTLE_MS = 120;
export const MOONWELL_STATUS_NOTE = "Moonwell — the water lies.";
export const FACET_GLINT_MS = 280;
export const RIPEN_ROT_SWAP_MS = 420;
export const EMBER_FADE_WINDOW_MS = 6000;
export const EMBER_FADE_RATIO = 0.4;
export const EMBER_FADE_SWAP_MS = 280;
export const GATE_PULSE_MIN_MS = 170;
export const GATE_PULSE_HOLD_MS = 220;
export const GATE_PULSE_STATUS_NOTE = "Gate pulse — watch it rise.";
export const STARFALL_STEP_MIN_MS = 160;
export const STARFALL_HOLD_MS = 250;
export const STARFALL_WATCH_STATUS_NOTE = "Starfall — watch them fall.";
export const STARFALL_ORDER_STATUS_NOTE = "Starfall — match the order.";
export const CROWN_INPUT_HOLD_MS = 150;
export const CROWN_SHOWN_STATUS_NOTE = "Hollow Crown — one is already claimed.";
export const CROWN_HIDDEN_STATUS_NOTE = "Hollow Crown — a claim waits in shadow.";
export const CROWN_CLAIMED_INPUT_NOTE = "Claimed — tap the rest.";

export type CrownGrantMode = "none" | "shown" | "hiddenUntilInput";
export type SequentialPreview = "none" | "accumulateBottomToTop" | "accumulateTopToBottom";

export interface StageRules {
  modifier: StageModifierId;
  sequentialPreview: SequentialPreview;
  mirrorGhost: boolean;
  facetGlare: boolean;
  emberFade: boolean;
  twoFlight: boolean;
  orderedInput: boolean;
  crownGrant: CrownGrantMode;
  ripenRot: boolean;
  calmPreviewBonusMs: number;
  lanternTrial: boolean;
}

export interface PreviewStep {
  previewCellIds: readonly CellId[];
  glintCellIds: readonly CellId[];
  ghostCellIds: readonly CellId[];
  durationMs: number;
}

export interface RoundPresentation {
  steps: readonly PreviewStep[];
  inputTargets: readonly CellId[];
}

export function resolveStageRules(level: number, difficulty: DifficultyId): StageRules {
  const checkpoint = getCheckpointForLevel(level);
  const modifier = checkpoint.modifier;
  const harsh = difficulty === "harsh";
  const calm = difficulty === "calm";
  const lanternTrial = isLanternTrial(level);

  return {
    modifier,
    sequentialPreview:
      modifier === "gatePulse"
        ? "accumulateBottomToTop"
        : modifier === "fallingOrder"
          ? "accumulateTopToBottom"
          : "none",
    mirrorGhost: modifier === "reflection" && !calm,
    facetGlare: modifier === "facetGlare" && !calm,
    emberFade: modifier === "emberFade",
    twoFlight: modifier === "twoFlight" || lanternTrial,
    orderedInput: modifier === "fallingOrder" && harsh,
    crownGrant:
      modifier === "crownWeight" ? (harsh ? "hiddenUntilInput" : "shown") : "none",
    ripenRot: modifier === "ripenRot",
    calmPreviewBonusMs: modifier === "none" && calm ? CALM_WOODS_PREVIEW_BONUS_MS : 0,
    lanternTrial,
  };
}

export function applyCalmPreviewBonus(
  previewDurationMs: number,
  rules: StageRules
): number {
  return Math.max(0, Math.round(previewDurationMs + rules.calmPreviewBonusMs));
}

export function splitTwoFlight(
  targets: readonly CellId[]
): { a: CellId[]; b: CellId[] } | null {
  if (targets.length < 2) {
    return null;
  }

  const mid = Math.ceil(targets.length / 2);
  const a = targets.slice(0, mid);
  const b = targets.slice(mid);
  if (a.length === 0 || b.length === 0) {
    return null;
  }

  return { a, b };
}

export function sortByBoardY(
  cellIds: readonly CellId[],
  points: readonly RunePoint[],
  direction: "topFirst" | "bottomFirst"
): CellId[] {
  const sign = direction === "topFirst" ? 1 : -1;
  return [...cellIds].sort((left, right) => {
    const a = points[left];
    const b = points[right];
    if (a == null || b == null) {
      return left - right;
    }
    if (a.y !== b.y) {
      return (a.y - b.y) * sign;
    }
    if (a.x !== b.x) {
      return a.x - b.x;
    }
    return left - right;
  });
}

function pointAt(points: readonly RunePoint[], cellId: CellId): RunePoint | null {
  return points[cellId] ?? null;
}

export function nearestNeighbor(
  cellId: CellId,
  points: readonly RunePoint[],
  blocked: ReadonlySet<CellId> = new Set()
): CellId | null {
  const origin = pointAt(points, cellId);
  if (origin == null) {
    return null;
  }

  let bestId: CellId | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let other = 0; other < points.length; other += 1) {
    if (other === cellId || blocked.has(other)) {
      continue;
    }
    const point = points[other];
    if (point == null) {
      continue;
    }
    const dist = Math.hypot(point.x - origin.x, point.y - origin.y);
    if (dist > 0 && dist < bestDist) {
      bestDist = dist;
      bestId = other;
    }
  }

  return bestId;
}

export function mirroredCellId(cellId: CellId, points: readonly RunePoint[]): CellId {
  const origin = pointAt(points, cellId);
  if (origin == null) {
    return cellId;
  }

  const targetX = 1 - origin.x;
  const targetY = origin.y;
  let bestId = cellId;
  let bestDist = Number.POSITIVE_INFINITY;

  for (let other = 0; other < points.length; other += 1) {
    const point = points[other];
    if (point == null) {
      continue;
    }
    const dist = Math.hypot(point.x - targetX, point.y - targetY);
    if (dist < bestDist) {
      bestDist = dist;
      bestId = other;
    }
  }

  return bestId;
}

export function pickFacetGlints(
  runeCount: number,
  targets: readonly CellId[],
  rng: Rng
): CellId[] {
  const blocked = new Set(targets);
  const pool: CellId[] = [];
  for (let id = 0; id < runeCount; id += 1) {
    if (!blocked.has(id)) {
      pool.push(id);
    }
  }

  if (pool.length === 0) {
    return [];
  }

  const want = pool.length >= 4 ? 2 : 1;
  const picked: CellId[] = [];
  for (let i = 0; i < want && pool.length > 0; i += 1) {
    const index = Math.min(pool.length - 1, Math.floor(rng() * pool.length));
    const chosen = pool.splice(index, 1)[0];
    if (chosen !== undefined) {
      picked.push(chosen);
    }
  }

  return picked;
}

export function pickRipenRotSwap(
  targets: readonly CellId[],
  points: readonly RunePoint[],
  rng: Rng
): { from: CellId; to: CellId } | null {
  if (targets.length === 0 || points.length < 2) {
    return null;
  }

  const targetSet = new Set(targets);
  const candidates = [...targets];
  while (candidates.length > 0) {
    const index = Math.min(candidates.length - 1, Math.floor(rng() * candidates.length));
    const from = candidates.splice(index, 1)[0];
    if (from === undefined) {
      continue;
    }
    const neighbor = nearestNeighbor(from, points, targetSet);
    if (neighbor != null) {
      return { from, to: neighbor };
    }
  }

  const fallbackFrom = targets[0];
  if (fallbackFrom === undefined) {
    return null;
  }
  const fallbackTo = nearestNeighbor(fallbackFrom, points, targetSet);
  if (fallbackTo == null) {
    return null;
  }

  return { from: fallbackFrom, to: fallbackTo };
}

export function applyTargetSwap(
  targets: readonly CellId[],
  swap: { from: CellId; to: CellId }
): CellId[] {
  return targets.map((id) => (id === swap.from ? swap.to : id));
}

export function pickGrantedCell(
  targets: readonly CellId[],
  points: readonly RunePoint[]
): CellId | null {
  if (targets.length === 0) {
    return null;
  }

  return sortByBoardY(targets, points, "topFirst")[0] ?? null;
}

export function pickEmberFadeSwap(
  remainingTargets: readonly CellId[],
  points: readonly RunePoint[],
  rng: Rng
): { from: CellId; to: CellId } | null {
  return pickRipenRotSwap(remainingTargets, points, rng);
}

function pulseDuration(totalMs: number, count: number, minMs: number): number {
  if (count <= 0) {
    return Math.max(0, totalMs);
  }
  return Math.max(minMs, Math.floor(totalMs / count));
}

function plainPreviewStep(previewCellIds: readonly CellId[], durationMs: number): PreviewStep {
  return {
    previewCellIds,
    glintCellIds: [],
    ghostCellIds: [],
    durationMs,
  };
}

function accumulatePreviewSteps(
  ordered: readonly CellId[],
  stepMs: number
): PreviewStep[] {
  const steps: PreviewStep[] = [];
  for (let i = 1; i <= ordered.length; i += 1) {
    steps.push(plainPreviewStep(ordered.slice(0, i), stepMs));
  }
  return steps;
}

export function buildRoundPresentation(args: {
  rules: StageRules;
  targets: readonly CellId[];
  layout: RuneLayout;
  previewMs: number;
  kind: "round" | "sight";
  rng: Rng;
}): RoundPresentation {
  const { rules, targets, layout, previewMs, kind, rng } = args;
  const safePreview = Math.max(0, previewMs);

  if (kind === "sight" || targets.length === 0) {
    return {
      steps: [
        {
          previewCellIds: targets,
          glintCellIds: [],
          ghostCellIds: [],
          durationMs: safePreview,
        },
      ],
      inputTargets: targets,
    };
  }

  let inputTargets: readonly CellId[] = targets;
  const steps: PreviewStep[] = [];

  if (rules.sequentialPreview === "accumulateBottomToTop") {
    const ordered = sortByBoardY(targets, layout.points, "bottomFirst");
    const pulseMs = pulseDuration(safePreview, ordered.length, GATE_PULSE_MIN_MS);
    steps.push(...accumulatePreviewSteps(ordered, pulseMs));
    steps.push(plainPreviewStep(ordered, GATE_PULSE_HOLD_MS));
  } else if (rules.sequentialPreview === "accumulateTopToBottom") {
    const ordered = sortByBoardY(targets, layout.points, "topFirst");
    inputTargets = ordered;
    const stepMs = pulseDuration(safePreview, ordered.length, STARFALL_STEP_MIN_MS);
    steps.push(...accumulatePreviewSteps(ordered, stepMs));
    steps.push(plainPreviewStep(ordered, STARFALL_HOLD_MS));
  } else if (rules.facetGlare) {
    const glints = pickFacetGlints(layout.runeCount, targets, rng);
    const glintMs = Math.min(FACET_GLINT_MS, Math.max(80, Math.floor(safePreview * 0.35)));
    const restMs = Math.max(80, safePreview - glintMs);
    steps.push({
      previewCellIds: targets,
      glintCellIds: glints,
      ghostCellIds: [],
      durationMs: glintMs,
    });
    steps.push({
      previewCellIds: targets,
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: restMs,
    });
  } else {
    steps.push({
      previewCellIds: targets,
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: safePreview,
    });
  }

  if (rules.mirrorGhost) {
    steps.push({
      previewCellIds: [],
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: MIRROR_SETTLE_MS,
    });
    const ghosts = targets.map((id) => mirroredCellId(id, layout.points));
    steps.push({
      previewCellIds: [],
      glintCellIds: [],
      ghostCellIds: ghosts,
      durationMs: MIRROR_GHOST_MS,
    });
  }

  if (rules.ripenRot) {
    const swap = pickRipenRotSwap(targets, layout.points, rng);
    if (swap != null) {
      inputTargets = applyTargetSwap(inputTargets, swap);
      steps.push({
        previewCellIds: [],
        glintCellIds: [],
        ghostCellIds: [swap.from, swap.to],
        durationMs: RIPEN_ROT_SWAP_MS,
      });
    }
  }

  if (steps.length === 0) {
    steps.push({
      previewCellIds: targets,
      glintCellIds: [],
      ghostCellIds: [],
      durationMs: safePreview,
    });
  }

  return { steps, inputTargets };
}

export function emberFadeAtMs(): number {
  return Math.round(EMBER_FADE_WINDOW_MS * EMBER_FADE_RATIO);
}

export function flightStatusNote(flightIndex: number, flightCount: number): string | null {
  if (flightCount < 2) {
    return null;
  }

  return `Flight ${flightIndex + 1} of ${flightCount}.`;
}

export function roundPreviewStatusNote(
  rules: StageRules,
  flightIndex: number,
  flightCount: number
): string | null {
  if (rules.lanternTrial) {
    return "Lantern Trial.";
  }

  const flightNote = flightStatusNote(flightIndex, flightCount);
  if (flightNote != null) {
    return flightNote;
  }

  if (rules.modifier === "gatePulse") {
    return GATE_PULSE_STATUS_NOTE;
  }

  if (rules.modifier === "fallingOrder") {
    return rules.orderedInput ? STARFALL_ORDER_STATUS_NOTE : STARFALL_WATCH_STATUS_NOTE;
  }

  if (rules.modifier === "reflection") {
    return MOONWELL_STATUS_NOTE;
  }

  if (rules.modifier === "crownWeight") {
    return rules.crownGrant === "hiddenUntilInput"
      ? CROWN_HIDDEN_STATUS_NOTE
      : CROWN_SHOWN_STATUS_NOTE;
  }

  return null;
}
