// What happens when a new game starts.

import type { G } from "./start.ts";

export async function newGame(g: G): Promise<void> {
  g.weapon = { name: "Stick", power: 15, value: 50 };
  g.armour = { name: "Vest", power: 15, value: 50 };
  g.cls();
  g.print(
    `{green}You wake up early, put on your {lightmagenta}${g.armour.name}{green}, and strap your {lightmagenta}${g.weapon.name}{green} to`,
    "{green}your back.",
    "",
    "{green}Somehow, you know this day will be different from the others.",
    "",
    "{lightgreen}<{green}Continue{lightgreen}>",
  );
  await g.key();
}
