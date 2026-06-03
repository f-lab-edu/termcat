import log from 'electron-log'

export function createLogger(context: string) {
  return {
    warn: (message: string, ...args: unknown[]) => log.warn(`[${context}] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => log.error(`[${context}] ${message}`, ...args),
    info: (message: string, ...args: unknown[]) => log.info(`[${context}] ${message}`, ...args),
  }
}
