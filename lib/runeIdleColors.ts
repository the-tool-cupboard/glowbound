import type { LayoutId } from "../types/game";
import { theme } from "./theme";

export interface IdleColors {
  fill: string;
  border: string;
}

/**
 * Resting idle fill + rim for each gem layout.
 * Preview / selected / correct / wrong / glint / ghost / cooled stay on global tokens.
 * Cooled ember idle is a separate visual state and is not returned here.
 */
const IDLE_COLORS_BY_LAYOUT: Record<LayoutId, IdleColors> = {
  grid: {
    fill: theme.colors.idleWoods,
    border: theme.colors.idleWoodsBorder,
  },
  triangle: {
    fill: theme.colors.idleGate,
    border: theme.colors.idleGateBorder,
  },
  diamond: {
    fill: theme.colors.idleMoonwell,
    border: theme.colors.idleMoonwellBorder,
  },
  ring: {
    fill: theme.colors.idleCrystal,
    border: theme.colors.idleCrystalBorder,
  },
  hex: {
    fill: theme.colors.idleEmber,
    border: theme.colors.idleEmberBorder,
  },
  cross: {
    fill: theme.colors.idleTower,
    border: theme.colors.idleTowerBorder,
  },
  star: {
    fill: theme.colors.idleStarfall,
    border: theme.colors.idleStarfallBorder,
  },
  petal: {
    fill: theme.colors.idleCrown,
    border: theme.colors.idleCrownBorder,
  },
  octagon: {
    fill: theme.colors.idleOrchard,
    border: theme.colors.idleOrchardBorder,
  },
  spiral: {
    fill: theme.colors.idleBound,
    border: theme.colors.idleBoundBorder,
  },
};

export function idleColorsForLayout(layoutId: LayoutId): IdleColors {
  return IDLE_COLORS_BY_LAYOUT[layoutId];
}
