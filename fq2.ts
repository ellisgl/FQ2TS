#!/usr/bin/env bun
// Final Quest 2 -- run with:  bun fq2.ts [--debug]
// or: bun start / bun run debug

import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { Terminal } from './engine/terminal.ts';
import { World } from './engine/world.ts';
import { Saves } from './engine/saves.ts';
import { Game, readConfig } from './engine/game.ts';
import { readBestiary } from './engine/combat.ts';
import { readItems } from './engine/items.ts';
import content from './content/index.ts';

const args = process.argv.slice(2);
const debug = args.includes('--debug') || args.some((a) => a.toLowerCase() === '-debugmode');
const root = import.meta.dir;
const readJson = (file: string): unknown => JSON.parse(readFileSync(join(root, 'data', file), 'utf8'));

// Load (and check) all the data before taking over the terminal, so that
// errors are readable.
let game;
try {
    game = new Game({
        term: new Terminal(),
        world: World.load(join(root, 'data', 'maps')),
        config: readConfig(readJson('config.json')),
        monsters: readBestiary(readJson('monsters.json')),
        items: readItems(readJson('items.json')),
        content,
        saves: new Saves(join(root, 'saves')),
        debug,
    });
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}

const { term } = game;
term.onInterrupt = () => {
    term.stop();
    process.exit(130);
};

try {
    term.start();
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}

try {
    await game.run();
    term.stop();
    process.exit(0);
} catch (err) {
    term.stop();
    console.error(err);
    process.exit(1);
}
