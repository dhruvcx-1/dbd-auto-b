# Disboard Auto-Bump Selfbot

Lightweight Discord selfbot for automatic Disboard bumping with a built-in web panel, scheduler controls, logging, PM2 compatibility, and Docker support.

## Warning

Selfbots violate Discord Terms of Service and may get accounts terminated. Use at your own risk.

## Features

- Auto bump using `/bump` with randomized interval between 2h and 2.5h.
- Scheduler safety: prevents overlapping bumps.
- Web panel in the same process (no extra services).
- Runtime controls from panel: force bump, pause, resume, restart.
- Health endpoint for container/infra checks.
- File + console logging with fixed format.
- Custom keyword replies from web panel (persisted in JSON).
- PM2-friendly restart via `process.exit(0)`.
- Docker + docker-compose support.

## Project Structure

```text
.
├─ index.js
├─ src/
│  ├─ bot.js
│  ├─ config.js
│  ├─ logger.js
│  ├─ scheduler.js
│  ├─ web.js
│  └─ keywords.js
├─ logs/
└─ data/
```

## Requirements

- Node.js LTS (18+ recommended)
- npm

## Setup

1) Install dependencies:

```bash
npm install
```

2) Create env file:

```bash
cp .envsample .env
```

3) Fill `.env`:

```properties
TOKEN=your_discord_token_here
BUMP_CHANNEL=your_bump_channel_id
LOG_CHANNEL=your_log_channel_id
CLIENT_STATUS=your_status_here
PORT=3000
KEYWORDS_FILE=data/keywords.json
```

## Run

Local:

```bash
node index.js
```

or

```bash
npm start
```

PM2:

```bash
pm2 start index.js --name disboard-bot
pm2 logs disboard-bot
```

## Web Panel

Default URL: `http://localhost:3000`

Routes:

- `GET /` dashboard
- `GET /logs` last 100 lines from `logs/app.log`
- `GET /config` safe config values only
- `GET /keywords` manage custom keyword replies
- `GET /health` health JSON

Control actions:

- `POST /actions/force-bump`
- `POST /actions/pause`
- `POST /actions/resume`
- `POST /actions/restart`

Restart exits process with code `0`; PM2 (or docker restart policy) will bring it back.

## Chat Commands

Mention commands are strict and lightweight:

- `@bot status` -> replies with a formatted runtime status block.
- `@bot <keyword>` -> replies with custom message if keyword exists.

Keyword behavior:

- Single-word keyword only.
- Case-insensitive lookup.
- `status` is reserved and cannot be overridden.
- Saving a duplicate keyword overwrites existing reply.

## Logging

Log format:

```text
[timestamp] LEVEL message
```

Example:

```text
[2026-04-19T08:12:33.120Z] INFO bump successful
```

Output destinations:

- Console
- `logs/app.log`

Log file is truncated when it grows past the configured max size.

## Health Endpoint

`GET /health` returns:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "last_bump": "2026-04-19T08:12:33.120Z",
  "next_bump": "2026-04-19T10:20:02.998Z"
}
```

## Docker

Build and run:

```bash
docker build -t disboard-bot .
docker run --env-file .env -p 3000:3000 -v "$(pwd)/logs:/app/logs" -v "$(pwd)/data:/app/data" disboard-bot
```

Using compose:

```bash
docker compose up -d --build
docker compose logs -f
```

Compose includes:

- `restart: unless-stopped`
- `.env` support
- persistent `logs/` and `data/` mounts
- healthcheck against `/health`

## Notes

- Never expose `TOKEN` in UI/logs.
- Keep this project single-bot/single-server and lightweight by design.

