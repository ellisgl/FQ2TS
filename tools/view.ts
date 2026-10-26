#!/usr/bin/env bun
// The map viewer, for Final Quest 2's maps:  bun run view [options]  (-h for them)

import { main as view } from '@fq2ts/tools/view';
import { fq2 } from './files.ts';

export const main = (args: readonly string[], log: (line: string) => void = console.log): number => view(args, fq2, log);

if (import.meta.main) {
    try {
        process.exit(main(process.argv.slice(2)));
    } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
    }
}
