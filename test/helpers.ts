// Test fixtures for Final Quest 2: its data, its world, and games of it
// ready to play. The engine's test kit (the scripted terminal and so on)
// comes along too, so tests need only this.

import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import type { Key } from '@fq2js/engine/terminal';
import { World } from '@fq2js/engine/world';
import { Game, readConfig, type Config, type Content } from '@fq2js/engine/game';
import { readBestiary, type Bestiary } from '@fq2js/engine/combat';
import { readItems, type ItemCatalogue } from '@fq2js/engine/items';
import { Saves } from '@fq2js/engine/saves';
import { ScriptContext } from '@fq2js/engine/script';
import type { FlagRecord, Player } from '@fq2js/engine/player';
import { FakeTerminal, tempDir, type Step } from '@fq2js/engine/testing';
import content from '../content/index.ts';
import { start, type Flags } from '../content/start.ts';

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

interface GameSetup<F extends FlagRecord> {
    steps?: readonly Step[];
    fallback?: Key;
    player?: Player<F>;
    world?: World;
    saves?: Saves;
    debug?: boolean;
    monsters?: Bestiary;
    items?: ItemCatalogue;
    autosave?(player: Player<F>): void;
    screensaver?: boolean;
    // No save slots (like a server's games).
    noSaves?: boolean;
}

export function makeGameWith<F extends FlagRecord>(
    gameContent: Content<F>,
    { steps = [], fallback, player, world, saves, debug = false, monsters = bestiary, items = itemCatalogue, autosave, screensaver, noSaves = false }: GameSetup<F> = {},
): { game: Game<F>; term: FakeTerminal } {
    const term = new FakeTerminal(steps, fallback === undefined ? {} : { fallback });
    const game = new Game({
        term,
        world: world ?? gameWorld(),
        config,
        monsters,
        items,
        content: gameContent,
        ...(noSaves ? {} : { saves: saves ?? new Saves(tempDir()) }),
        ...(screensaver === undefined ? {} : { screensaver }),
        debug,
        ...(player ? { player } : {}),
        ...(autosave ? { autosave } : {}),
    });
    return { game, term };
}

// The real game, with a player already in it.
export function makeGame(setup: GameSetup<Flags> = {}): { game: Game<Flags>; term: FakeTerminal } {
    return makeGameWith(content, { player: newPlayer(), ...setup });
}

// A script context in the real game: what content scripts get as `g`.
export function scriptContext(setup: GameSetup<Flags> = {}): { g: ScriptContext<Flags>; game: Game<Flags>; term: FakeTerminal } {
    const { game, term } = makeGame(setup);
    return { g: new ScriptContext(game), game, term };
}

// A trigger in the real game's screens table.
export function trigger(screen: number, x: number, y: number): (g: ScriptContext<Flags>) => void | Promise<void> {
    const script = content.screens[screen]?.at?.[`${x},${y}`];
    if (!script) {
        throw new Error(`No trigger at ${x},${y} on screen ${screen}.`);
    }
    return script;
}

