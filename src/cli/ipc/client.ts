import type { CliEvent } from '@shared/types'
import type { Socket } from 'net'
import { createConnection } from 'net'

import { getSocketPath } from './socket-path'

export type IpcClient = ReturnType<typeof createIpcClient>

export function createIpcClient() {
  let socket: Socket | null = null
  let connected = false

  return {
    connect(): void {
      const sock = createConnection(getSocketPath())
      socket = sock

      sock.on('connect', () => {
        connected = true
      })

      sock.on('error', () => {
        connected = false
        socket = null
      })

      sock.on('close', () => {
        connected = false
        socket = null
      })
    },
    send(event: CliEvent): void {
      if (!connected || !socket) return
      try {
        socket.write(JSON.stringify(event) + '\n')
      } catch {}
    },
    disconnect(): void {
      socket?.destroy()
      socket = null
      connected = false
    },
  }
}
