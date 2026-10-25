#!/usr/bin/env bun
// The multiplayer server -- run with:  bun server.ts [options]  (or bun run server)

import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import content from './content/index.ts';
import { startServer, type RunningServer } from './server/server.ts';

const USAGE = `Usage: bun server.ts [options]

  --host ADDRESS        where to listen (default: 127.0.0.1, this computer
                        only; 0.0.0.0 lets other computers in)
  --telnet-port N       telnet port (default: 2323)
  --web-port N          web port (default: 8080); players open http://host:N/
  --no-telnet           don't accept telnet (it sends passwords unencrypted)
  --no-web              don't accept web browsers
  --data DIR            where the database goes (default: server-data)
  --max-players N       connections at once (default: 50)
  --idle-minutes N      disconnect players idle this long (default: 30)
  -h, --help            show this help`;

const { values } = parseArgs({
    options: {
        'host': { type: 'string', default: '127.0.0.1' },
        'telnet-port': { type: 'string', default: '2323' },
        'web-port': { type: 'string', default: '8080' },
        'no-telnet': { type: 'boolean', default: false },
        'no-web': { type: 'boolean', default: false },
        'data': { type: 'string', default: 'server-data' },
        'max-players': { type: 'string', default: '50' },
        'idle-minutes': { type: 'string', default: '30' },
        'help': { type: 'boolean', short: 'h', default: false },
    },
});

if (values.help) {
    console.log(USAGE);
    process.exit(0);
}

const number = (name: string, value: string): number => {
    if (!/^\d+$/.test(value)) {
        console.error(`--${name} must be a whole number, not "${value}".`);
        process.exit(1);
    }

    return Number(value);
};

const dataDir = resolve(values.data);
mkdirSync(dataDir, { recursive: true });

// Starts the server, or explains why it can't (a port someone else has,
// for one) and exits.
function start(): RunningServer {
    try {
        return startServer({
            content,
            dataDir: join(import.meta.dir, 'data'),
            database: join(dataDir, 'fq2.sqlite'),
            host: values.host,
            telnetPort: values['no-telnet'] ? null : number('telnet-port', values['telnet-port']),
            webPort: values['no-web'] ? null : number('web-port', values['web-port']),
            maxPlayers: number('max-players', values['max-players']),
            idleMinutes: number('idle-minutes', values['idle-minutes']),
        });
    } catch (error) {
        const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
        console.error(
            code === 'EADDRINUSE'
                ? 'A port the server needs is already in use. Is it running already? (--telnet-port and --web-port choose others.)'
                : `The server couldn't start: ${error instanceof Error ? error.message : String(error)}`,
        );
        process.exit(1);
    }
}

const server = start();

const shutDown = (): void => {
    console.log('Shutting down...');
    void server.stop().then(() => process.exit(0));
};
process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
