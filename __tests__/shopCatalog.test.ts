import { CHARM_GLYPH_PAINT } from "../components/ShopCharmMark";
import { SHOP_ITEMS } from "../lib/economyConfig";

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

  it("gives every charm its own glyph fill", () => {
    const fills = SHOP_ITEMS.map((item) => CHARM_GLYPH_PAINT[item.id].fill);
    expect(new Set(fills).size).toBe(SHOP_ITEMS.length);
  });
});
