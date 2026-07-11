import { execFile } from 'child_process'

import { getTermcatCommandPrefix } from '@main/cli-path'
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

/**
 * AI 명령을 termcat CLI 로 감싸 새 터미널에서 실행한다.
 * 셸 alias 설치 여부와 무관하게 앱에서 띄운 세션은 항상 데몬에 연결된다.
 */
export function launchAi(aiCommand: string): void {
  launchInTerminal(`${getTermcatCommandPrefix()} ${aiCommand}`)
}
