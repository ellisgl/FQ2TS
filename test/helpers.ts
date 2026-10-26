// Test fixtures for Final Quest 2: its data, its world, and games of it
// ready to play. The engine's test kit (the scripted terminal and so on)
// comes along too, so tests need only this.

import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { World } from '@fq2js/engine/world';
import { readConfig, type Config, type Game } from '@fq2js/engine/game';
import { readBestiary, type Bestiary } from '@fq2js/engine/combat';
import { readItems, type ItemCatalogue } from '@fq2js/engine/items';
import { ScriptContext } from '@fq2js/engine/script';
import type { Player } from '@fq2js/engine/player';
import type { FakeTerminal } from '@fq2js/engine/testing';
import { makeGameWith, type GameSetup } from '@fq2js/engine/fixture';
import content from '../content/index.ts';
import { start, type Flags, type Shared } from '../content/start.ts';

export * from '@fq2js/engine/testing';

const ROOT = join(import.meta.dir, '..');

// ---- Data

export function readData(file: string): unknown {
    return JSON.parse(readFileSync(join(ROOT, 'data', file), 'utf8'));
}

export const config: Config = readConfig(readData('config.json'));
export const bestiary: Bestiary = readBestiary(readData('monsters.json'));
export const itemCatalogue: ItemCatalogue = readItems(readData('items.json'));

let realWorld: World | null = null;
export function gameWorld(): World {
    realWorld ??= World.load(join(ROOT, 'data', 'maps'));
    return realWorld;
}

// ---- Games

export function newPlayer(changes: Partial<Player<Flags>> = {}, flags: Partial<Flags> = {}): Player<Flags> {
    const player = { ...structuredClone(start), ...changes };
    player.flags = { ...player.flags, ...flags };
    return player;
}

// A game of the real content, data and world (unless told otherwise), on a
// scripted terminal, with a player already in it.
export function makeGame(setup: GameSetup<Flags, Shared> = {}): { game: Game<Flags, Shared>; term: FakeTerminal } {
    return makeGameWith(content, { player: newPlayer(), world: gameWorld(), config, monsters: bestiary, items: itemCatalogue, ...setup });
}

// A script context in the real game: what content scripts get as `g`.
export function scriptContext(setup: GameSetup<Flags, Shared> = {}): { g: ScriptContext<Flags, Shared>; game: Game<Flags, Shared>; term: FakeTerminal } {
    const { game, term } = makeGame(setup);
    return { g: new ScriptContext(game), game, term };
}

// A trigger in the real game's screens table.
export function trigger(screen: number, x: number, y: number): (g: ScriptContext<Flags, Shared>) => void | Promise<void> {
    const script = content.screens[screen]?.at?.[`${x},${y}`];
    if (!script) {
        throw new Error(`No trigger at ${x},${y} on screen ${screen}.`);
    }
    return script;
}

