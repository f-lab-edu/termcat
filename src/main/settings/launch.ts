import { execFile } from 'child_process'

import { createLogger } from '@main/logger'

const log = createLogger('launch')

export function launchInTerminal(command: string): void {
  const escaped = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  execFile(
    'osascript',
    [
      '-e',
      `tell application "Terminal" to do script "${escaped}"`,
      '-e',
      'tell application "Terminal" to activate',
    ],
    (err) => {
      if (err) log.error('failed to open terminal', err)
    }
  )
}
