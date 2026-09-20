import type { LayoutId } from "../types/game";
import { theme } from "./theme";

export interface IdleColors {
  fill: string;
  border: string;
}

/**
 * Resting idle fill + rim for a gem layout.
 * Sleeping Woods Lattice (`grid`) gets moss + lantern-warm gold.
 * Every other chapter keeps the global blue-grey idle.
 * Cooled ember idle is a separate visual state and is not returned here.
 */
export function idleColorsForLayout(layoutId: LayoutId): IdleColors {
  if (layoutId === "grid") {
    return {
      fill: theme.colors.idleWoods,
      border: theme.colors.idleWoodsBorder,
    };
  }

  return {
    fill: theme.colors.idle,
    border: theme.colors.idleBorder,
  };
}
