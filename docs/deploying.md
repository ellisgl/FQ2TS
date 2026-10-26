# Running a server

How to run the multiplayer server for real: on a Linux machine, started by
systemd, with the web page behind HTTPS, admins, backups and upgrades.

## What it needs

- Linux with [Bun](https://bun.sh) 1.3 or later.
- Open ports for the ways players connect: telnet (2323), SSH (2222), and
  HTTPS (443) for the web page, through a proxy (below).
- An SMTP account to send players' codes (confirming email addresses,
  resetting passwords). Without one, codes are only written to the log.

## Install

```sh
sudo useradd --system --create-home --home-dir /srv/fq2 fq2
sudo -u fq2 -i
curl -fsSL https://bun.sh/install | bash
git clone <this repository> ~/fq2js
cd ~/fq2js
bun install
```

`bun install` applies the patch in `patches/` (ssh2's native add-ons crash
Bun) and builds nothing (`trustedDependencies` is empty).

## Configure

Settings go in `.env`, in the folder the server starts in (the repository).
Copy the example and fill it in:

```sh
cp .env.example .env
chmod 600 .env          # it holds the SMTP password
```

For a public server, the important ones:

```sh
FQ2_HOST=0.0.0.0           # telnet and SSH listen to everyone...
FQ2_WEB_HOST=127.0.0.1     # ...the web page only to the proxy, on this machine
FQ2_SMTP_HOST=smtp.example.com
FQ2_SMTP_USER=game@example.com
FQ2_SMTP_PASSWORD=...
FQ2_MAIL_FROM=Final Quest 2 <game@example.com>
```

Turn off what you don't want (`FQ2_NO_TELNET=true`: telnet sends passwords
unencrypted). `bun run server -h` lists every setting.

The game rules can be changed the same way: how many fights between
players a day (`FQ2_FIGHTS_PER_DAY`), what the winner takes, how often
players can talk, how many letters they can send and keep, and how long
the news lasts. `.env.example` lists them with their defaults.

The database and the SSH host key go in `server-data/` (`FQ2_DATA`). Keep
`ssh_host_ed25519_key`: if it's lost, a new one is made, and players' SSH
clients will warn that the server has changed.

## Start it with systemd

`/etc/systemd/system/fq2.service`:

```ini
[Unit]
Description=Final Quest 2 server
After=network-online.target
Wants=network-online.target

[Service]
User=fq2
WorkingDirectory=/srv/fq2/fq2js
ExecStart=/srv/fq2/.bun/bin/bun run server
Restart=on-failure
# The server saves everyone and says goodbye on SIGTERM.
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl daemon-reload
sudo systemctl enable --now fq2
journalctl -u fq2 -f       # the log: who comes and goes, kicks and bans, errors
```

To use the usual ports (telnet's 23, SSH's 22 if the machine's own SSH is
elsewhere), let the service bind them with
`AmbientCapabilities=CAP_NET_BIND_SERVICE` under `[Service]`, and set
`FQ2_TELNET_PORT=23`.

## The web page, over HTTPS

The server speaks plain HTTP; a proxy in front gives it HTTPS (the page
uses `wss://` for its web socket when it's loaded over HTTPS). With
[Caddy](https://caddyserver.com), which gets the certificate itself:

```
play.example.com {
    reverse_proxy 127.0.0.1:8080
}
```

With nginx (and a certificate from certbot), the web socket needs its
upgrade headers passed on:

```nginx
server {
    listen 443 ssl;
    server_name play.example.com;
    # ssl_certificate ... (from certbot)

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 1h;
    }
}
```

Open the firewall for the proxy and the game, not the web port itself:

```sh
sudo ufw allow 80,443/tcp
sudo ufw allow 2323/tcp     # telnet
sudo ufw allow 2222/tcp     # SSH
```

## Admins

Make an account in the game, then make it an admin:

```sh
bun run admin admin YourName
```

In the game, admins press `!` for the admin menu: kick someone out of the
realm (they're told why), ban or unban an account, or tell everyone
something. From the command line (while the server runs, too):

```sh
bun run admin list                      # every account
bun run admin ban Name Cheating at dice  # they're told the reason
bun run admin unban Name
```

A ban from the command line stops the player coming back in; to put them
out now, kick them from the game. Every kick and ban is in the log.

## Backups

The database is one file, `server-data/fq2.sqlite`. Copy it while the
server runs with SQLite's `VACUUM INTO`, which makes a consistent copy:

```sh
bun -e "new (require('bun:sqlite').Database)('server-data/fq2.sqlite').run(\"VACUUM INTO '/backups/fq2-$(date +%F).sqlite'\")"
```

(A daily cron job of that, and a copy of `.env` and the SSH host key, is
everything.) To restore, stop the server, delete `server-data/fq2.sqlite`
and any `fq2.sqlite-wal` and `fq2.sqlite-shm` beside it, and put the copy
back as `server-data/fq2.sqlite`.

## Upgrading

```sh
git pull
bun install
sudo systemctl restart fq2
```

A newer version brings its database up to date when it starts (its log
says which steps it ran). An older version refuses a database a newer one
has changed, rather than damage it: take a backup before upgrading if you
might go back.

## Mods

Mods go in `mods/` (or `FQ2_MODS`), and the server lists the ones it loads.
They're code, run with the server's permissions: only install mods you
trust. See [mods.md](mods.md).
