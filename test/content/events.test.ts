import { expect, test } from "bun:test";
import { events } from "../../content/events.ts";
import { bestiary, row, scriptContext } from "../helpers.ts";

test("every monster hook in data/monsters.json has an event", () => {
  for (const hook of bestiary.hooks()) expect(events[hook]).toBeDefined();
});

test("the Tree Elf drops wildberries", async () => {
  const { g, term } = scriptContext();
  await events["elf-berries"]?.(g);
  expect(g.count("wildberries")).toBe(3);
  expect(row(term.screen, 23)).toContain("The elf dropped some wildberries.");
});
