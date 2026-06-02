export function logInfo(message, meta = {}) {
  console.info(`[frontend] ${message}`, meta)
}

export function logWarn(message, meta = {}) {
  console.warn(`[frontend] ${message}`, meta)
}

export function logError(message, meta = {}) {
  console.error(`[frontend] ${message}`, meta)
}
