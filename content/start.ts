// The player at the start of a new game, and the flags the scripts keep
// about what they've done.

import type { Player } from "../engine/player.ts";
import type { Script as EngineScript, ScriptContext } from "../engine/script.ts";

// (A type alias, not an interface, so that it fits the engine's FlagRecord.)
export type Flags = {
  toiletUsed: boolean;
  goldNearBarn: boolean;
  womanOffersCocoa: boolean;
  berries: number;
  hasBankAccount: boolean;
  bankGold: number;
  // 0: not seen, 1: the guard scene has played, 2: the man has run off.
  hotelScene: number;
  ownsCastle: boolean;
  // Which of the castle's two doors the player last left by.
  castleExitX: number;
  oldManSeen: boolean;
  hasPortCityPass: boolean;
  hadDrink: boolean;
};

// What scripts get, and what they are.
export type G = ScriptContext<Flags>;
export type Script = EngineScript<Flags>;

export const start: Player<Flags> = {
  screen: 721,
  x: 33,
  y: 11,
  mapScreen: 82,
  hp: 250,
  maxHp: 250,
  gold: 50,
  strength: 10,
  defense: 10,
  exp: 0,
  weapon: { name: "Nothing", power: 0, value: 0 },
  armour: { name: "Nothing", power: 0, value: 0 },
  monsters: false,
  superhuman: false,
  flags: {
    toiletUsed: false,
    goldNearBarn: true,
    womanOffersCocoa: true,
    berries: 0,
    hasBankAccount: false,
    bankGold: 0,
    hotelScene: 0,
    ownsCastle: false,
    castleExitX: 41,
    oldManSeen: false,
    hasPortCityPass: false,
    hadDrink: false,
  },
};
