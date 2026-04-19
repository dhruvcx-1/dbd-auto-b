const config = require('./src/config')
const { createLogger } = require('./src/logger')
const { createBot } = require('./src/bot')
const { createScheduler } = require('./src/scheduler')
const { createKeywordsStore } = require('./src/keywords')
const { createWebServer } = require('./src/web')

const logger = createLogger({
  logFilePath: config.logFilePath,
  maxFileSizeBytes: config.maxLogFileSizeBytes,
})

const missingRequired = []
if (!config.token) missingRequired.push('TOKEN')
if (!config.bumpChannelId) missingRequired.push('BUMP_CHANNEL')
if (!config.logChannelId) missingRequired.push('LOG_CHANNEL')

if (missingRequired.length > 0) {
  logger.error(`missing required environment variables: ${missingRequired.join(', ')}`)
  process.exit(1)
}

const keywords = createKeywordsStore({
  filePath: config.keywordsFilePath,
  logger,
})

logger.info(`keywords store loaded from ${keywords.filePath} with ${keywords.count()} items`)

const bot = createBot({ config, logger, keywords })

const scheduler = createScheduler({
  minIntervalMs: config.intervalMinMs,
  maxIntervalMs: config.intervalMaxMs,
  logger,
  onBump: async () => {
    await bot.bump()
  },
})

bot.setStatusProvider(() => {
  const schedulerState = scheduler.isPaused()
    ? 'PAUSED'
    : scheduler.isRunning()
    ? 'RUNNING'
    : 'ACTIVE'

  return {
    botState: bot.isReady() ? 'ONLINE' : 'STARTING',
    schedulerState,
    lastBump: scheduler.getLastBump(),
    nextBump: scheduler.getNextBump(),
    uptimeSeconds: process.uptime(),
    memoryRssMb: process.memoryUsage().rss / 1024 / 1024,
    pid: process.pid,
  }
})

bot.setReadyHandler(async () => {
  logger.info('bot ready, starting scheduler')
  await scheduler.forceBump()
  scheduler.resume()
})

createWebServer({
  config,
  logger,
  bot,
  scheduler,
  keywords,
})

bot.start().catch((error) => {
  logger.error(`bot login failed: ${error.message}`)
  process.exit(1)
})

process.on('unhandledRejection', (error) => {
  logger.error(`unhandled rejection: ${error.message}`)
})

process.on('uncaughtException', (error) => {
  logger.error(`uncaught exception: ${error.message}`)
  process.exit(1)
})
