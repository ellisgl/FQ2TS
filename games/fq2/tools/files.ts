// Final Quest 2's files, for the map tools.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBestiary } from '@fq2ts/engine/combat';
import { contentTriggers, type GameFiles } from '@fq2ts/tools/game';
import content from '../content/index.ts';

const DATA = join(import.meta.dir, '..', 'data');

export const fq2: GameFiles = {
    maps: join(DATA, 'maps'),
    triggers: contentTriggers(content),
    encounterTables: readBestiary(JSON.parse(readFileSync(join(DATA, 'monsters.json'), 'utf8'))).tableNames(),
};
