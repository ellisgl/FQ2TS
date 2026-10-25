import { afterEach, describe, expect, spyOn, test, type Mock } from "bun:test";
import { bank, berries, healer, roshi, travelOffice } from "../../content/scripts/town.ts";
import { ScriptContext } from "../../engine/script.ts";
import type { FightResult } from "../../engine/combat.ts";
import { newPlayer, pick, row, screenText, scriptContext, typed } from "../helpers.ts";

const mocks: { mockRestore(): void }[] = [];
afterEach(() => {
  for (const m of mocks.splice(0)) m.mockRestore();
});

describe("berries", () => {
  test("picking 5 at a time, up to 25", () => {
    const { g, term } = scriptContext();
    berries(g);
    expect(g.flags.berries).toBe(5);
    expect(row(term.screen, 23)).toContain("You pick some wildberries...");
    for (let i = 0; i < 4; i++) berries(g);
    expect(g.flags.berries).toBe(25);
    expect(row(term.screen, 23)).toContain("You pick some more wildberries...");
    berries(g);
    expect(g.flags.berries).toBe(25);
    expect(row(term.screen, 23)).toContain("Don't you think you have enough?");
  });
});

describe("bank", () => {
  const LEAVE = pick(3);

  test("offers an account first, and No leaves", async () => {
    const { g, term } = scriptContext({ steps: pick(1) });
    await bank("Hi.")(g);
    expect(g.flags.hasBankAccount).toBe(false);
    expect(row(term.screen, 1)).toContain("You don't have an account with us yet.");
  });

  test("opening an account and depositing", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ gold: 50 }), steps: [...pick(0), ...pick(0), ...typed("20"), () => {
      expect(row(term.screen, 1)).toBe("Hi. You have $20 in your account.");
      return "escape";
    }] });
    await bank("Hi.")(g);
    expect(g.flags).toMatchObject({ hasBankAccount: true, bankGold: 20 });
    expect(g.gold).toBe(30);
  });

  test("1 deposits everything; more than you have does nothing", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 50 }, { hasBankAccount: true }), steps: [...pick(0), ...typed("99"), ...pick(0), ...typed("1"), ...LEAVE] });
    await bank("Hi.")(g);
    expect(g.flags.bankGold).toBe(50);
    expect(g.gold).toBe(0);
  });

  test("withdrawing some, all, or too much", async () => {
    const { g } = scriptContext({
      player: newPlayer({ gold: 0 }, { hasBankAccount: true, bankGold: 100 }),
      steps: [...pick(1), ...typed("30"), ...pick(1), ...typed("500"), ...pick(1), ...typed("1"), ...LEAVE],
    });
    await bank("Hi.")(g);
    expect(g.gold).toBe(100);
    expect(g.flags.bankGold).toBe(0);
  });

  test("closing the account pays out", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 1 }, { hasBankAccount: true, bankGold: 40 }), steps: [...pick(2), ...pick(0)] });
    await bank("Hi.")(g);
    expect(g.flags).toMatchObject({ hasBankAccount: false, bankGold: 0 });
    expect(g.gold).toBe(41);
  });

  test("changing your mind about closing", async () => {
    const { g } = scriptContext({ player: newPlayer({}, { hasBankAccount: true, bankGold: 40 }), steps: [...pick(2), ...pick(1), ...LEAVE] });
    await bank("Hi.")(g);
    expect(g.flags.hasBankAccount).toBe(true);
  });
});

describe("travelOffice", () => {
  const office = travelOffice({ name: "Testville", destination: "Elsewhere", cost: 20, to: [82, 10, 11] });

  test("paying sends you on your way", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ gold: 25 }), steps: [() => {
      expect(screenText(term.screen)).toContain("Testville Travel Office");
      return "enter";
    }, ...pick(0)] });
    await office(g);
    expect(g.gold).toBe(5);
    expect(g.destination).toEqual({ screen: 82, x: 10, y: 11 });
  });

  test("leaving the office", async () => {
    const { g } = scriptContext({ steps: pick(1) });
    await office(g);
    expect(g.destination).toBeNull();
  });

  test("not paying goes back to the desk", async () => {
    const { g } = scriptContext({ steps: [...pick(0), ...pick(1), ...pick(1)] });
    await office(g);
    expect(g.destination).toBeNull();
  });

  test("without the money you stay", async () => {
    const { g } = scriptContext({ player: newPlayer({ gold: 5 }), steps: [...pick(0), ...pick(0), "x", ...pick(1)] });
    await office(g);
    expect(g.gold).toBe(5);
    expect(g.destination).toBeNull();
  });
});

