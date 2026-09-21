export type DifficultyId = "calm" | "standard" | "harsh";

export type PowerUpId = "secondSight" | "lanternOil" | "ward" | "pathHint";

export type ShopGlyphId = PowerUpId | "frostWick";

export interface ShopListing {
  id: ShopGlyphId;
  name: string;
  description: string;
  cost: number;
}

export interface ShopItem extends ShopListing {
  id: PowerUpId;
}

export interface DifficultyOption {
  id: DifficultyId;
  name: string;
  description: string;
  previewMsMultiplier: number;
  extraTargets: number;
  emberMultiplier: number;
}

export interface Inventory {
  secondSight: number;
  lanternOil: number;
  ward: number;
  pathHint: number;
}

export interface EconomyState {
  embers: number;
  inventory: Inventory;
  difficulty: DifficultyId;
}

export type PurchaseResult =
  | { ok: true; state: EconomyState }
  | { ok: false; reason: "unknownItem" | "cannotAfford" | "capReached" };

export type ConsumeResult =
  | { ok: true; inventory: Inventory }
  | { ok: false; reason: "noneOwned" };
