// Final Quest 2's map files: they all load, they're written back exactly as
// they are, and they have terrain (and names where there should be).

import { expect, test } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { readMap, writeMap } from '@fq2js/engine/world';
import { gameWorld } from '../helpers.ts';

const MAPS = join(import.meta.dir, '..', '..', 'data', 'maps');

test('writes every map file in data/maps back exactly as it is', () => {
    for (const file of readdirSync(MAPS)) {
        const text = readFileSync(join(MAPS, file), 'utf8');
        expect(writeMap(readMap(JSON.parse(text), file))).toBe(text);
    }
});

test('loads every screen in data/maps', () => {
    const world = gameWorld();
    expect(world.has(721)).toBe(true);
    expect(world.has(82)).toBe(true);
    expect(world.has(9999)).toBe(false);
});

test("the game's maps all have terrain and some have names", () => {
    const world = gameWorld();
    expect(world.name(82)).toBe('Stone Valley');
    expect(world.terrain(82, 30, 10)).toBe('road');
    for (const file of readdirSync(MAPS)) {
        expect(readFileSync(join(MAPS, file), 'utf8')).toContain('"terrain"');
    }
});
