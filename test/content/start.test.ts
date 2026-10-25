import { describe, expect, test } from "bun:test";
import { upgradeSave } from "../../content/start.ts";
import { newPlayer } from "../helpers.ts";

describe("upgradeSave", () => {
  test("turns old berry and pass flags into items", () => {
    const player = newPlayer();
    upgradeSave({ flags: { berries: 40, hasPortCityPass: true } }, player);
    expect(player.items).toEqual({ wildberries: 25, "port-city-pass": 1 });
  });

  test("leaves newer saves alone", () => {
    const player = newPlayer({ items: { wildberries: 3 } });
    upgradeSave({ flags: { berries: 10, hasPortCityPass: false } }, player);
    expect(player.items).toEqual({ wildberries: 3 });
  });

  test.each([[null], [5], [{}], [{ flags: null }], [{ flags: { berries: "lots" } }], [{ flags: { berries: 0 } }]])("ignores %p", (saved: unknown) => {
    const player = newPlayer();
    upgradeSave(saved, player);
    expect(player.items).toEqual({});
  });
});
