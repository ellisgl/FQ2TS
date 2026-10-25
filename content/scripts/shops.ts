// Riply's armour shop and the weapon store in Stone Valley.

import type { ItemKind } from "../../engine/items.ts";
import type { G, Script } from "../start.ts";

interface Shop {
  kind: ItemKind;
  word: string;
  welcome: (g: G) => string[];
  // What's for sale, by item id.
  stock: readonly string[];
}

// What the original game paid for things it bought back.
const SELL_RATE = 0.9;

// The shop loops until the player leaves.
function shop({ kind, word, welcome, stock }: Shop): Script {
  return async function (g) {
    for (;;) {
      g.cls();
      g.print(...welcome(g), "", `{green}You have {yellow}$${g.gold}{green}.`, "", "{red}Your Choice:");
      const choice = await g.choice([`Buy ${word}`, `Sell ${word}`, "Leave"]);
      if (choice === 0) {
        g.cls();
        g.print("{green}Hello! Here's what I have:", "");
        await g.buy(stock);
      } else if (choice === 1) {
        g.cls();
        g.print(`{green}Ok... let's see what you've got.`, "");
        await g.sell({ kinds: [kind], rate: SELL_RATE });
      } else {
        return;
      }
    }
  };
}

export const armourShop = shop({
  kind: "armour",
  word: "Armour",
  welcome: (g) => [
    "{white}Welcome to Riply's {lightcyan}A{lightmagenta}r{lightcyan}m{lightmagenta}o{lightcyan}u{lightmagenta}r{white} Shop!!",
    "{white}I sell the best armor... {yellow}GUARANTEED!!!",
    "",
    `{green}Your current armour: {yellow}${g.armour?.name ?? "Nothing"}{green}`,
  ],
  stock: ["heavy-coat", "chain-mail", "death-armour"],
});

export const weaponShop = shop({
  kind: "weapon",
  word: "Weapon",
  welcome: (g) => [
    "{lightred}Welcome to the best {on blue}{lightcyan}W{lightmagenta}e{lightcyan}a{lightmagenta}p{lightcyan}o{lightmagenta}n{on black} {lightred}store in the entire world!",
    "{white}Why don't you try some of my weapons...",
    "",
    `{green}Your current weapon: {yellow}${g.weapon?.name ?? "Nothing"}{green}.`,
  ],
  stock: ["shotgun", "chaingun", "rpg"],
});
