import { unlinkSync } from 'fs'
import type { Server, Socket } from 'net'
import { createServer } from 'net'

import type { CliEvent } from '@shared/types'

function getSocketPath(): string {
  const uid = process.getuid?.() ?? 'default'
  return `/tmp/termcat-${uid}.sock`
}

function parseCliEvent(raw: unknown): CliEvent {
  if (typeof raw !== 'object' || raw === null) throw new Error('invalid event')
  const obj = raw as Record<string, unknown>

  if (
    obj.type === 'session:start' &&
    typeof obj.pid === 'number' &&
    typeof obj.command === 'string'
  ) {
    return { type: 'session:start', pid: obj.pid, command: obj.command }
  }
  if (
    obj.type === 'session:data' &&
    typeof obj.pid === 'number' &&
    typeof obj.chars === 'number' &&
    typeof obj.timestamp === 'number'
  ) {
    return { type: 'session:data', pid: obj.pid, chars: obj.chars, timestamp: obj.timestamp }
  }
  if (obj.type === 'session:exit' && typeof obj.pid === 'number' && typeof obj.code === 'number') {
    return { type: 'session:exit', pid: obj.pid, code: obj.code }
  }
  throw new Error(`unknown event type: ${String(obj.type)}`)
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
        const event = parseCliEvent(JSON.parse(line))
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
