// Riply's armour shop and the weapon store in Stone Valley.

import type { G, Script } from "../start.ts";

const CONTINUE = "{lightgreen}<{green}Continue{lightgreen}>";

interface ShopItem {
  name: string;
  price: number;
  power: number;
  // How the shopkeeper describes it when you can't afford it.
  pitch: string;
}

interface Shop {
  slot: "armour" | "weapon";
  word: string;
  menu: (g: G) => string[];
  offer: readonly string[];
  items: readonly ShopItem[];
  fitted: string;
}

// The shop loops until the player leaves.
function shop({ slot, word, menu, offer, items, fitted }: Shop): Script {
  return async function (g) {
    for (;;) {
      g.cls();
      g.print(...menu(g));
      const choice = await g.choice([`Buy New ${word}`, `Sell Old ${word}`, "Leave"]);
      if (choice === 0) await buy(g);
      else if (choice === 1) await sell(g);
      else return;
    }
  };

  async function sell(g: G): Promise<void> {
    const item = g[slot];
    if (item.power === 0) {
      g.cls();
      g.print(`{green}You have no ${slot} to sell!!`, "", CONTINUE);
      await g.key();
      return;
    }
    const worth = item.value - Math.trunc(item.value / 10);
    g.cls();
    g.print(
      "",
      `{green}Ok...  I would have to say your {cyan}${item.name}'s{green} value is now {yellow}$${worth}{green}.`,
      "{green}You still want to sell it?",
    );
    if ((await g.choice(["Yes", "No"])) !== 0) return;
    g.gold += worth;
    g[slot] = { name: "Nothing", value: 0, power: 0 };
    g.print("", "", `{lightcyan}Ok!!! {green}Done.  You have now sold your ${slot}.`, "", CONTINUE);
    await g.key();
  }

  async function buy(g: G): Promise<void> {
    if (g[slot].power !== 0) {
      g.cls();
      g.print(`{green}You already have ${slot === "armour" ? "an armour" : "a weapon"}!!!  You must sell it first!!!`, "", CONTINUE);
      await g.key();
      return;
    }
    g.cls();
    g.print(...offer, "", "{green}Your Choice:");
    const choice = await g.choice([...items.map((i) => `Buy ${i.name}`), "Get outa here..."]);
    const item = items[choice];
    if (!item) return;
    g.cls();
    if (g.gold < item.price) {
      g.print(
        `{green}So you want to try out ${item.pitch}{green}, do you?`,
        "{green}Well, you're going to have to have the cash!!",
        "",
        `{green}Sorry, but you don't.  Come back later.  ${CONTINUE}`,
      );
    } else {
      g.gold -= item.price;
      g[slot] = { name: item.name, value: item.price, power: item.power };
      g.print(`{green}${fitted}`, "", CONTINUE);
    }
    await g.key();
  }
}

export const armourShop = shop({
  slot: "armour",
  word: "Armour",
  menu: (g) => [
    "{white}Welcome to Riply's {lightcyan}A{lightmagenta}r{lightcyan}m{lightmagenta}o{lightcyan}u{lightmagenta}r{white} Shop!!",
    "{white}I sell the best armor... {yellow}GUARANTEED!!!",
    "",
    "{green}We have:",
    "",
    "{white}A Heavy Coat for {yellow}$100{white}.",
    "{white}Chain Mail for {yellow}$500{white}.",
    "{white}Death Armour for {yellow}$1000{white}.",
    "",
    `{green}You have {yellow}$${g.gold}{green}.`,
    `{green}Your current armour: {yellow}${g.armour.name}{green}`,
    "",
    "{red}Your Choice:",
    "",
  ],
  offer: [
    "{green}Hello!  I have three different types of armours that you might be interested",
    "{green}in!!",
    "",
    "{green}I have a {white}Heavy Coat{green} for {yellow}$100{green}.",
    "{green}I have some {white}Chain Mail{green} for {yellow}$500{green}.",
    "{green}I have some {white}Death Armour{green} for {yellow}$1000{green}.",
  ],
  items: [
    { name: "Heavy Coat", price: 100, power: 50, pitch: "one of our expensive {white}Heavy Coat's" },
    { name: "Chain Mail", price: 500, power: 100, pitch: "some of our expensive {white}Chain Mail" },
    { name: "Death Armour", price: 1000, power: 150, pitch: "some of our expensive {white}Death Armour" },
  ],
  fitted: "The main helps you into your new armour.",
});

export const weaponShop = shop({
  slot: "weapon",
  word: "Weapon",
  menu: (g) => [
    "{lightred}Welcome to the best {on blue}{lightcyan}W{lightmagenta}e{lightcyan}a{lightmagenta}p{lightcyan}o{lightmagenta}n{on black} {lightred}store in the entire world!",
    "{white}Why don't you try some of my weapons... I have:",
    "",
    "{lightmagenta}A chaingun for 5000 Gold",
    "{lightmagenta}An RPG for 10000 Gold",
    "{lightmagenta}A shotgun for 1000 Gold",
    "",
    `{green}You have {yellow}${g.gold}{green} gold...`,
    `{green}Your current weapon: {yellow}${g.weapon.name}{green}.`,
    "",
    "{red}Your Choice:",
  ],
  offer: [
    "{green}Hello!  I have three different types of weapons that you might be interested",
    "{green}in!!",
    "",
    "{green}I have a {white}Shotgun{green} for {yellow}$1000{green}.",
    "{green}I have some {white}Chain Gun{green} for {yellow}$5000{green}.",
    "{green}I have some {white}RPG{green} for {yellow}$10000{green}.",
  ],
  items: [
    { name: "Shotgun", price: 1000, power: 100, pitch: "one of our expensive {white}Shotgun's" },
    { name: "Chain Gun", price: 5000, power: 250, pitch: "one of our expensive {white}Chain Gun's" },
    { name: "RPG", price: 10000, power: 500, pitch: "one of our expensive {white}RPG's" },
  ],
  fitted: "The main helps you strap your new weapon to your back.",
});
