import { describe, expect, test } from 'bun:test';
import { TELNET, TELNET_GREETING, TelnetParser } from '../../server/telnet.ts';

const { IAC, DO, WILL, WONT, SB, SE, NAWS } = TELNET;
const bytes = (...parts: (number | string)[]): Uint8Array =>
    new Uint8Array(parts.flatMap((p) => (typeof p === 'number' ? [p] : [...new TextEncoder().encode(p)])));

describe('TelnetParser', () => {
    test('plain text passes through', () => {
        expect(new TelnetParser().feed(bytes('hello\r\n'))).toEqual({ text: 'hello\r\n', size: null });
    });

    test('negotiation answers and other commands are taken out', () => {
        const input = bytes('a', IAC, WILL, NAWS, 'b', IAC, WONT, 1, IAC, 241, 'c', IAC, DO, 3);
        expect(new TelnetParser().feed(input).text).toBe('abc');
    });

    test('the window size comes from NAWS', () => {
        expect(new TelnetParser().feed(bytes(IAC, SB, NAWS, 0, 80, 0, 25, IAC, SE)).size).toEqual({ columns: 80, rows: 25 });
        expect(new TelnetParser().feed(bytes(IAC, SB, NAWS, 1, 0, 0, 50, IAC, SE)).size).toEqual({ columns: 256, rows: 50 });
    });

    test('the last window size wins, and other subnegotiations are ignored', () => {
        const input = bytes(IAC, SB, 24, 0, 'xterm', IAC, SE, IAC, SB, NAWS, 0, 90, 0, 30, IAC, SE, IAC, SB, NAWS, 0, 100, 0, 40, IAC, SE);
        expect(new TelnetParser().feed(input)).toEqual({ text: '', size: { columns: 100, rows: 40 } });
    });

    test('a doubled IAC is a 255 byte, in text and in a window size', () => {
        expect(new TelnetParser().feed(bytes('x', IAC, IAC)).text).toBe('x�');
        expect(new TelnetParser().feed(bytes(IAC, SB, NAWS, 0, IAC, IAC, 0, 25, IAC, SE)).size).toEqual({ columns: 255, rows: 25 });
    });

    test('commands and characters split across reads', () => {
        const parser = new TelnetParser();
        const smile = new TextEncoder().encode('☺');
        expect(parser.feed(bytes('a', IAC))).toEqual({ text: 'a', size: null });
        expect(parser.feed(bytes(SB, NAWS, 0, 80))).toEqual({ text: '', size: null });
        expect(parser.feed(bytes(0, 25, IAC))).toEqual({ text: '', size: null });
        expect(parser.feed(bytes(SE, 'b', smile[0] ?? 0))).toEqual({ text: 'b', size: { columns: 80, rows: 25 } });
        expect(parser.feed(smile.subarray(1))).toEqual({ text: '☺', size: null });
    });

    test('a subnegotiation that goes on and on is cut short, and parsing carries on after it', () => {
        const parser = new TelnetParser();
        expect(parser.feed(bytes(IAC, SB, NAWS, 0, 90, 0, 30))).toEqual({ text: '', size: null });
        expect(parser.feed(new Uint8Array(100_000).fill(7))).toEqual({ text: '', size: null });
        expect(parser.feed(bytes(IAC, SE, 'ok'))).toEqual({ text: 'ok', size: { columns: 90, rows: 30 } });
    });

    test('a short NAWS gives no size', () => {
        expect(new TelnetParser().feed(bytes(IAC, SB, NAWS, 0, 80, IAC, SE)).size).toBeNull();
    });
});

test('the greeting offers echo and no go-aheads, and asks for the window size', () => {
    expect([...TELNET_GREETING]).toEqual([IAC, WILL, 1, IAC, WILL, 3, IAC, DO, 3, IAC, DO, NAWS]);
});
