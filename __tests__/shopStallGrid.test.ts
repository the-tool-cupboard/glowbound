import fs from "fs";
import path from "path";

describe("shop stall grid scroll", () => {
  it("uses one shared stall grid that scrolls above pinned footers", () => {
    const grid = fs.readFileSync(path.join(__dirname, "../components/ShopStallGrid.tsx"), "utf8");
    const goods = fs.readFileSync(path.join(__dirname, "../components/ShopItemCard.tsx"), "utf8");
    const shop = fs.readFileSync(path.join(__dirname, "../app/shop.tsx"), "utf8");
    const complete = fs.readFileSync(path.join(__dirname, "../app/level-complete.tsx"), "utf8");

    expect(grid).toContain("ScrollView");
    expect(grid).toContain("paddingBottom");
    expect(goods).toContain("ShopStallGrid");
    expect(shop).toContain("ShopGoodsDisplay");
    expect(shop).toContain("styles.dockVeil");
    expect(complete).toContain("ShopGoodsDisplay");
    expect(complete).toContain("styles.dockVeil");
  });
});
