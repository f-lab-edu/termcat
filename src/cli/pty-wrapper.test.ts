import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { IpcClient } from '@cli/ipc-client'
import type { CliEvent } from '@shared/types'

const { ptySpawnMock, feedMock, createTokenStatsExtractorMock } = vi.hoisted(() => {
  const feedMock = vi.fn()
  return {
    ptySpawnMock: vi.fn(),
    feedMock,
    createTokenStatsExtractorMock: vi.fn(() => ({ feed: feedMock })),
  }
})

vi.mock('node-pty', () => ({
  default: { spawn: ptySpawnMock },
}))
vi.mock('@cli/token-parser', () => ({
  createTokenStatsExtractor: createTokenStatsExtractorMock,
}))

import { runPtyWrapper } from '@cli/pty-wrapper'

type DataHandler = (data: string) => void
type ExitHandler = (evt: { exitCode: number }) => void

function makeShell() {
  const dataHandlers: DataHandler[] = []
  const exitHandlers: ExitHandler[] = []
  return {
    pid: 12345,
    write: vi.fn(),
    resize: vi.fn(),
    onData: vi.fn((cb: DataHandler) => {
      dataHandlers.push(cb)
    }),
    onExit: vi.fn((cb: ExitHandler) => {
      exitHandlers.push(cb)
    }),
    emitData(data: string) {
      dataHandlers.forEach((h) => h(data))
    },
    emitExit(exitCode: number) {
      exitHandlers.forEach((h) => h({ exitCode }))
    },
  }
}

function makeIpc(): {
  ipc: IpcClient
  send: ReturnType<typeof vi.fn>
  sendAndExit: ReturnType<typeof vi.fn>
} {
  const send = vi.fn()
  const sendAndExit = vi.fn()
  return { ipc: { send, sendAndExit } as unknown as IpcClient, send, sendAndExit }
}

function findEvent(send: ReturnType<typeof vi.fn>, type: CliEvent['type']): CliEvent | undefined {
  const call = send.mock.calls.find((c) => (c[0] as CliEvent).type === type)
  return call?.[0] as CliEvent | undefined
}

describe('runPtyWrapper', () => {
  let shell: ReturnType<typeof makeShell>
  let stdoutWrite: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    shell = makeShell()
    ptySpawnMock.mockReturnValue(shell)
    feedMock.mockReturnValue(null)

    // process.stdin.setRawMode is TTY-only — inject so non-TTY test env doesn't crash
    Object.defineProperty(process.stdin, 'setRawMode', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    })

    stdoutWrite = vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stdin, 'resume').mockImplementation(() => process.stdin)
    vi.spyOn(process.stdin, 'on').mockImplementation(() => process.stdin)
    vi.spyOn(process.stdout, 'on').mockImplementation(() => process.stdout)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('startup', () => {
    it('spawns the requested command with args', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', ['--print', 'hi'], ipc)
      expect(ptySpawnMock).toHaveBeenCalledOnce()
      const [cmd, args] = ptySpawnMock.mock.calls[0]
      expect(cmd).toBe('claude')
      expect(args).toEqual(['--print', 'hi'])
    })

    it('emits session:start with shell pid and command', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      const event = findEvent(send, 'session:start')
      expect(event).toEqual({ type: 'session:start', pid: shell.pid, command: 'claude' })
    })

    it('enables raw mode on stdin (key-by-key forwarding to shell)', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      const setRawMode = (process.stdin as unknown as { setRawMode: ReturnType<typeof vi.fn> })
        .setRawMode
      expect(setRawMode).toHaveBeenCalledWith(true)
    })
  })

  describe('shell output passthrough', () => {
    it('writes shell data verbatim to process.stdout', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('hello world')
      expect(stdoutWrite).toHaveBeenCalledWith('hello world')
    })

    it('preserves chunk ordering', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('first')
      shell.emitData('second')
      expect(stdoutWrite).toHaveBeenNthCalledWith(1, 'first')
      expect(stdoutWrite).toHaveBeenNthCalledWith(2, 'second')
    })
  })

  describe('chars batching ticker (100ms)', () => {
    it('does not emit session:data when no chars accumulated', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      send.mockClear()
      vi.advanceTimersByTime(100)
      expect(findEvent(send, 'session:data')).toBeUndefined()
    })

    it('emits accumulated char count at the next tick', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('hello') // 5
      shell.emitData(' world') // +6 = 11
      send.mockClear()
      vi.advanceTimersByTime(100)
      expect(findEvent(send, 'session:data')).toMatchObject({
        type: 'session:data',
        pid: shell.pid,
        chars: 11,
      })
    })

    it('does not emit before the tick interval elapses', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('abc')
      send.mockClear()
      vi.advanceTimersByTime(99)
      expect(findEvent(send, 'session:data')).toBeUndefined()
      vi.advanceTimersByTime(1)
      expect(findEvent(send, 'session:data')).toBeDefined()
    })

    it('resets the char counter between ticks', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('abc')
      vi.advanceTimersByTime(100)
      send.mockClear()
      shell.emitData('de')
      vi.advanceTimersByTime(100)
      expect(findEvent(send, 'session:data')).toMatchObject({ chars: 2 })
    })

    it('includes a timestamp captured at emission time', () => {
      const { ipc, send } = makeIpc()
      vi.setSystemTime(new Date('2026-06-26T12:00:00Z'))
      runPtyWrapper('claude', [], ipc)
      shell.emitData('x')
      send.mockClear()
      vi.advanceTimersByTime(100)
      const event = findEvent(send, 'session:data') as { timestamp: number }
      expect(event.timestamp).toBe(new Date('2026-06-26T12:00:00.100Z').getTime())
    })
  })

  describe('token stats forwarding', () => {
    it('emits session:stats when the extractor returns a value', () => {
      const tokens = { inputTokens: 100, outputTokens: 50 }
      feedMock.mockReturnValue(tokens)
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('any')
      expect(findEvent(send, 'session:stats')).toMatchObject({
        type: 'session:stats',
        pid: shell.pid,
        tokens,
      })
    })

    it('does not emit session:stats when the extractor returns null', () => {
      feedMock.mockReturnValue(null)
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('any')
      expect(findEvent(send, 'session:stats')).toBeUndefined()
    })

    it('passes the raw chunk to extractor.feed (not the batched count)', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('first chunk')
      shell.emitData('second chunk')
      expect(feedMock).toHaveBeenNthCalledWith(1, 'first chunk')
      expect(feedMock).toHaveBeenNthCalledWith(2, 'second chunk')
    })

    it('creates one extractor per pty session', () => {
      const { ipc } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      expect(createTokenStatsExtractorMock).toHaveBeenCalledOnce()
    })
  })

  describe('exit handling', () => {
    it('emits session:exit with exit code 0 via sendAndExit', () => {
      const { ipc, sendAndExit } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitExit(0)
      expect(sendAndExit).toHaveBeenCalledWith({ type: 'session:exit', pid: shell.pid, code: 0 }, 0)
    })

    it('forwards non-zero exit codes', () => {
      const { ipc, sendAndExit } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitExit(137)
      expect(sendAndExit).toHaveBeenCalledWith(
        { type: 'session:exit', pid: shell.pid, code: 137 },
        137
      )
    })

    it('clears the ticker on exit (no further session:data)', () => {
      const { ipc, send } = makeIpc()
      runPtyWrapper('claude', [], ipc)
      shell.emitData('some data')
      shell.emitExit(0)
      send.mockClear()
      vi.advanceTimersByTime(500) // multiple ticker periods
      expect(findEvent(send, 'session:data')).toBeUndefined()
    })
  })
})
