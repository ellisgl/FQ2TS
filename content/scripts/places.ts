// One-off scenes: the old woman, the hotel, the castle and Port City.

import { at } from "../../engine/assert.ts";
import type { G } from "../start.ts";

const CONTINUE = "{lightgreen}<{green}Continue{lightgreen}>";

export async function oldWoman(g: G): Promise<void> {
  if (!g.flags.womanOffersCocoa) {
    const lines = [
      "Get out of my home!!!",
      "What are you doing here!!!",
      "Get away from me!!!",
      "Oh.. It's you again!?!?",
      "What the hell do you want!?!",
    ];
    g.write(`{white}An old woman says "{yellow}${at(lines, g.random(lines.length) - 1)}{white}"`);
    return;
  }

  g.flags.womanOffersCocoa = false;
  g.cls();
  g.print(
    "{white}A strange woman asks...  {yellow}Hello who are you???{white}  After a few seconds..",
    "{white}She says..  {yellow}I eat wood! Rats are nice...  {white}",
    "",
    "{green}It would appear this woman has some memory problems.. She then asks..",
    "",
    "{lightred}Would you like a cup of my cocoa?",
  );
  if ((await g.choice(["Say yes, that would be nice...", "Leave this putrit house..."])) !== 0) return;

  g.cls();
  g.print("{green}You think to yourself, {yellow}Mabye this isn't such a good idea... It looks", "{yellow}all scummy....", "");
  const drink = await g.choice(["Drink it anyway...", "Don't Drink it, Leave.. fast..."]);
  if (drink === 0) {
    g.print("{y 8}{lightcyan}Here goes...", "{lightgreen}<{green}more{lightgreen}>");
    await g.key();
    g.cls();
    g.print("{yellow}You feal a warm feeling...", "{lightgreen}<{green}more{lightgreen}>");
    await g.key();
    g.print("{y 2}{x 1}{sp 6}");
    g.print("{yellow}You've GAINED 25 hitpoints and feel totally refreshed!!", "{lightgreen}<{green}more{lightgreen}>");
    g.maxHp += 25;
    g.healFull();
    await g.key();
  } else if (drink === 1) {
    g.print(`{y 8}{green}The woman says, {lightred}"Ok, that's fine..." {green}Press a key...`);
    await g.key();
  }
}

// Running past the hotel after the guard scene.
export async function hotelRunner(g: G): Promise<void> {
  g.overlay("{x 65}{y 11}{on brown}{white}☺");
  g.write("{lightcyan}The man is running!!!!");
  const path: [number, number][] = [];
  for (let x = 65; x <= 79; x++) path.push([x, 11]);
  await g.animate(0.1, path);
}

// Walking into the unfinished hotel the first time.
export async function hotelGuard(g: G): Promise<void> {
  g.moveTo(41, 15);
  g.overlay("{x 37}{y 7}{on magenta}{white}☺");
  g.overlay("{x 41}{y 16}{on magenta}{yellow}☺");
  await g.animate(0.2, [[41, 16], [41, 15]]);
  await g.animate(0.2, [[37, 7], [37, 8], [37, 9], [37, 10], [38, 11], [39, 12], [40, 13], [40, 14], [40, 15]]);
  g.write(`{yellow}He says: {white}"{yellow}Oh my god!!!  {red}YOU SHOULDN'T BE IN HERE!  {lightcyan}SECURITY!!!!!!{white}"`);
  await g.sleep(3);
  await g.animate(0.3, [[40, 15], [40, 16], [41, 16]]);
  g.write(`{yellow}You say: {white}"What a dumbass..."`);
}

export async function castle(g: G): Promise<void> {
  const f = g.flags;
  if (!f.ownsCastle) {
    g.cls();
    g.print(`{green}A guard says... "{white}The owner of this castle wishes to sell.{green}"`, "", "{green}Would you like to buy it?", "");
    if ((await g.choice(["Maybe.... How much?", "Leave..."])) !== 0) return;
    g.cls();
    g.print("", `{green}The guard continues... "{white}The Price is $10,000{green}.  Would you like to buy?"`, "");
    if ((await g.choice(["Yes...", "Nevermind..."])) !== 0) return;
    g.cls();
    if (g.gold < 10000) {
      g.print("{green}I'm sorry, but you do not have the funds for this.  Maybe later.", "", CONTINUE);
      await g.key();
      return;
    }
    f.ownsCastle = true;
    g.gold -= 10000;
    g.print("{green}You have {white}purchased{green} a new castle!  The guards will now let you", "{green}pass.", "", CONTINUE);
    await g.key();
  }
  g.goto(726, f.castleExitX, 21);
}

export async function bar(g: G): Promise<void> {
  for (;;) {
    g.cls();
    g.print("", `{green}The bartender asks, "{white}What'll it be?{green}"`, "");
    const choice = await g.choice(["Ask for the best drink in the house...", "Chat with the bartender...", "Leave..."]);
    g.cls();
    if (choice === 0 && g.flags.hadDrink) {
      g.print(`{green}The bartender looks at you and says, "{white}Only one drink today.{green}"`, "", CONTINUE);
      await g.key();
    } else if (choice === 0) {
      g.flags.hadDrink = true;
      g.print(
        `{green}You tell the bartender, "{yellow}Give me the best drink you got!{green}"`,
        "",
        "{green}The bartender moves away for a second, but returns with a mistly",
        "{green}glass and proceeds to pour a clear liquid into it.",
        "",
        CONTINUE,
      );
      await g.key();
      g.print("{y 6}{green}You drink out of the glass and get a nice sensation from it.  The drink", "{green}is strong, but you can handle it.", "", CONTINUE);
      await g.key();
    } else if (choice === 1) {
      g.print(`{green}The bartender looks at you and says, "{white}I've got nothing to say to you.{green}"`, "", CONTINUE);
      await g.key();
    } else {
      return;
    }
  }
}

export async function cityGuards(g: G): Promise<void> {
  if (g.has("port-city-pass")) {
    g.write("{lightred}The guards eye you as you pass.");
    return;
  }
  g.cls();
  g.print(
    "",
    "{green}The guards notice your approach.",
    "",
    `{green}A guard says, "{white}Hey, let me see your pass!{green}"`,
    "",
    "{green}Since you do not have a pass, you try to bribe your way in.",
    "{green}Unfortunately, it does not work.  The guard carefully escorts you",
    "{green}away from the gate.",
    "",
    `${CONTINUE}  {green}(2 second delay)`,
  );
  await g.sleep(1);
  g.print("{y 10}{x 14}{green}1");
  await g.sleep(1);
  g.print("{y 10}{x 13}{on black}{sp 16}");
  await g.key();
  g.moveTo(2, 9);
}
