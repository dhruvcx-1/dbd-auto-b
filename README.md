# Disboard Auto-Bump Selfbot

Lightweight Discord selfbot for one-server Disboard bump automation, with a built-in web panel, simple scheduler controls, custom keyword replies, and Docker/PM2 support.

## Warning

Selfbots violate Discord Terms of Service and may get accounts terminated. Use at your own risk.

## Features

- Automatic `/bump` scheduler with random 2h to 2.5h interval.
- Overlap-safe bump execution.
- In-process web panel (no separate backend/frontend services).
- Dashboard + logs + safe config + health + keyword manager.
- Panel actions: force bump, pause, resume, restart.
- Mention command: `@bot status` formatted status block.
- Mention keyword replies: `@bot <keyword>`.
- Keyword replies persisted in JSON (`data/keywords.json`).
- Lightweight logger to console and `logs/app.log`.
- Docker build and GHCR image publish workflow.

## Project Structure

```text
.
├─ index.js
├─ Dockerfile
├─ docker-compose.yml
├─ docker-compose/
│  └─ compose.yaml
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

## Environment

Copy sample:

```bash
cp .envsample .env
```

Fill `.env`:

```properties
TOKEN=your_discord_token_here
BUMP_CHANNEL=your_bump_channel_id
LOG_CHANNEL=your_log_channel_id
CLIENT_STATUS=your_status_here
PORT=3000
KEYWORDS_FILE=data/keywords.json
```

## Run Locally

```bash
npm install
npm start
```

or:

```bash
node index.js
```

## Run With PM2

```bash
pm2 start index.js --name disboard-bot
pm2 logs disboard-bot
```

Restart from panel uses `process.exit(0)` so PM2 will automatically bring it back.

## Web Panel

Default URL: `http://localhost:3000`

Routes:

- `GET /` dashboard
- `GET /logs` last 100 log lines
- `GET /config` safe configuration view
- `GET /keywords` keyword add/list/delete UI
- `GET /health` container/process health JSON

Actions:

- `POST /actions/force-bump`
- `POST /actions/pause`
- `POST /actions/resume`
- `POST /actions/restart`

## Mention Commands

- `@bot status` returns a formatted runtime status block.
- `@bot <keyword>` returns matching custom reply if keyword exists.

Keyword rules:

- Single-word only.
- Case-insensitive.
- `status` is reserved.
- Duplicate save overwrites existing reply.

## Logging

Format:

```text
[timestamp] LEVEL message
```

Outputs:

- Console
- `logs/app.log`

`logs/app.log` is auto-truncated when it passes max configured size.

## Docker

### Option A: Build local image (default compose)

Uses root `docker-compose.yml` and builds from current source.

```bash
docker compose up -d --build
docker compose logs -f
```

### Option B: Pull from GHCR image

Image:

```bash
docker pull ghcr.io/dhruvcx-1/dbd-auto-b:latest
```

Use registry compose at `docker-compose/compose.yaml`:

```bash
docker compose -f docker-compose/compose.yaml up -d
docker compose -f docker-compose/compose.yaml logs -f
```

This compose file pulls `ghcr.io/dhruvcx-1/dbd-auto-b:latest` instead of building.

## GitHub Actions (GHCR)

Workflow file: `.github/workflows/docker.yml`

- Builds on push/PR.
- Pushes multi-arch image on `main`.
- Platforms: `linux/amd64`, `linux/arm64`.
- Tags: `latest`, `sha-<short-sha>`.

## Notes

- Never expose `TOKEN` in UI, logs, or screenshots.
- `data/keywords.json` is runtime data and is gitignored.

