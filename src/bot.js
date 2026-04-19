const { Client } = require('discord.js-selfbot-v13')

function createBot({ config, logger, keywords }) {
  const client = new Client()
  let bumpChannel = null
  let logChannel = null
  let readyHandler = null
  let statusProvider = null

  function formatTimestamp(value) {
    if (!value) {
      return 'n/a'
    }

    return new Date(value).toLocaleString()
  }

  function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Math.floor(totalSeconds))
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }

  function formatEta(value) {
    if (!value) {
      return 'n/a'
    }

    const ms = new Date(value).getTime() - Date.now()
    if (ms <= 0) {
      return 'due now'
    }

    return formatDuration(ms / 1000)
  }

  function renderStatusBlock(status) {
    return [
      '==============================',
      ' Disboard Bot Status',
      '==============================',
      `Bot:        ${status.botState}`,
      `Scheduler:  ${status.schedulerState}`,
      `Last bump:  ${formatTimestamp(status.lastBump)}`,
      `Next bump:  ${formatTimestamp(status.nextBump)} (${formatEta(status.nextBump)})`,
      `Uptime:     ${formatDuration(status.uptimeSeconds)}`,
      `Memory:     ${status.memoryRssMb.toFixed(1)} MB RSS`,
      `PID:        ${status.pid}`,
      '==============================',
    ].join('\n')
  }

  client.on('ready', async () => {
    logger.info(`logged in as ${client.user.tag}`)

    client.user.setStatus('dnd')
    client.user.setActivity(config.clientStatus, { type: 'WATCHING' })

    try {
      bumpChannel = await client.channels.fetch(config.bumpChannelId)
      logChannel = await client.channels.fetch(config.logChannelId)
    } catch (error) {
      logger.error(`failed to fetch channels: ${error.message}`)
      return
    }

    if (!bumpChannel || !logChannel) {
      logger.error('bump or log channel not found')
      return
    }

    logger.info('bump and log channels loaded')

    try {
      await logChannel.send(`Bot started at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      logger.warn(`unable to send startup message to log channel: ${error.message}`)
    }

    if (readyHandler) {
      try {
        await readyHandler()
      } catch (error) {
        logger.error(`ready handler failed: ${error.message}`)
      }
    }
  })

  client.on('messageCreate', async (message) => {
    if (!client.user || !message || !message.content) {
      return
    }

    if (message.author && message.author.bot) {
      return
    }

    const match = message.content.trim().match(new RegExp(`^<@!?${client.user.id}>\\s+(\\S+)$`, 'i'))
    if (!match) {
      return
    }

    const command = String(match[1] || '').toLowerCase()

    if (!command) {
      return
    }

    if (command === 'status') {
      if (!statusProvider) {
        logger.warn('status command received but status provider is not configured')
        return
      }

      const status = statusProvider()
      const body = `\`\`\`txt\n${renderStatusBlock(status)}\n\`\`\``

      logger.info(`status command requested by ${message.author ? message.author.id : 'unknown'} in ${message.channelId || 'unknown-channel'}`)

      try {
        await message.reply(body)
      } catch (error) {
        logger.warn(`message.reply failed, fallback to channel.send: ${error.message}`)
        await message.channel.send(body)
      }
      return
    }

    if (!keywords) {
      return
    }

    const customReply = keywords.get(command)
    if (!customReply) {
      return
    }

    logger.info(`keyword command "${command}" requested by ${message.author ? message.author.id : 'unknown'} in ${message.channelId || 'unknown-channel'}`)

    try {
      await message.reply(customReply)
    } catch (error) {
      logger.warn(`message.reply failed for keyword, fallback to channel.send: ${error.message}`)
      await message.channel.send(customReply)
    }
  })

  async function bump() {
    if (!bumpChannel || !logChannel) {
      throw new Error('bot is not ready yet')
    }

    await bumpChannel.sendSlash('302050872383242240', 'bump')
    logger.info('bump successful')

    try {
      await logChannel.send(`Bumped the server at ${new Date().toLocaleTimeString()}`)
    } catch (error) {
      logger.warn(`failed to write bump in log channel: ${error.message}`)
    }
  }

  return {
    start: async () => client.login(config.token),
    bump,
    isReady: () => Boolean(client.user && bumpChannel && logChannel),
    getTag: () => (client.user ? client.user.tag : null),
    setReadyHandler: (handler) => {
      readyHandler = handler
    },
    setStatusProvider: (provider) => {
      statusProvider = provider
    },
  }
}

module.exports = { createBot }
