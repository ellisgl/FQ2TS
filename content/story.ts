// What happens when a new game starts.
import { escapeMarkup } from '@fq2ts/engine/text';
import type { G } from './start.ts';

// The longest name the status line has room for.
export const NAME_LENGTH = 20;

export async function newGame(g: G): Promise<void> {
    g.cls();
    g.print('{yellow}{center}A new adventure begins', '');
    // (On a server the player already has a name: their account's.)
    if (!g.name) {
        g.print('{green}What is your name, adventurer?');
        let name = '';
        while (!name) {
            name = (await g.input({ x: 1, y: 4, length: NAME_LENGTH + 1 })).trim();
        }
        g.name = name;
    }

    g.print('{y 6}{green}And are you...', '');
    g.sex = (await g.choice(['A man', 'A woman'])) === 1 ? 'female' : 'male';

    for (const id of ['stick', 'vest']) {
        g.give(id);
        g.equip(id);
    }

    g.cls();
    g.print(
        `{white}${escapeMarkup(g.name)}{green}...`,
        '',
        `{green}You wake up early, put on your {lightmagenta}${g.item('vest').name}{green}, and strap your {lightmagenta}${g.item('stick').name}{green} to`,
        '{green}your back.',
        '',
        '{green}Somehow, you know this day will be different from the others.',
        '',
        '{lightgreen}<{green}Continue{lightgreen}>',
    );

    await g.key();
}
