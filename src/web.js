const express = require('express')

function createWebServer({ config, logger, bot, scheduler, keywords }) {
  const app = express()
  app.use(express.urlencoded({ extended: false }))

  function fmtDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds))
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  function fmtTs(value) {
    return value ? new Date(value).toLocaleString() : 'n/a'
  }

  function eta(value) {
    if (!value) {
      return 'n/a'
    }

    const ms = new Date(value).getTime() - Date.now()
    if (ms <= 0) {
      return 'due now'
    }

    return fmtDuration(ms / 1000)
  }

  function baseStyles() {
    return `<style>
      :root {
        color-scheme: light dark;
        --bg: #f6f7fb;
        --surface: #ffffff;
        --text: #111827;
        --muted: #4b5563;
        --border: #d1d5db;
        --accent: #0f766e;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #0b1220;
          --surface: #111827;
          --text: #e5e7eb;
          --muted: #9ca3af;
          --border: #374151;
          --accent: #2dd4bf;
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif;
        background: radial-gradient(circle at top right, rgba(45, 212, 191, 0.10), transparent 38%), var(--bg);
        color: var(--text);
      }
      main { max-width: 980px; margin: 0 auto; padding: 1.25rem; }
      nav { display: flex; gap: 0.75rem; margin-bottom: 1rem; }
      nav a { color: var(--accent); text-decoration: none; font-weight: 600; }
      .card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1rem;
      }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 0.45rem 0; border-bottom: 1px solid var(--border); vertical-align: top; }
      td:first-child { color: var(--muted); width: 260px; }
      form { display: inline-block; margin: 0.25rem 0.4rem 0.25rem 0; }
      button {
        border: 1px solid var(--border);
        border-radius: 8px;
        padding: 0.48rem 0.75rem;
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
      }
      button:hover { border-color: var(--accent); }
      pre {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 1rem;
        overflow-x: auto;
        white-space: pre-wrap;
      }
      .muted { color: var(--muted); }
    </style>`
  }

  function renderPage(title, body) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  ${baseStyles()}
</head>
<body>
  <main>
    <h1>${title}</h1>
    <nav>
      <a href="/">Dashboard</a>
      <a href="/logs">Logs</a>
      <a href="/config">Config</a>
      <a href="/keywords">Keywords</a>
      <a href="/health">Health JSON</a>
    </nav>
    ${body}
  </main>
