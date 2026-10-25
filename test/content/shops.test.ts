import { describe, expect, test } from "bun:test";
import { armourShop, weaponShop } from "../../content/scripts/shops.ts";
import { newPlayer, pick, row, screenText, scriptContext } from "../helpers.ts";

const nothing = { name: "Nothing", power: 0, value: 0 };
const BUY = pick(0);
const SELL = pick(1);
const LEAVE = pick(2);

describe("armour shop", () => {
  test("shows what's on sale and leaves", async () => {
    const { g, term } = scriptContext({ steps: [() => {
      expect(screenText(term.screen)).toContain("Welcome to Riply's Armour Shop!!");
      expect(screenText(term.screen)).toContain("You have $50.");
      return "down";
    }, "down", "enter"] });
    await armourShop(g);
  });

  test("buying", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 600 }), steps: [...BUY, ...pick(1), "x", ...LEAVE] });
    await armourShop(g);
    expect(g.armour).toEqual({ name: "Chain Mail", value: 500, power: 100 });
    expect(g.gold).toBe(100);
  });

  test("not enough gold", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ gold: 600 }), steps: [...BUY, ...pick(2), () => {
      expect(row(term.screen, 1)).toBe("So you want to try out some of our expensive Death Armour, do you?");
      return "x";
    }, ...LEAVE] });
    await armourShop(g);
    expect(g.armour).toEqual(nothing);
  });

  test("changing your mind", async () => {
    const { g } = scriptContext({ steps: [...BUY, ...pick(3), ...LEAVE] });
    await armourShop(g);
    expect(g.armour).toEqual(nothing);
  });

  test("you must sell your old armour first", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ armour: { name: "Vest", power: 15, value: 50 } }), steps: [...BUY, () => {
      expect(row(term.screen, 1)).toContain("You already have an armour!!!");
      return "x";
    }, ...LEAVE] });
    await armourShop(g);
  });

  test("selling gets 90% back", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 0, armour: { name: "Vest", power: 15, value: 50 } }), steps: [...SELL, ...pick(0), "x", ...LEAVE] });
    await armourShop(g);
    expect(g.armour).toEqual(nothing);
    expect(g.gold).toBe(45);
  });

  test("deciding not to sell", async () => {
    const vest = { name: "Vest", power: 15, value: 50 };
    const { g } = scriptContext({ player: newPlayer({ armour: vest }), steps: [...SELL, ...pick(1), ...LEAVE] });
    await armourShop(g);
    expect(g.armour).toEqual(vest);
  });

  test("nothing to sell", async () => {
    const { g, term } = scriptContext({ steps: [...SELL, () => {
      expect(row(term.screen, 1)).toBe("You have no armour to sell!!");
      return "x";
    }, ...LEAVE] });
    await armourShop(g);
  });
});

describe("weapon shop", () => {
  test("buying a weapon", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ gold: 1000 }), steps: [() => {
      expect(screenText(term.screen)).toContain("Your current weapon: Nothing.");
      return "enter";
    }, ...pick(0), "x", ...LEAVE] });
    await weaponShop(g);
    expect(g.weapon).toEqual({ name: "Shotgun", value: 1000, power: 100 });
    expect(g.gold).toBe(0);
  });

  test("you must sell your old weapon first", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ weapon: { name: "Stick", power: 15, value: 50 } }), steps: [...BUY, () => {
      expect(row(term.screen, 1)).toContain("You already have a weapon!!!");
      return "x";
    }, ...LEAVE] });
    await weaponShop(g);
  });
});
