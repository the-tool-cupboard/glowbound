import type { DifficultyId, DifficultyOption, Inventory, PowerUpId, ShopItem } from "../types/economy";

export const STARTING_EMBERS = 25;
export const MAX_OWNED_PER_ITEM = 3;
export const SECOND_SIGHT_MS = 900;
export const LANTERN_OIL_BONUS_MS = 700;
export const WARD_FLASH_MS = 500;

export const EMPTY_INVENTORY: Inventory = {
  secondSight: 0,
  lanternOil: 0,
  ward: 0,
  pathHint: 0,
};

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: "pathHint",
    name: "Path Hint",
    description: "Lights a leftover rune. Use when close.",
    cost: 25,
  },
  {
    id: "lanternOil",
    name: "Lantern Oil",
    description: "Longer next reveal. Use on hard patterns.",
    cost: 35,
  },
  {
    id: "secondSight",
    name: "Second Sight",
    description: "A brief replay. Use after embers fade.",
    cost: 50,
  },
  {
    id: "ward",
    name: "Rune Ward",
    description: "Ignores a miss. Use when guessing.",
    cost: 60,
  },
];

export const DIFFICULTIES: readonly DifficultyOption[] = [
  {
    id: "calm",
    name: "Calm",
    description: "The lantern lingers. One fewer rune.",
    previewMsMultiplier: 1.25,
    extraTargets: -1,
    emberMultiplier: 0.75,
  },
  {
    id: "standard",
    name: "Standard",
    description: "The true path. Fair glow.",
    previewMsMultiplier: 1,
    extraTargets: 0,
    emberMultiplier: 1,
  },
  {
    id: "harsh",
    name: "Harsh",
    description: "A fleeting spark. One extra rune.",
    previewMsMultiplier: 0.7,
    extraTargets: 1,
    emberMultiplier: 1.5,
  },
];

export function getShopItem(id: PowerUpId): ShopItem | undefined {
  return SHOP_ITEMS.find((item) => item.id === id);
}

export function getDifficulty(id: DifficultyId): DifficultyOption {
  return DIFFICULTIES.find((item) => item.id === id) ?? DIFFICULTIES[1]!;
}

export function formatEmberMultiplier(multiplier: number): string {
  return `${multiplier}x`;
}
