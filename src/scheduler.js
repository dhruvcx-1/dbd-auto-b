function createScheduler({ minIntervalMs, maxIntervalMs, onBump, logger }) {
  let timer = null
  let paused = true
  let running = false
  let lastBumpAt = null
  let nextBumpAt = null

  function randomIntervalMs() {
    return Math.round(Math.random() * (maxIntervalMs - minIntervalMs) + minIntervalMs)
  }

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function scheduleNext() {
    if (paused) {
      nextBumpAt = null
      return
    }

    const delay = randomIntervalMs()
    nextBumpAt = Date.now() + delay
    logger.info(`next bump scheduled for ${new Date(nextBumpAt).toISOString()}`)

    clearTimer()
    timer = setTimeout(async () => {
      await runBumpCycle('scheduled')
    }, delay)
  }

  async function runBumpCycle(source) {
    if (running) {
      logger.warn(`${source} bump ignored because previous bump is still running`)
      return false
    }

    running = true
    nextBumpAt = null

    try {
      await onBump()
      lastBumpAt = Date.now()
      return true
    } catch (error) {
      logger.error(`bump failed: ${error.message}`)
      return false
    } finally {
      running = false
      if (!paused) {
        scheduleNext()
      }
    }
  }

  return {
    getLastBump: () => (lastBumpAt ? new Date(lastBumpAt).toISOString() : null),
    getNextBump: () => (nextBumpAt ? new Date(nextBumpAt).toISOString() : null),
    getIntervalRange: () => ({ minMs: minIntervalMs, maxMs: maxIntervalMs }),
    isPaused: () => paused,
    isRunning: () => running,
    forceBump: async () => {
      clearTimer()
      return runBumpCycle('force')
    },
    pause: () => {
      paused = true
      clearTimer()
      nextBumpAt = null
      logger.info('scheduler paused')
    },
    resume: () => {
      if (!paused) {
        return
      }

      paused = false
      logger.info('scheduler resumed')
      scheduleNext()
    },
  }
}

module.exports = { createScheduler }
