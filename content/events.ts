// Scripts that monsters run after a fight (the "after" hooks in
// data/monsters.json), by name.

import type { Script } from './start.ts';

export const events: Readonly<Record<string, Script>> = {
    // The Tree Elf drops her snack.
    'elf-berries'(g) {
        g.give('wildberries', 3);
        g.write('{lightgreen}The elf dropped some wildberries. You pick them up.');
    },
};
