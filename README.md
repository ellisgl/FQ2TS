# Final Quest 2 - TypeScript Rewrite

Final Quest 2 is a text-mode RPG writen QBASIC in late 90s, early 00s, inspired by Legend of the Red Dragon (both 1 and 2) by Seth Robinson. This is a TypeScript rewrite of it that runs in a terminal with [Bun](https://bun.sh/).

The original QBASIC source, level editor, map renderer, map generator and REF scripting docs are in the original repo: [bafetk/final-quest-2](https://github.com/bafetk/final-quest-2).

The original game running in DOSBox:

![main menu](screenshots/menu.png)

![first screen](screenshots/firstscreen.png)

## Running

You need [Bun](https://bun.sh/) and a terminal of at least 80x25:

```sh
bun install            # dev tools only (TypeScript, ESLint); not needed just to play
bun start              # or: bun fq2.ts
bun run debug          # or: bun fq2.ts --debug   (position display, S = settings editor)
```

Saved games go to `saves/` as JSON. Set `FQ2_COLORS=16` if your terminal lacks true-color support.

While exploring: arrows (or 8 4 6 2) walk, **I** or **V** shows your stats and inventory (pick an item to use, equip or drop it), **M** the world map, **B** the last messages, **R** redraws the screen, **?** lists the keys and **Esc** goes back to the title menu.

Text and maps are Unicode (UTF-8): a map cell can hold any character one column wide (letters with accents, Greek, Cyrillic, box drawing, blocks, symbols...), but not wide ones like emoji or CJK, which would put the screen out of line. Anything that doesn't fit a cell is shown as `?`.

Items are defined in `data/items.json` and monsters and encounter tables in `data/monsters.json`.

## Multiplayer server

```sh
bun run server                     # telnet on port 2323, web on http://127.0.0.1:8080/
bun server.ts --host 0.0.0.0       # let other computers connect (-h for all the options)
```

Players connect with a telnet client (`telnet localhost 2323`) or a web browser, make an account, and play; their game is saved in `server-data/fq2.sqlite` as they go (passwords are stored as argon2id hashes). The server listens only on this computer unless given `--host`. Telnet sends passwords unencrypted, so for play over the internet use the web page behind HTTPS (`--no-telnet` turns telnet off). Seeing and talking to other players comes next: see [docs/multiplayer.md](docs/multiplayer.md).

## Tools

New versions of the original's map tools, working on `data/maps/` directly:

```sh
bun run edit                       # the level editor (in the terminal; press ? for its keys)
bun run generate                   # fill every blank outdoor screen with generated terrain
bun tools/generate.ts -s 8-10 --seed 7 -p preview.html -n   # try a seed without saving
bun run view                       # write world.html: the whole world, to open in a browser
bun tools/view.ts -s 82,721-726    # only some screens (-o sets the output file, -h for help)
```

The editor opens on an overview of the whole 80x24 world grid, one cell per screen, coloured by kind. From there you can create, copy, delete and re-kind screens, and press Enter to edit one. Screens are painted with a brush (character, colours, and whether it's solid) using the keyboard or the mouse. Left-drag paints, right-drag selects, and a middle click picks up a cell as the brush. The bottom row is a palette: click the brush for the character picker, a colour to use it, or HARD/SOFT to switch. In the overview, click a screen to select it and click again to open it. There's a character picker (pages of box drawing, blocks, symbols, arrows, letters and more; or type any character, or give its code point with Tab), rectangle selections with fill, copy and stamp, undo/redo, and overlays for solid cells and trigger tiles. S saves to `data/maps/`, and only screens that changed are rewritten.

The viewer lays the outdoor screens out where they sit on the world grid and lists the interiors after them, in their real characters and colours. It can zoom, and outline solid cells and trigger tiles.

The generator fills outdoor screens with land, water, forest, mountains and winding trails in the style of the hand-made screens. First create the screens in the editor (N makes a blank screen of a chosen kind); the generator fills blank screens, and only replaces finished ones with `--force`.
- Water follows the kinds: water screens become lakes and seas, and coasts form where they meet land, including hand-made land.
- Terrain comes from noise over the whole world, so neighbouring screens line up at their edges.
- Towns get a clearing in the middle, left for building by hand.
- Roads and open ground on a hand-made neighbour carry on across the edge, and any walkable patch that ends up cut off gets a path cleared to it.
- The same `--seed` always gives the same result, and `--preview` writes an HTML page of the new screens and their neighbours.

## Development

Bun runs the TypeScript directly but doesn't type-check it, so check before committing:

```sh
bun run check          # tsc (strict) + eslint (typescript-eslint strict-type-checked) + tests
bun test               # just the tests
bun run coverage       # tests with a coverage report
```

Code style follows the PER Coding Style (adapted from PHP): 4-space indents, single quotes, braces on every block, explicit `public`/`private`, no trailing whitespace. ESLint enforces it (`bunx eslint --fix .` fixes most of it). The code avoids `any`, `as` casts and `!` assertions. Lookups that can only miss because of a bug go through `at()`/`cellAt()` in [engine/assert.ts](engine/assert.ts), which throw. JSON files and saved games are checked when they're loaded ([engine/validate.ts](engine/validate.ts)), so a bad file fails with the path to the bad value, e.g. `monsters.json.monsters[1].hp: expected a whole number`.

## Layout

- [fq2.ts](fq2.ts) is the entry point.
- [engine/](engine/) is the game engine: terminal, screen, text markup, world, combat, saves, and the `g` API that scripts use ([engine/script.ts](engine/script.ts)).
- [content/](content/) is the game itself: every screen's triggers and all the scripts, written as async TypeScript functions (converted from the original REF files). [content/start.ts](content/start.ts) holds the starting player and the `Flags` type, so a misspelled flag is a compile error.
- [data/](data/) holds the game data as JSON: `config.json` (from VARS.DAT), `items.json` (the item catalogue), `monsters.json` (monsters and encounter tables, from NOSCR.DAT) and one file per screen in `data/maps/` (from MAPS.DAT, now with screen names and terrain).
- [server/](server/) is the multiplayer server: telnet and web connections, accounts and saves (SQLite), and each player's session. [server.ts](server.ts) starts it.
- [tools/](tools/) holds the map tools (see Tools above).
- [test/](test/) holds the unit tests (`bun:test`). [test/helpers.ts](test/helpers.ts) has a `FakeTerminal` that plays back scripted key presses, so whole games can be driven from a test, plus small worlds and players to test with. [test/content/data.test.ts](test/content/data.test.ts) runs every trigger in the game and checks that it sends the player somewhere real.
- [docs/multiplayer.md](docs/multiplayer.md) is the plan for live multiplayer (telnet and web, LORD II style).

## License

See [LICENSE](LICENSE).
