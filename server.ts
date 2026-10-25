#!/usr/bin/env bun
// The multiplayer server -- run with:  bun server.ts [options]  (or bun run server)

import { join, resolve } from 'node:path';
import { mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';
import content from './content/index.ts';
import { startServer, type RunningServer } from './server/server.ts';
import { smtpMailer, type Mailer } from './server/mail.ts';

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
  --smtp-host HOST      the mail server that sends players' codes (without
                        one, emails are written to the log instead)
  --smtp-port N         its port (default: 587; 465 for TLS from the start)
  --smtp-user NAME      who to log in to it as; the password comes from the
                        FQ2_SMTP_PASSWORD environment variable
  --mail-from ADDRESS   who the emails are from (default: the --smtp-user)
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
        'smtp-host': { type: 'string' },
        'smtp-port': { type: 'string', default: '587' },
        'smtp-user': { type: 'string' },
        'mail-from': { type: 'string' },
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

// Where players' codes are emailed from, if anywhere.
function mailer(): Mailer | null {
    const host = values['smtp-host'];
    if (host === undefined) {
        console.warn('No --smtp-host: emails (with players\' codes) will be written to the log, not sent.');
        return null;
    }

    const user = values['smtp-user'];
    const from = values['mail-from'] ?? user;
    if (from === undefined) {
        console.error('--mail-from is needed (or --smtp-user) to say who the emails are from.');
        process.exit(1);
    }

    const password = process.env['FQ2_SMTP_PASSWORD'];
    return smtpMailer({
        host,
        port: number('smtp-port', values['smtp-port']),
        from,
        ...(user === undefined ? {} : { user }),
        ...(password === undefined ? {} : { password }),
    });
}

const dataDir = resolve(values.data);
const mail = mailer();
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
            ...(mail ? { mailer: mail } : {}),
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
