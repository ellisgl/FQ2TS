#!/usr/bin/env bun
// Level editor for data/maps, in the terminal (80x25 or bigger).
//
//   bun tools/edit.ts [--maps data/maps]

import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { Terminal } from "../engine/terminal.ts";
import { World } from "../engine/world.ts";
import { Editor } from "./editor/editor.ts";
import { contentTriggers } from "./view.ts";
import { readBestiary } from "../engine/combat.ts";
import { readFileSync } from "node:fs";

const USAGE = `Usage: bun tools/edit.ts [options]

  -m, --maps DIR   the map folder to edit (default: data/maps)
  -h, --help       show this help

Press ? in the editor for its keys.`;

export async function main(args: readonly string[], term: Terminal = new Terminal(), log: (line: string) => void = console.log): Promise<number> {
  const { values } = parseArgs({
    args: [...args],
    options: {
      maps: { type: "string", short: "m", default: join(import.meta.dir, "..", "data", "maps") },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  if (values.help) {
    log(USAGE);
    return 0;
  }
  const dir = resolve(values.maps);
  const world = World.load(dir);
  const saved: string[] = [];
  const editor = new Editor({
    term,
    world,
    triggers: contentTriggers(),
    encounterTables: readBestiary(JSON.parse(readFileSync(join(import.meta.dir, "..", "data", "monsters.json"), "utf8"))).tableNames(),
    save: (w) => {
      const result = w.save(dir);
      saved.push(...result.written, ...result.deleted);
      return result;
    },
  });
  term.start({ mouse: true });
  try {
    await editor.run();
  } finally {
    term.stop();
  }
  log(saved.length ? `Saved changes to ${dir}` : "No changes saved.");
  return 0;
}

if (import.meta.main) {
  const term = new Terminal();
  term.onInterrupt = () => {
    term.stop();
    process.exit(130);
  };
  try {
    process.exit(await main(process.argv.slice(2), term));
  } catch (err) {
    term.stop();
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }
}
