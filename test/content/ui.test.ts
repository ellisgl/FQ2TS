import { describe, expect, test } from "bun:test";
import { credits, help, inventory, statusLine, title, worldMapLegend } from "../../content/ui.ts";
import { newGame } from "../../content/story.ts";
import { draw } from "../../engine/text.ts";
import { Screen } from "../../engine/screen.ts";
import { config, newPlayer, row, screenText, scriptContext } from "../helpers.ts";

function drawn(lines: readonly string[]): string {
  const screen = new Screen();
  for (const line of lines) draw(screen, line);
  return screenText(screen);
}

test("the title screen shows the version", () => {
  const text = drawn(title.art(config));
  expect(text).toContain("Main Menu");
  expect(text).toContain("V0.94 Rev D");
  expect(title.menu.options.map(([label]) => label)).toEqual(["Enter the Realm", "Save Game", "Load Game", "Help", "Resume Game", "Leave this place"]);
});

test("help", () => {
  const text = drawn(help(config));
  expect(text).toContain("Welcome to Final Quest 2 V0.94 by Akori Software.");
  expect(text).toContain("I = Inventory -- M = Map");
});

describe("credits", () => {
  test.each([1, 2, 3, 4, 5, 6, 7])("in frame colour %i", (frame) => {
    const screen = new Screen();
    for (const line of credits(config, frame)) draw(screen, line);
    expect(screenText(screen)).toContain("Thank you for playing Final Quest 2");
    expect(screen.cell(1, 1).fg).toBe(frame);
  });
});

test("the world map legend", () => {
  expect(drawn(worldMapLegend)).toContain("represents a large town");
});

test("the status line", () => {
  expect(statusLine(newPlayer({ hp: 12, gold: 3 }), config)).toBe("Final Quest 2 -- By AkoriSoft -- HP (12/250) -- Gold: 3!");
});

describe("inventory", () => {
  test("lists the player's things", () => {
    const { g, term } = scriptContext({ player: newPlayer({ exp: 9, weapon: { name: "Stick", power: 1, value: 1 } }) });
    inventory(g);
    const text = screenText(term.screen);
    expect(text).toContain("Experience: 9");
    expect(text).toContain("Weapon: Stick");
    expect(text).not.toContain("Gold in Bank");
    expect(text).not.toContain("Wildberries");
    expect(row(term.screen, 17)).toContain("└");
  });

  test("bank gold and berries only when there are some", () => {
    const { g, term } = scriptContext({ player: newPlayer({}, { hasBankAccount: true, bankGold: 40, berries: 10 }) });
    inventory(g);
    const text = screenText(term.screen);
    expect(text).toContain("Gold in Bank: $40");
    expect(text).toContain("Wildberries: 10");
    expect(row(term.screen, 19)).toContain("└");
  });
});

test("a new game starts with a stick and a vest", async () => {
  const { g, term } = scriptContext({ steps: ["x"] });
  await newGame(g);
  expect(g.weapon.name).toBe("Stick");
  expect(g.armour.name).toBe("Vest");
  expect(row(term.screen, 1)).toContain("put on your Vest, and strap your Stick to");
  expect(term.remaining).toBe(0);
});
