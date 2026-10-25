// What happens when a new game starts.
import type { G } from './start.ts';

export async function newGame(g: G): Promise<void> {
    for (const id of ['stick', 'vest']) {
        g.give(id);
        g.equip(id);
    }

    g.cls();
    g.print(
        `{green}You wake up early, put on your {lightmagenta}${g.item('vest').name}{green}, and strap your {lightmagenta}${g.item('stick').name}{green} to`,
        '{green}your back.',
        '',
        '{green}Somehow, you know this day will be different from the others.',
        '',
        '{lightgreen}<{green}Continue{lightgreen}>',
    );

    await g.key();
}