describe("Master Roshi", () => {
  function fightResult(result: FightResult): Mock<(...args: never[]) => Promise<FightResult>> {
    const m = spyOn(ScriptContext.prototype, "fight").mockResolvedValue(result);
    mocks.push(m);
    return m;
  }

  test("leaving without a fight", async () => {
    const fight = fightResult("won");
    const { g, term } = scriptContext({ steps: pick(1) });
    await roshi(g);
    expect(fight).not.toHaveBeenCalled();
    expect(row(term.screen, 2)).toContain("If you beat me, I'll give you a pass");
  });

  test("beating him the first time gives a pass and stats", async () => {
    const fight = fightResult("won");
    const { g, term } = scriptContext({ player: newPlayer({ hp: 10 }), steps: [...pick(0), () => {
      expect(screenText(term.screen)).toContain("YOU HAVE BESTED ME!");
      return "x";
    }] });
    await roshi(g);
    expect(fight).toHaveBeenCalledWith(expect.objectContaining({ name: "Master Roshi", hp: 350 }));
    expect(g.flags.hasPortCityPass).toBe(true);
    expect([g.maxHp, g.hp, g.strength, g.defense]).toEqual([275, 275, 20, 20]);
  });

  test("a rematch", async () => {
    fightResult("won");
    const { g, term } = scriptContext({ player: newPlayer({}, { hasPortCityPass: true }), steps: [() => {
      expect(row(term.screen, 1)).toBe("Master Roshi says:");
      return "enter";
    }, () => {
      expect(row(term.screen, 1)).toBe("Hey!! You beat me again!");
      return "x";
    }] });
    await roshi(g);
    expect(g.strength).toBe(20);
  });

  test("losing", async () => {
    fightResult("fled");
    const { g, term } = scriptContext({ steps: [...pick(0), "x"] });
    await roshi(g);
    expect(g.flags.hasPortCityPass).toBe(false);
    expect(g.strength).toBe(10);
    expect(row(term.screen, 1)).toContain("You loose");
  });
});

describe("healer", () => {
  const LEAVE = pick(2);

  test("a complete heal costs $2 a hitpoint", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ hp: 200, gold: 150 }), steps: [...pick(0), () => {
      expect(screenText(term.screen)).toContain("It will cost you 100");
      return "enter";
    }, "x"] });
    await healer(g);
    expect([g.hp, g.gold]).toEqual([250, 50]);
  });

  test("saying no to the price goes back", async () => {
    const { g } = scriptContext({ player: newPlayer({ hp: 200 }), steps: [...pick(0), ...pick(1), ...LEAVE] });
    await healer(g);
    expect(g.hp).toBe(200);
  });

  test("no heal needed", async () => {
    const { g, term } = scriptContext({ steps: [...pick(0), ...pick(0), () => {
      expect(screenText(term.screen)).toContain("You don't need to be healed!!!");
      return "x";
    }] });
    await healer(g);
    expect(g.gold).toBe(50);
  });

  test("not enough gold for a complete heal", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ hp: 100, gold: 10 }), steps: [...pick(0), ...pick(0), () => {
      expect(screenText(term.screen)).toContain("don't exactly have enough money");
      return "x";
    }, ...LEAVE] });
    await healer(g);
    expect([g.hp, g.gold]).toEqual([100, 10]);
  });

  test("a partial heal", async () => {
    const { g } = scriptContext({ player: newPlayer({ hp: 100, gold: 50 }), steps: [...pick(1), ...typed("10"), "x"] });
    await healer(g);
    expect([g.hp, g.gold]).toEqual([110, 30]);
  });

  test("1 heals as much as you can afford", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ hp: 100, gold: 50 }), steps: [...pick(1), () => {
      expect(screenText(term.screen)).toContain("we could heal up to 25 hitpoints");
      return "1";
    }, "enter", "x"] });
    await healer(g);
    expect([g.hp, g.gold]).toEqual([125, 0]);
  });

  test("asking for more than you can afford", async () => {
    const { g, term } = scriptContext({ player: newPlayer({ hp: 100, gold: 10 }), steps: [...pick(1), ...typed("6"), () => {
      expect(row(term.screen, 1)).toContain("you do not have the funds");
      return "x";
    }, ...LEAVE] });
    await healer(g);
    expect(g.hp).toBe(100);
  });

  test("a partial heal when you're already healthy", async () => {
    const { g, term } = scriptContext({ steps: [...pick(1), ...typed("5"), () => {
      expect(row(term.screen, 1)).toContain("you do not need to be healed");
      return "x";
    }, ...LEAVE] });
    await healer(g);
    expect(g.gold).toBe(50);
  });

  test("asking for nothing", async () => {
    const { g } = scriptContext({ player: newPlayer({ hp: 100 }), steps: [...pick(1), ...typed("0"), ...LEAVE] });
    await healer(g);
    expect(g.hp).toBe(100);
  });
});
