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
  STARTING_EMBERS,
  getDifficulty,
  getShopItem,
} from "./economyConfig";

export function createEconomyState(partial?: Partial<EconomyState>): EconomyState {
  return {
    embers: Math.max(0, Math.floor(partial?.embers ?? STARTING_EMBERS)),
    inventory: {
      ...EMPTY_INVENTORY,
      ...partial?.inventory,
    },
    difficulty: partial?.difficulty ?? "standard",
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
  const capacity = Math.max(0, config.gridSize * config.gridSize);
  const targetCount = Math.min(
    capacity,
    Math.max(1, config.targetCount + spec.extraTargets)
  );
  const previewDurationMs = Math.max(
    500,
    Math.round(config.previewDurationMs * spec.previewMsMultiplier)
  );

  return {
    ...config,
    targetCount,
    previewDurationMs,
  };
}

export function isDifficultyId(value: string | undefined): value is DifficultyId {
  return DIFFICULTIES.some((item) => item.id === value);
}
