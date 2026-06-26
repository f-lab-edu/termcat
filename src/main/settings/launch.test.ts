import { beforeEach, describe, expect, it, vi } from 'vitest'

const { execFileMock } = vi.hoisted(() => ({
  execFileMock: vi.fn(),
}))

vi.mock('child_process', () => ({
  execFile: execFileMock,
}))

vi.mock('@main/logger', () => ({
  createLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn() }),
}))

import { launchInTerminal } from '@main/settings/launch'

function getOsascriptArgs(): string[] {
  return execFileMock.mock.calls[0][1] as string[]
}

function getDoScript(): string {
  return getOsascriptArgs()[1]
}

describe('launchInTerminal', () => {
  beforeEach(() => {
    execFileMock.mockClear()
  })

  describe('execFile invocation', () => {
    it('invokes osascript with two -e clauses', () => {
      launchInTerminal('claude')
      expect(execFileMock).toHaveBeenCalledOnce()
      const [bin, args] = execFileMock.mock.calls[0]
      expect(bin).toBe('osascript')
      expect(args).toHaveLength(4)
      expect((args as string[])[0]).toBe('-e')
      expect((args as string[])[2]).toBe('-e')
    })

    it('emits "do script" before "activate" (window opens, then comes forward)', () => {
      launchInTerminal('claude')
      const args = getOsascriptArgs()
      expect(args[1]).toMatch(/^tell application "Terminal" to do script/)
      expect(args[3]).toBe('tell application "Terminal" to activate')
    })

    it('passes an error callback to execFile', () => {
      launchInTerminal('claude')
      expect(typeof execFileMock.mock.calls[0][2]).toBe('function')
    })
  })

  describe('command embedding', () => {
    it('embeds a plain command without modification', () => {
      launchInTerminal('claude')
      expect(getDoScript()).toBe('tell application "Terminal" to do script "claude"')
    })

    it('embeds commands with spaces and flags verbatim', () => {
      launchInTerminal('claude --print "hi"')
      // double quotes get escaped, everything else stays
      expect(getDoScript()).toBe(
        String.raw`tell application "Terminal" to do script "claude --print \"hi\""`
      )
    })
  })

  describe('escaping', () => {
    it('escapes a double quote with a backslash', () => {
      launchInTerminal('echo "hi"')
      expect(getDoScript()).toBe(String.raw`tell application "Terminal" to do script "echo \"hi\""`)
    })

    it('doubles a single backslash', () => {
      launchInTerminal(String.raw`echo \n`)
      expect(getDoScript()).toBe(String.raw`tell application "Terminal" to do script "echo \\n"`)
    })

    it('escapes backslashes BEFORE quotes (order is load-bearing)', () => {
      // Input (4 chars): a \ " b
      //   Step 1 (\ → \\):  a \\ " b   (5 chars)
      //   Step 2 (" → \"):  a \\\" b   (6 chars)
      // If the order were reversed we'd get 4 backslashes, not 3.
      launchInTerminal(String.raw`a\"b`)
      expect(getDoScript()).toBe(String.raw`tell application "Terminal" to do script "a\\\"b"`)
    })

    it('prevents AppleScript string break-out (every embedded " is escaped)', () => {
      // Adversarial input tries to close the AppleScript string and inject
      const injection = '"; do shell script "rm -rf /'
      launchInTerminal(injection)
      const script = getDoScript()
      const prefix = 'tell application "Terminal" to do script "'
      expect(script.startsWith(prefix)).toBe(true)
      expect(script.endsWith('"')).toBe(true)
      const embedded = script.slice(prefix.length, -1)
      // Every " in the embedded payload must be preceded by a backslash
      for (let i = 0; i < embedded.length; i++) {
        if (embedded[i] === '"') {
          expect(embedded[i - 1]).toBe('\\')
        }
      }
    })
  })
})
