import { CHARM_GLYPH_PAINT } from "../components/ShopCharmMark";
import { FROST_WICK_ITEM, SHOP_GOODS, SHOP_ITEMS } from "../lib/economyConfig";

describe("shop catalog", () => {
  it("keeps charm names and costs while descriptions carry a use-when beat", () => {
    expect(
      SHOP_ITEMS.map((item) => ({ id: item.id, name: item.name, cost: item.cost }))
    ).toEqual([
      { id: "pathHint", name: "Path Hint", cost: 25 },
      { id: "lanternOil", name: "Lantern Oil", cost: 35 },
      { id: "secondSight", name: "Second Sight", cost: 50 },
      { id: "ward", name: "Rune Ward", cost: 60 },
    ]);

    for (const item of SHOP_ITEMS) {
      expect(item.description.toLowerCase()).toContain("use ");
    }
  });

  it("sells Frost Wick as a night-stall good, not a run charm", () => {
    expect(FROST_WICK_ITEM).toMatchObject({
      id: "frostWick",
      name: "Frost Wick",
      cost: 40,
    });
    expect(FROST_WICK_ITEM.description.toLowerCase()).toContain("use ");
    expect(SHOP_GOODS.map((item) => item.id)).toEqual([
      "pathHint",
      "lanternOil",
      "secondSight",
      "ward",
      "frostWick",
    ]);
    expect(SHOP_ITEMS).toHaveLength(4);
    expect(SHOP_GOODS).toHaveLength(5);
  });

  it("gives every shop glyph its own fill", () => {
    const fills = SHOP_GOODS.map((item) => CHARM_GLYPH_PAINT[item.id].fill);
    expect(new Set(fills).size).toBe(SHOP_GOODS.length);
  });
});
