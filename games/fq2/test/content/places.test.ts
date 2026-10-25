import { afterEach, describe, expect, spyOn, test } from 'bun:test';
import { bar, castle, cityGuards, hotelGuard, hotelRunner, oldWoman } from '../../content/scripts/places.ts';
import { newPlayer, pick, row, screenText, scriptContext } from '../helpers.ts';

const mocks: { mockRestore(): void }[] = [];
afterEach(() => {
    for (const m of mocks.splice(0)) {
        m.mockRestore();
    }
});

describe('the old woman', () => {
    test('drinking her cocoa gives 25 hitpoints', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ hp: 100 }), steps: [...pick(0), ...pick(0), 'x', 'x', () => {
            expect(screenText(term.screen)).toContain("You've GAINED 25 hitpoints");
            return 'x';
        }] });
        await oldWoman(g);
        expect([g.maxHp, g.hp]).toEqual([275, 275]);
        expect(g.flags.womanOffersCocoa).toBe(false);
    });

    test('not drinking it', async () => {
        const { g, term } = scriptContext({ steps: [...pick(0), ...pick(1), () => {
            expect(screenText(term.screen)).toContain('"Ok, that\'s fine..."');
            return 'x';
        }] });
        await oldWoman(g);
        expect(g.maxHp).toBe(250);
    });

    test('leaving at once, or escaping the second question', async () => {
        const first = scriptContext({ steps: pick(1) });
        await oldWoman(first.g);
        expect(first.g.flags.womanOffersCocoa).toBe(false);
        const second = scriptContext({ steps: [...pick(0), 'escape'] });
        await oldWoman(second.g);
        expect(second.g.maxHp).toBe(250);
    });

    test('after that she only shouts', async () => {
        mocks.push(spyOn(Math, 'random').mockReturnValue(0.99));
        const { g, term } = scriptContext({ player: newPlayer({}, { womanOffersCocoa: false }) });
        await oldWoman(g);
        expect(row(term.screen, 23)).toContain('"What the hell do you want!?!"');
    });
});

describe('the hotel', () => {
    test('the guard comes running and walks off again', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 724, x: 41, y: 17 }) });
        await hotelGuard(g);
        expect([g.x, g.y]).toEqual([41, 15]);
        expect(term.screen.cell(41, 16)).toMatchObject({ ch: '☺', fg: 15 });
        // Both lines come from one scene, so the second waits behind the first.
        expect(row(term.screen, 23)).toContain('He says: "Oh my god!!!');
    });

    test('the man runs off the screen', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 163, x: 10, y: 10 }) });
        await hotelRunner(g);
        expect(term.screen.cell(79, 11).ch).toBe('☺');
        expect(term.screen.cell(65, 11).ch).not.toBe('☺');
        expect(row(term.screen, 23)).toContain('The man is running!!!!');
    });
});

describe('the castle', () => {
    test('buying it and going in', async () => {
        const { g } = scriptContext({ player: newPlayer({ gold: 10_500 }), steps: [...pick(0), ...pick(0), 'x'] });
        await castle(g);
        expect(g.flags.ownsCastle).toBe(true);
        expect(g.gold).toBe(500);
        expect(g.destination).toEqual({ screen: 726, x: 41, y: 21 });
    });

    test('too expensive', async () => {
        const { g, term } = scriptContext({ steps: [...pick(0), ...pick(0), () => {
            expect(row(term.screen, 1)).toContain('you do not have the funds');
            return 'x';
        }] });
        await castle(g);
        expect(g.flags.ownsCastle).toBe(false);
        expect(g.destination).toBeNull();
    });

    test('walking away at either question', async () => {
        for (const steps of [pick(1), [...pick(0), ...pick(1)]]) {
            const { g } = scriptContext({ steps });
            await castle(g);
            expect(g.destination).toBeNull();
        }
    });

    test('owners go straight in by the door they left from', async () => {
        const { g } = scriptContext({ player: newPlayer({}, { ownsCastle: true, castleExitX: 42 }) });
        await castle(g);
        expect(g.destination).toEqual({ screen: 726, x: 42, y: 21 });
    });
});

describe('the bar', () => {
    test('one drink a day', async () => {
        const { g, term } = scriptContext({ steps: [...pick(0), 'x', 'x', ...pick(0), () => {
            expect(row(term.screen, 1)).toContain('Only one drink today.');
            return 'x';
        }, ...pick(2)] });
        await bar(g);
        expect(g.flags.hadDrink).toBe(true);
    });

    test('chatting', async () => {
        const { g, term } = scriptContext({ steps: [...pick(1), () => {
            expect(row(term.screen, 1)).toContain("I've got nothing to say to you.");
            return 'x';
        }, ...pick(2)] });
        await bar(g);
        expect(g.flags.hadDrink).toBe(false);
    });
});

describe('the Port City guards', () => {
    test('turn you away without a pass', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 486, x: 3, y: 9 }), steps: [() => {
            expect(screenText(term.screen)).toContain('Hey, let me see your pass!');
            return 'x';
        }] });
        await cityGuards(g);
        expect([g.x, g.y]).toEqual([2, 9]);
    });

    test('let you pass with one', async () => {
        const { g, term } = scriptContext({ player: newPlayer({ screen: 486, x: 3, y: 9, items: { 'port-city-pass': 1 } }) });
        await cityGuards(g);
        expect(row(term.screen, 23)).toContain('The guards eye you as you pass.');
        expect(g.tookScreen).toBe(false);
    });
});
