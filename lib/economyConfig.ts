import type { DifficultyId, DifficultyOption, Inventory, PowerUpId, ShopItem } from "../types/economy";

export const STARTING_EMBERS = 20;
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
    description: "Lights one rune you still need.",
    cost: 25,
  },
  {
    id: "lanternOil",
    name: "Lantern Oil",
    description: "Makes the next reveal last longer.",
    cost: 35,
  },
  {
    id: "secondSight",
    name: "Second Sight",
    description: "Shows the pattern again, briefly.",
    cost: 50,
  },
  {
    id: "ward",
    name: "Rune Ward",
    description: "Ignores the next wrong tap.",
    cost: 60,
  },
];

export const DIFFICULTIES: readonly DifficultyOption[] = [
  {
    id: "calm",
    name: "Calm",
    description: "Longer glow, one fewer rune, fewer embers.",
    previewMsMultiplier: 1.25,
    extraTargets: -1,
    emberMultiplier: 0.75,
  },
  {
    id: "standard",
    name: "Standard",
    description: "Normal glow, rune count, and embers.",
    previewMsMultiplier: 1,
    extraTargets: 0,
    emberMultiplier: 1,
  },
  {
    id: "harsh",
    name: "Harsh",
    description: "Shorter glow, one extra rune, richer embers.",
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
