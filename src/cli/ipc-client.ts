import type { Socket } from 'net'
import { createConnection } from 'net'

import type { CliEvent } from '@shared/types'

function getSocketPath(): string {
  const uid = process.getuid?.() ?? 'default'
  return `/tmp/termcat-${uid}.sock`
}

export type IpcClient = ReturnType<typeof createIpcClient>

export function createIpcClient() {
  let socket: Socket | null = null
  let connected = false

  return {
    connect(): Promise<void> {
      return new Promise((resolve, reject) => {
        const sock = createConnection(getSocketPath())
        socket = sock
        let settled = false

        sock.on('connect', () => {
          connected = true
          if (!settled) {
            settled = true
            resolve()
          }
        })

        sock.on('error', (err) => {
          connected = false
          socket = null
          if (!settled) {
            settled = true
            reject(err)
          }
        })

        sock.on('close', () => {
          connected = false
          socket = null
        })
      })
    },
    send(event: CliEvent): void {
      if (!connected || !socket) return
      try {
        socket.write(JSON.stringify(event) + '\n')
      } catch (err) {
        process.stderr.write(`[ipc-client] failed to send event: ${err}\n`)
      }
    },
    sendAndExit(event: CliEvent, exitCode: number): void {
      if (!connected || !socket) {
        process.exit(exitCode)
        return
      }
      try {
        socket.write(JSON.stringify(event) + '\n', () => {
          socket?.end()
          process.exit(exitCode)
        })
      } catch (err) {
        process.stderr.write(`[ipc-client] failed to send event: ${err}\n`)
        process.exit(exitCode)
      }
    },
    disconnect(): void {
      socket?.destroy()
      socket = null
      connected = false
    },
  }
}
