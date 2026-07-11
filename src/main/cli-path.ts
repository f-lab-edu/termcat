import { app } from 'electron'
import { join } from 'path'

/**
 * termcat CLI 진입점 경로.
 * 패키징(app.asar → app.asar.unpacked) / dev(out) 양쪽에서 유효하며,
 * onboarding 의 CLI shim 설치와 동일한 규칙을 단일 소스로 관리한다.
 */
export function getCliEntryPath(): string {
  return join(
    app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
    'out',
    'main',
    'cli',
    'index.js'
  )
}

/**
 * AI 명령을 termcat CLI 로 감싸는 셸 커맨드 프리픽스.
 * ELECTRON_RUN_AS_NODE 로 Electron 바이너리를 Node 모드로 실행해 node-pty ABI 를 맞춘다.
 * 셸 alias / PATH 설치 여부와 무관하게 동작한다.
 */
export function getTermcatCommandPrefix(): string {
  return `env ELECTRON_RUN_AS_NODE=1 "${process.execPath}" "${getCliEntryPath()}"`
}