</body>
</html>`
  }

  function escapeHtml(value) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function normalizeKeyword(value) {
    return String(value || '').trim().toLowerCase()
  }

  function isValidKeyword(value) {
    return /^[a-z0-9_-]{1,32}$/i.test(value)
  }

  app.get('/', (_req, res) => {
    const memMb = (process.memoryUsage().rss / 1024 / 1024).toFixed(1)
    const lastBump = scheduler.getLastBump()
    const nextBump = scheduler.getNextBump()
    const range = scheduler.getIntervalRange()

    const html = renderPage(
      'Disboard Bot Dashboard',
      `<section class="card">
        <table>
          <tr><td>Bot status</td><td>${bot.isReady() ? 'online' : 'starting'}</td></tr>
          <tr><td>Scheduler</td><td>${scheduler.isPaused() ? 'paused' : scheduler.isRunning() ? 'running bump now' : 'active'}</td></tr>
          <tr><td>Process uptime</td><td>${fmtDuration(process.uptime())}</td></tr>
          <tr><td>Last bump timestamp</td><td>${fmtTs(lastBump)}</td></tr>
          <tr><td>Next bump ETA</td><td>${eta(nextBump)}</td></tr>
          <tr><td>Next bump timestamp</td><td>${fmtTs(nextBump)}</td></tr>
          <tr><td>Interval range</td><td>${range.minMs / 3600000}h - ${range.maxMs / 3600000}h</td></tr>
          <tr><td>Process memory usage</td><td>${memMb} MB RSS</td></tr>
          <tr><td>Process pid</td><td>${process.pid}</td></tr>
        </table>
      </section>

      <section class="card">
        <form method="post" action="/actions/force-bump"><button type="submit">Force bump now</button></form>
        <form method="post" action="/actions/pause"><button type="submit">Pause scheduler</button></form>
        <form method="post" action="/actions/resume"><button type="submit">Resume scheduler</button></form>
        <form method="post" action="/actions/restart" onsubmit="return confirm('Restart process now?')"><button type="submit">Restart process</button></form>
      </section>
      <p class="muted">Restart exits the process with code 0 so PM2 can bring it back.</p>`
    )

    res.type('html').send(html)
  })

  app.get('/logs', (_req, res) => {
    const lines = logger.getRecentLines(100)
    const html = renderPage('Recent Logs', `<pre>${escapeHtml(lines.join('\n') || 'No logs yet.')}</pre>`)
    res.type('html').send(html)
  })

  app.get('/config', (_req, res) => {
    const range = scheduler.getIntervalRange()
    const html = renderPage(
      'Safe Configuration',
      `<section class="card"><table>
        <tr><td>Interval range</td><td>${range.minMs / 3600000}h - ${range.maxMs / 3600000}h</td></tr>
        <tr><td>Bump channel id</td><td>${config.bumpChannelId || 'missing'}</td></tr>
        <tr><td>Log channel id</td><td>${config.logChannelId || 'missing'}</td></tr>
        <tr><td>Environment mode</td><td>${config.env}</td></tr>
      </table></section>`
    )
    res.type('html').send(html)
  })

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      last_bump: scheduler.getLastBump(),
      next_bump: scheduler.getNextBump(),
    })
  })

  app.get('/keywords', (req, res) => {
    const message = req.query.msg ? String(req.query.msg) : ''
    const tone = req.query.tone === 'error' ? 'error' : message ? 'ok' : ''
    const list = keywords.list()

    const rows = list.length
      ? list
          .map(
            (item) => `<tr>
          <td><code>${escapeHtml(item.keyword)}</code></td>
          <td>${escapeHtml(item.reply)}</td>
          <td>
            <form method="post" action="/keywords/delete">
              <input type="hidden" name="keyword" value="${escapeHtml(item.keyword)}" />
              <button type="submit">Delete</button>
            </form>
          </td>
        </tr>`
          )
          .join('')
      : '<tr><td colspan="3">No keywords yet.</td></tr>'

    const feedback = message
      ? `<p class="muted" style="color:${tone === 'error' ? '#ef4444' : 'inherit'}">${escapeHtml(message)}</p>`
      : ''

    const html = renderPage(
      'Custom Keyword Replies',
      `<section class="card">
        <p class="muted">Use in chat as <code>@bot keyword</code>. Single-word keyword only.</p>
        ${feedback}
        <form method="post" action="/keywords/add" style="display:block; margin-bottom: 0.75rem;">
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
            <input name="keyword" maxlength="32" placeholder="keyword" required style="padding:0.45rem 0.55rem; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--text);" />
            <input name="reply" maxlength="500" placeholder="reply message" required style="flex:1; min-width:220px; padding:0.45rem 0.55rem; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--text);" />
            <button type="submit">Save keyword</button>
          </div>
        </form>
        <p class="muted">Saved keywords: ${list.length}</p>
        <table>
          <tr><td>Keyword</td><td>Reply</td><td>Action</td></tr>
          ${rows}
        </table>
      </section>`
    )

    res.type('html').send(html)
  })

  app.post('/keywords/add', (req, res) => {
    const rawKeyword = String(req.body.keyword || '').trim()
    const normalized = normalizeKeyword(rawKeyword)
    const reply = String(req.body.reply || '').trim()

    if (!isValidKeyword(normalized)) {
      res.redirect('/keywords?tone=error&msg=' + encodeURIComponent('Invalid keyword. Use letters, numbers, _ or -, max 32 chars.'))
      return
    }

    if (normalized === 'status') {
      res.redirect('/keywords?tone=error&msg=' + encodeURIComponent('Keyword "status" is reserved.'))
      return
    }

    if (!reply || reply.length > 500) {
      res.redirect('/keywords?tone=error&msg=' + encodeURIComponent('Reply is required and must be 1-500 characters.'))
      return
    }

    keywords.set(normalized, reply)
    logger.info(`keyword saved: ${normalized}`)
    res.redirect('/keywords?msg=' + encodeURIComponent(`Saved keyword "${normalized}"`))
  })

  app.post('/keywords/delete', (req, res) => {
    const normalized = normalizeKeyword(req.body.keyword)
    if (!normalized) {
      res.redirect('/keywords?tone=error&msg=' + encodeURIComponent('Keyword is required.'))
      return
    }

    const removed = keywords.remove(normalized)
    if (removed) {
      logger.info(`keyword deleted: ${normalized}`)
      res.redirect('/keywords?msg=' + encodeURIComponent(`Deleted keyword "${normalized}"`))
      return
    }

    res.redirect('/keywords?tone=error&msg=' + encodeURIComponent('Keyword not found.'))
  })

  app.post('/actions/force-bump', async (_req, res) => {
    await scheduler.forceBump()
    res.redirect('/')
  })

  app.post('/actions/pause', (_req, res) => {
    scheduler.pause()
    res.redirect('/')
  })

  app.post('/actions/resume', (_req, res) => {
    scheduler.resume()
    res.redirect('/')
  })

  app.post('/actions/restart', (_req, res) => {
    logger.warn('restart requested from web panel')
    res.redirect('/')
    setTimeout(() => process.exit(0), 250)
  })

  app.listen(config.port, () => {
    logger.info(`web panel listening on port ${config.port}`)
  })

  return app
}

module.exports = { createWebServer }
