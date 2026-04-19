require('dotenv').config()

const TWO_HOURS_MS = 2 * 60 * 60 * 1000
const TWO_AND_HALF_HOURS_MS = 2.5 * 60 * 60 * 1000

function toNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

module.exports = {
  env: process.env.NODE_ENV || 'development',
  token: process.env.TOKEN,
  bumpChannelId: process.env.BUMP_CHANNEL,
  logChannelId: process.env.LOG_CHANNEL,
  clientStatus: process.env.CLIENT_STATUS || 'Bumping the server!',
  port: toNumber(process.env.PORT, 3000),
  intervalMinMs: TWO_HOURS_MS,
  intervalMaxMs: TWO_AND_HALF_HOURS_MS,
  logFilePath: process.env.LOG_FILE || 'logs/app.log',
  maxLogFileSizeBytes: toNumber(process.env.MAX_LOG_SIZE, 1024 * 1024),
  keywordsFilePath: process.env.KEYWORDS_FILE || 'data/keywords.json',
}
