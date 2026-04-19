const fs = require('fs')
const path = require('path')

function createKeywordsStore({ filePath, logger }) {
  const absolutePath = path.resolve(filePath)
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true })

  let items = {}

  function normalizeKeyword(keyword) {
    return String(keyword || '').trim().toLowerCase()
  }

  function save() {
    fs.writeFileSync(absolutePath, JSON.stringify(items, null, 2))
  }

  function load() {
    try {
      const raw = fs.readFileSync(absolutePath, 'utf8')
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        items = {}
        return
      }

      const next = {}
      for (const [keyword, reply] of Object.entries(parsed)) {
        const normalized = normalizeKeyword(keyword)
        if (!normalized) {
          continue
        }

        next[normalized] = String(reply)
      }

      items = next
    } catch (error) {
      if (error.code === 'ENOENT') {
        items = {}
        save()
        return
      }

      logger.warn(`unable to load keywords file, starting empty: ${error.message}`)
      items = {}
      save()
    }
  }

  load()

  return {
    filePath: absolutePath,
    list: () =>
      Object.keys(items)
        .sort((a, b) => a.localeCompare(b))
        .map((keyword) => ({ keyword, reply: items[keyword] })),
    get: (keyword) => {
      const normalized = normalizeKeyword(keyword)
      if (!normalized) {
        return null
      }

      return items[normalized] || null
    },
    set: (keyword, reply) => {
      const normalized = normalizeKeyword(keyword)
      if (!normalized) {
        return false
      }

      items[normalized] = String(reply)
      save()
      return true
    },
    remove: (keyword) => {
      const normalized = normalizeKeyword(keyword)
      if (!normalized || !(normalized in items)) {
        return false
      }

      delete items[normalized]
      save()
      return true
    },
    count: () => Object.keys(items).length,
  }
}

module.exports = { createKeywordsStore }
