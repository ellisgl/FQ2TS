// Everything that makes this particular game, as opposed to the engine.

import type { Content } from "../engine/game.ts";
import { title, help, credits, worldMapLegend, statusLine, inventory } from "./ui.ts";
import { newGame } from "./story.ts";
import { screens } from "./screens.ts";
import { start, upgradeSave, type Flags } from "./start.ts";
import { events } from "./events.ts";

const content: Content<Flags> = { title, help, credits, worldMapLegend, statusLine, inventory, newGame, start, screens, events, upgradeSave };

export default content;
