import pty from 'node-pty'

import type { IpcClient } from '@cli/ipc-client'
import { createTokenStatsExtractor } from '@cli/token-parser'

const IPC_TICK_MS = 100

export function runPtyWrapper(command: string, args: string[], ipc: IpcClient): void {
  const shell = pty.spawn(command, args, {
    name: 'xterm-256color',
    cols: process.stdout.columns ?? 80,
    rows: process.stdout.rows ?? 24,
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  })

  ipc.send({ type: 'session:start', pid: shell.pid, command })

  let charsBatch = 0
  const tokenExtractor = createTokenStatsExtractor()

  shell.onData((data) => {
    process.stdout.write(data)
    charsBatch += data.length

    const tokens = tokenExtractor.feed(data)
    if (tokens !== null) {
      ipc.send({ type: 'session:stats', pid: shell.pid, tokens })
    }
  })

  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on('data', (data) => shell.write(data.toString()))

  process.stdout.on('resize', () => {
    shell.resize(process.stdout.columns ?? 80, process.stdout.rows ?? 24)
  })

  const ticker = setInterval(() => {
    if (charsBatch > 0) {
      ipc.send({ type: 'session:data', pid: shell.pid, chars: charsBatch, timestamp: Date.now() })
      charsBatch = 0
    }
  }, IPC_TICK_MS)

  shell.onExit(({ exitCode }) => {
    clearInterval(ticker)
    ipc.sendAndExit({ type: 'session:exit', pid: shell.pid, code: exitCode }, exitCode)
  })
}
