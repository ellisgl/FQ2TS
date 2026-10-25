# Multiplayer plan

Final Quest 2 was inspired by Legend of the Red Dragon II, a multiplayer BBS
door game. This is the plan for live multiplayer in the TypeScript version:
players connect to one server by telnet or a web browser, see each other move
around the map, talk, and fight.

Single-player stays as it is (`bun start`, with save slots). Multiplayer is a
separate entry point (`bun run server`).

## Architecture

```
                       +------------- server.ts (one Bun process) -------------+
 telnet client --TCP-->| TelnetConnection -> Terminal -> Session (Game) --+     |
 browser (xterm.js) WS>| WebConnection    -> Terminal -> Session (Game) --+     |
                       |                                                 v     |
                       |        Realm: who's online, where, chat, news,        |
                       |        shared flags, PvP ---- SQLite (bun:sqlite)      |
                       +-------------------------------------------------------+
```

- **Connections** turn a socket into the `TerminalInput` / `TerminalOutput`
  pair `Terminal` already accepts.
  - Telnet needs a small protocol layer: echo off, character-at-a-time
    input, window size (NAWS) for the 80x25 check, and stripping telnet
    commands from the input.
  - The web client is a static page with xterm.js, sending keys and resizes
    over a WebSocket (the editor's mouse support works there too).
- **Session**: today's `Game`, one per connection, with the player's state
  loaded from and saved to the database instead of save slots.
- **Realm**: the shared state of everyone online. It tracks who's on which
  screen, passes events between sessions (moves, chat, arrivals), holds the
  world-wide flags and writes the news.
- **Storage**: SQLite through `bun:sqlite` (built into Bun): accounts,
  players (as JSON), world flags, news, mail.

The server is one process, so shared state needs no locks: a check and a
change with no `await` between them can't be interrupted.

## What players get

| Key | |
|---|---|
| (map) | Other players drawn live on your screen; notices when they arrive and leave |
| P / L | Who's online / every player, ranked |
| T / Y | Talk to your screen / yell to everyone |
| W | Write mail; new mail is announced when you log in |
| D | The daily news: deaths, PvP results, big purchases... |
| H | Fight a player on your square (not on safe screens) |

Shared world state makes some things unique (only one player can own the
castle). A daily cycle at midnight resets per-day things.

## Phases

Each phase ends playable, tested and committed.

0. **Groundwork, still single-player.**
   - The game reports when to save the player (`autosave`), so the server
     can keep them in the database instead of save slots.
   - The game knows whether it's showing the map or a full-screen script,
     so other players' moves are only drawn on the map.
   - Text players write (names; later chat and mail) is escaped, so it
     can't inject colour markup into other players' screens.
1. **The server.** Telnet and WebSocket transports and the browser page;
   accounts with password hashes (`Bun.password`, argon2id); login and new
   player screens in place of save and load; autosave; idle timeout and a
   connection limit; each session's errors contained to that session.
2. **Presence.** Live positions on the map, arrival and departure notices,
   P and L.
3. **Talking.** T, Y, mail, the daily news, chat in the back-buffer (B).
4. **Shared world.** Content declares world flags beside player flags;
   scripts get `g.world` and `g.news(text)`.
5. **PvP and days.** H runs a fight against the other player's stats (as
   LORD fought players), and they're told the result; safe screens get a
   flag in the map files (and an editor key); midnight maintenance.
6. **Operations.** A config file (ports, limits), logging, admin kick and
   ban, deployment notes (systemd; TLS for the web through a reverse proxy).

## Status

- **Phase 0: done.** `autosave`, `Game.showingMap`, `escapeMarkup`.
- **Phase 1: done.** `bun run server` (see the README). Notes:
  - Telnet output is UTF-8 only (open question 1, decided).
  - The server listens on 127.0.0.1 unless given `--host`.
  - Bun 1.3's `server.stop()` promise never settles once a web socket has
    connected (it does stop listening), so shutdown doesn't wait on it.
  - An account's name is its player's name; a new game doesn't ask again.
  - Every account has an email address, confirmed with a 6-digit code
    before it can play (accounts from before this are asked for one when
    they log in). A confirmed address belongs to one account (unconfirmed
    ones can be shared, so no one can hold an address they don't own; the
    first to confirm it gets it). "Forgot password" on the login menu
    emails a reset code. "Change email" on the in-game menu asks for the
    password, then a code sent to the new address, and tells the old one.
    Codes work for 15 minutes and 5 guesses and are stored hashed; another
    can be sent after a minute, and one connection can send 5 emails.
    Mail goes through SMTP (nodemailer), or into the log without
    `--smtp-host`.
  - The database's layout is a list of steps in `packages/server/src/migrations.ts`;
    opening a database runs the steps it hasn't had (SQLite's
    `user_version` counts them), each in a transaction, and a database
    from a newer server is refused. To change the layout, add a step.
  - SSH (ssh2) on port 2222: any user name, no password, then the same
    login screen. Only a shell: no commands, forwarding or file transfer.
    The host key (ed25519) is made on first start. A client gets 30
    seconds to ask for a terminal. ssh2 is patched not to load its native
    add-ons, which crash Bun.

## Testing

- Realm logic: several `FakeTerminal` sessions in one test.
- The telnet layer: unit tests for its command parsing.
- One integration test that starts the server on a random port and
  connects with a TCP client and a WebSocket.

## Open questions

1. ~~**Telnet character set.**~~ Decided: UTF-8 only. The game uses
   Unicode throughout (any character one column wide), not CP437, so
   CP437-only BBS clients aren't supported.
2. **Which flags become world-wide.** The castle owner, clearly; the barn
   gold and the minigun are open.
3. **PvP rules.** What the loser loses, and whether offline players can be
   attacked (LORD I: yes; LORD II: no).
4. ~~**Telnet sends passwords in the clear.**~~ Decided: SSH (any user
   name, no password, then the game's login screen) for secure terminal
   play, and the web client over TLS; telnet stays for LANs and BBSes and
   can be turned off. No telnet over TLS: few clients support it.
