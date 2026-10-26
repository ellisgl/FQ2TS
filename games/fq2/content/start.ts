// The player at the start of a new game, and the flags the scripts keep
// about what they've done.

import type { Player } from '@fq2js/engine/player';
import type { Script as EngineScript, ScriptContext } from '@fq2js/engine/script';

// (A type alias, not an interface, so that it fits the engine's FlagRecord.)
export type Flags = {
    toiletUsed: boolean;
    goldNearBarn: boolean;
    womanOffersCocoa: boolean;
    hasBankAccount: boolean;
    bankGold: number;
    // 0: not seen, 1: the guard scene has played, 2: the man has run off.
    hotelScene: number;
    ownsCastle: boolean;
    // Which of the castle's two doors the player last left by.
    castleExitX: number;
    oldManSeen: boolean;
    hadDrink: boolean;
    foundMinigun: boolean;
};

// What belongs to the world, not one player: on a server, everyone shares
// it. (In single-player it's saved with the game.)
export type Shared = {
    // Everyone who has bought the castle (anyone can).
    castleOwners: readonly string[];
};

export const shared: Shared = { castleOwners: [] };

// What scripts get, and what they are.
export type G = ScriptContext<Flags, Shared>;
export type Script = EngineScript<Flags, Shared>;

export const start: Player<Flags> = {
    name: '',
    sex: 'male',
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
    items: {},
    weapon: null,
    armour: null,
    monsters: false,
    superhuman: false,
    flags: {
        toiletUsed: false,
        goldNearBarn: true,
        womanOffersCocoa: true,
        hasBankAccount: false,
        bankGold: 0,
        hotelScene: 0,
        ownsCastle: false,
        castleExitX: 41,
        oldManSeen: false,
        hadDrink: false,
        foundMinigun: false,
    },
};

// Saves from before the item catalogue kept wildberries and the Port City
// pass as flags; they're items now.
export function upgradeSave(saved: unknown, player: Player<Flags>): void {
    if (typeof saved !== 'object' || saved === null || !('flags' in saved)) {
        return;
    }

    const flags = saved.flags;
    if (typeof flags !== 'object' || flags === null) {
        return;
    }

    const berries = 'berries' in flags ? flags.berries : undefined;
    if (typeof berries === 'number' && berries > 0 && player.items['wildberries'] === undefined) {
        player.items['wildberries'] = Math.min(25, Math.trunc(berries));
    }

    if ('hasPortCityPass' in flags && flags.hasPortCityPass === true) {
        player.items['port-city-pass'] = 1;
    }
}
