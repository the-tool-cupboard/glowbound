import type { LevelConfig } from "../types/game";
import type {
  ConsumeResult,
  DifficultyId,
  EconomyState,
  Inventory,
  PowerUpId,
  PurchaseResult,
} from "../types/economy";
import {
  DIFFICULTIES,
  EMPTY_INVENTORY,
  MAX_OWNED_PER_ITEM,
  STARTING_EMBERS,
  getDifficulty,
  getShopItem,
} from "./economyConfig";
import { MIN_PREVIEW_MS } from "./gameConfig";

function sanitizeCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(MAX_OWNED_PER_ITEM, Math.max(0, Math.floor(parsed)));
}

function sanitizeInventory(partial?: Partial<Inventory>): Inventory {
  return {
    secondSight: sanitizeCount(partial?.secondSight),
    lanternOil: sanitizeCount(partial?.lanternOil),
    ward: sanitizeCount(partial?.ward),
    pathHint: sanitizeCount(partial?.pathHint),
  };
}

export function isDifficultyId(value: string | undefined): value is DifficultyId {
  return DIFFICULTIES.some((item) => item.id === value);
}

export function isInventoryFull(inventory: Inventory, itemId: PowerUpId): boolean {
  return sanitizeCount(inventory[itemId]) >= MAX_OWNED_PER_ITEM;
}

export function createEconomyState(partial?: Partial<EconomyState>): EconomyState {
  const embersRaw = partial?.embers;
  const embersParsed = typeof embersRaw === "number" ? embersRaw : Number(embersRaw);

  return {
    embers: Number.isFinite(embersParsed)
      ? Math.max(0, Math.floor(embersParsed))
      : STARTING_EMBERS,
    inventory: sanitizeInventory(partial?.inventory),
    difficulty: isDifficultyId(partial?.difficulty) ? partial.difficulty : "standard",
  };
}

export function canAfford(embers: number, cost: number): boolean {
  return Math.max(0, Math.floor(embers)) >= Math.max(0, Math.floor(cost));
}

export function calculateLanternShards(
  completedLevel: number,
  difficulty: DifficultyId
): number {
  const safeLevel = Math.max(1, Math.floor(completedLevel));
  const multiplier = getDifficulty(difficulty).emberMultiplier;
  return Math.max(1, Math.floor((8 + safeLevel * 2) * multiplier));
}

export function calculateEmbersEarned(
  score: number,
  reachedLevel: number,
  difficulty: DifficultyId
): number {
  const completedLevels = Math.max(0, Math.floor(reachedLevel) - 1);
  const safeScore = Math.max(0, Math.floor(score));
  const multiplier = getDifficulty(difficulty).emberMultiplier;
  const raw = completedLevels * 8 + Math.floor(safeScore / 20);
  return Math.max(0, Math.floor(raw * multiplier));
}

export function purchaseItem(state: EconomyState, itemId: PowerUpId): PurchaseResult {
  const item = getShopItem(itemId);
  if (!item) {
    return { ok: false, reason: "unknownItem" };
  }

  if (isInventoryFull(state.inventory, itemId)) {
    return { ok: false, reason: "capReached" };
  }

  if (!canAfford(state.embers, item.cost)) {
    return { ok: false, reason: "cannotAfford" };
  }

  return {
    ok: true,
    state: {
      ...state,
      embers: state.embers - item.cost,
      inventory: {
        ...state.inventory,
        [itemId]: state.inventory[itemId] + 1,
      },
    },
  };
}

export function consumePowerUp(inventory: Inventory, itemId: PowerUpId): ConsumeResult {
  const owned = inventory[itemId] ?? 0;
  if (owned <= 0) {
    return { ok: false, reason: "noneOwned" };
  }

  return {
    ok: true,
    inventory: {
      ...inventory,
      [itemId]: owned - 1,
    },
  };
}

export function applyDifficultyToConfig(
  config: LevelConfig,
  difficulty: DifficultyId
): LevelConfig {
  const spec = getDifficulty(difficulty);
  const capacity = Math.max(0, config.runeCount);
  const targetCount = Math.min(
    capacity,
    Math.max(1, config.targetCount + spec.extraTargets)
  );
  const previewDurationMs = Math.max(
    MIN_PREVIEW_MS,
    Math.round(config.previewDurationMs * spec.previewMsMultiplier)
  );

  return {
    ...config,
    targetCount,
    previewDurationMs,
  };
}
