import log from 'electron-log/renderer'

export function createLogger(context: string) {
  return {
    info: (message: string, ...args: unknown[]) => log.info(`[${context}] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => log.warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => log.error(`[${context}] ${message}`, ...args),
  }
}
