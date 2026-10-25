// The telnet protocol, as far as a full-screen game needs it: the server
// does the echoing and wants each key as it's pressed (not a line at a
// time), and asks for the window size (NAWS). Telnet commands are mixed in
// with what the player types, so they're taken out here.

const IAC = 255;
const DONT = 254;
const DO = 253;
const WONT = 252;
const WILL = 251;
const SB = 250;
const SE = 240;
const ECHO = 1;
const SUPPRESS_GO_AHEAD = 3;
const NAWS = 31;

// What the server says when a player connects: "I'll echo", "no go-aheads",
// and "please tell me your window size".
export const TELNET_GREETING = new Uint8Array([IAC, WILL, ECHO, IAC, WILL, SUPPRESS_GO_AHEAD, IAC, DO, SUPPRESS_GO_AHEAD, IAC, DO, NAWS]);

export interface TelnetInput {
    // What the player typed, as text.
    text: string;
    // The window size, if the client told us (the last one, if more than once).
    size: { columns: number; rows: number } | null;
}

type State = 'data' | 'command' | 'option' | 'subnegotiation' | 'subnegotiation-command';

// Reads the bytes from a telnet client. Commands can arrive split across
// reads; so can the bytes of a UTF-8 character.
export class TelnetParser {
    private state: State = 'data';
    private subnegotiation: number[] = [];
    private readonly decoder = new TextDecoder('utf-8');

    public feed(bytes: Uint8Array): TelnetInput {
        const data: number[] = [];
        let size: TelnetInput['size'] = null;
        for (const byte of bytes) {
            switch (this.state) {
                case 'data':
                    if (byte === IAC) {
                        this.state = 'command';
                    } else {
                        data.push(byte);
                    }
                    break;
                case 'command':
                    if (byte === IAC) {
                        // A doubled IAC is a literal 255.
                        data.push(IAC);
                        this.state = 'data';
                    } else if (byte >= WILL && byte <= DONT) {
                        this.state = 'option';
                    } else if (byte === SB) {
                        this.subnegotiation = [];
                        this.state = 'subnegotiation';
                    } else {
                        // NOP, break, go-ahead and so on: nothing to do.
                        this.state = 'data';
                    }
                    break;
                case 'option':
                    // The client's answers to what we asked; we just carry on.
                    this.state = 'data';
                    break;
                case 'subnegotiation':
                    if (byte === IAC) {
                        this.state = 'subnegotiation-command';
                    } else {
                        this.subnegotiation.push(byte);
                    }
                    break;
                case 'subnegotiation-command':
                    if (byte === SE) {
                        size = windowSize(this.subnegotiation) ?? size;
                        this.state = 'data';
                    } else {
                        // A doubled IAC inside a subnegotiation.
                        this.subnegotiation.push(byte);
                        this.state = 'subnegotiation';
                    }
                    break;
            }
        }

        return { text: this.decoder.decode(new Uint8Array(data), { stream: true }), size };
    }
}

// The window size from a NAWS subnegotiation: option, width (2 bytes),
// height (2 bytes).
function windowSize(bytes: readonly number[]): TelnetInput['size'] {
    const [option, w1 = 0, w2 = 0, h1 = 0, h2 = 0] = bytes;
    if (option !== NAWS || bytes.length < 5) {
        return null;
    }

    return { columns: w1 * 256 + w2, rows: h1 * 256 + h2 };
}

export const TELNET = { IAC, DO, DONT, WILL, WONT, SB, SE, ECHO, SUPPRESS_GO_AHEAD, NAWS } as const;
