const fs = require('fs')
const path = require('path')

function createLogger({ logFilePath, maxFileSizeBytes }) {
  const absolutePath = path.resolve(logFilePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })

  function truncateIfNeeded() {
    try {
      const stats = fs.statSync(absolutePath)
      if (stats.size > maxFileSizeBytes) {
        fs.writeFileSync(absolutePath, '')
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(error)
      }
    }
  }

  function write(level, message) {
    const line = `[${new Date().toISOString()}] ${level} ${message}`
    console.log(line)
    truncateIfNeeded()
    fs.appendFileSync(absolutePath, `${line}\n`)
  }

  function getRecentLines(limit = 100) {
    try {
      const content = fs.readFileSync(absolutePath, 'utf8')
      const lines = content.split(/\r?\n/).filter(Boolean)
      return lines.slice(-limit)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []
      }

      return [`[${new Date().toISOString()}] ERROR unable to read log file`] 
    }
  }

  return {
    info: (message) => write('INFO', message),
    warn: (message) => write('WARN', message),
    error: (message) => write('ERROR', message),
    getRecentLines,
    logFilePath: absolutePath,
  }
}

module.exports = { createLogger }
