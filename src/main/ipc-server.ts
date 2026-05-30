import { unlinkSync } from 'fs'
import type { Server, Socket } from 'net'
import { createServer } from 'net'

import type { CliEvent } from '@shared/types'

function getSocketPath(): string {
  const uid = process.getuid?.() ?? 'default'
  return `/tmp/termcat-${uid}.sock`
}

function handleConnection(socket: Socket, onEvent: (event: CliEvent) => void): void {
  const sessionPids = new Set<number>()
  let buffer = ''

  socket.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line) as CliEvent
        if (event.type === 'session:start') sessionPids.add(event.pid)
        if (event.type === 'session:exit') sessionPids.delete(event.pid)
        onEvent(event)
      } catch {}
    }
  })

  socket.on('close', () => {
    for (const pid of sessionPids) {
      onEvent({ type: 'session:exit', pid, code: -1 })
    }
  })

  socket.on('error', () => socket.destroy())
}

export type IpcServer = ReturnType<typeof createIpcServer>

export function createIpcServer(onEvent: (event: CliEvent) => void) {
  const socketPath = getSocketPath()
  const server: Server = createServer((socket) => handleConnection(socket, onEvent))

  return {
    start(): void {
      try {
        unlinkSync(socketPath)
      } catch {}
      server.listen(socketPath)
    },
    stop(): void {
      server.close()
      try {
        unlinkSync(socketPath)
      } catch {}
    },
  }
}
