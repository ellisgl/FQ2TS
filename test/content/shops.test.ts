import { describe, expect, test } from "bun:test";
import { armourShop, weaponShop } from "../../content/scripts/shops.ts";
import { newPlayer, pick, row, screenText, scriptContext } from "../helpers.ts";

const BUY = pick(0);
const SELL = pick(1);
const LEAVE = pick(2);

describe("armour shop", () => {
  test("shows the welcome, the player's gold and armour, and leaves", async () => {
    const { g, term } = scriptContext({
      player: newPlayer({ items: { vest: 1 }, armour: "vest" }),
      steps: [
        () => {
          const text = screenText(term.screen);
          expect(text).toContain("Welcome to Riply's Armour Shop!!");
          expect(text).toContain("Your current armour: Vest");
          expect(text).toContain("You have $50.");
          return "x";
        },
        ...LEAVE,
      ],
    });
    await armourShop(g);
  });

  test("lists its stock with prices", async () => {
    const { g, term } = scriptContext({
      steps: [
        ...BUY,
        () => {
          expect(row(term.screen, 3)).toStartWith("Heavy Coat        $100");
          expect(row(term.screen, 5)).toStartWith("Death Armour      $1000");
          expect(row(term.screen, 6)).toBe("Never mind");
          return "escape";
        },
        ...LEAVE,
      ],
    });
    await armourShop(g);
  });

  test("buying and wearing", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 600, items: { vest: 1 }, armour: "vest" }), steps: [...BUY, ...pick(1), ...pick(0), ...LEAVE] });
    await armourShop(g);
    expect(g.armour?.id).toBe("chain-mail");
    expect(g.count("vest")).toBe(1);
    expect(g.gold).toBe(100);
  });

  test("buying but keeping the old armour on", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 600, items: { vest: 1 }, armour: "vest" }), steps: [...BUY, ...pick(0), ...pick(1), ...LEAVE] });
    await armourShop(g);
    expect(g.armour?.id).toBe("vest");
    expect(g.count("heavy-coat")).toBe(1);
  });

  test("not enough gold", async () => {
    const { g, term } = scriptContext({
      player: newPlayer({ gold: 600 }),
      steps: [
        ...BUY,
        ...pick(2),
        () => {
          expect(screenText(term.screen)).toContain("You can't afford the Death Armour. It costs $1000; you have $600.");
          return "x";
        },
        ...LEAVE,
      ],
    });
    await armourShop(g);
    expect(g.count("death-armour")).toBe(0);
    expect(g.gold).toBe(600);
  });

  test("selling armour for 90% of its value, taking it off first", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 0, items: { "chain-mail": 1, stick: 1 }, armour: "chain-mail" }), steps: [...SELL, ...pick(0), ...pick(0), "x", ...LEAVE] });
    await armourShop(g);
    expect(g.count("chain-mail")).toBe(0);
    expect(g.armour).toBeNull();
    expect(g.gold).toBe(450);
  });

  test("only armour is listed for selling", async () => {
    const { g, term } = scriptContext({
      player: newPlayer({ items: { vest: 2, stick: 1 } }),
      steps: [
        ...SELL,
        () => {
          expect(row(term.screen, 3)).toStartWith("Vest x2           $45");
          expect(row(term.screen, 4)).toBe("Never mind");
          return "escape";
        },
        ...LEAVE,
      ],
    });
    await armourShop(g);
  });

  test("deciding not to sell", async () => {
    const { g } = scriptContext({ player: newPlayer({ items: { vest: 1 }, armour: "vest" }), steps: [...SELL, ...pick(0), ...pick(1), ...LEAVE] });
    await armourShop(g);
    expect(g.armour?.id).toBe("vest");
  });

  test("nothing to sell", async () => {
    const { g, term } = scriptContext({
      steps: [
        ...SELL,
        () => {
          expect(screenText(term.screen)).toContain("You have nothing they want.");
          return "x";
        },
        ...LEAVE,
      ],
    });
    await armourShop(g);
  });
});

describe("weapon shop", () => {
  test("buying a weapon", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 1000 }), steps: [...BUY, ...pick(0), ...pick(0), ...LEAVE] });
    await weaponShop(g);
    expect(g.weapon?.name).toBe("Shotgun");
    expect(g.gold).toBe(0);
  });

  test("won't buy the minigun", async () => {
    const { g, term } = scriptContext({
      player: newPlayer({ items: { minigun: 1 }, weapon: "minigun" }),
      steps: [
        ...SELL,
        ...pick(0),
        () => {
          expect(screenText(term.screen)).toContain("They don't seem interested in that.");
          return "x";
        },
        ...LEAVE,
      ],
    });
    await weaponShop(g);
    expect(g.count("minigun")).toBe(1);
  });
});
