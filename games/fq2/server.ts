#!/usr/bin/env bun
// Final Quest 2's multiplayer server:  bun run server [options]  (-h for them)

import { join } from 'node:path';
import { runServer } from '@fq2ts/server/cli';
import content from './content/index.ts';

await runServer({ content, name: 'Final Quest 2', gameData: join(import.meta.dir, 'data'), database: 'fq2.sqlite' });
