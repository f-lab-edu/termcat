import { homedir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { fsMock, isMock } = vi.hoisted(() => ({
  fsMock: {
    appendFileSync: vi.fn(),
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  isMock: { dev: true },
}))

vi.mock('fs', () => fsMock)
vi.mock('@electron-toolkit/utils', () => ({ is: isMock }))
vi.mock('electron', () => ({
  app: { getAppPath: () => '/app' },
}))
vi.mock('@main/logger', () => ({
  createLogger: () => ({ warn: vi.fn(), error: vi.fn(), info: vi.fn() }),
}))

import { appendAlias, getRcPath, hasAlias } from '@main/onboarding/alias'

const HOME = homedir()
const ZSHRC = join(HOME, '.zshrc')
const BASHRC = join(HOME, '.bashrc')
const PROFILE = join(HOME, '.profile')

describe('getRcPath', () => {
  const originalShell = process.env.SHELL

  afterEach(() => {
    if (originalShell === undefined) delete process.env.SHELL
    else process.env.SHELL = originalShell
  })

  it('returns .zshrc when SHELL contains "zsh"', () => {
    process.env.SHELL = '/bin/zsh'
    expect(getRcPath()).toBe(ZSHRC)
  })

  it('returns .bashrc when SHELL contains "bash"', () => {
    process.env.SHELL = '/bin/bash'
    expect(getRcPath()).toBe(BASHRC)
  })

  it('falls back to .profile when SHELL is unset', () => {
    delete process.env.SHELL
    expect(getRcPath()).toBe(PROFILE)
  })

  it('falls back to .profile for unrecognized shells', () => {
    process.env.SHELL = '/usr/local/bin/fish'
    expect(getRcPath()).toBe(PROFILE)
  })

  it('matches shell name as substring (Homebrew zsh path still detected)', () => {
    process.env.SHELL = '/opt/homebrew/bin/zsh'
    expect(getRcPath()).toBe(ZSHRC)
  })
})

describe('hasAlias', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SHELL = '/bin/zsh'
  })

  it('returns false when rc file does not exist', () => {
    fsMock.existsSync.mockReturnValue(false)
    expect(hasAlias()).toBe(false)
    expect(fsMock.readFileSync).not.toHaveBeenCalled()
  })

  it('returns true when rc file contains the "# termcat" marker', () => {
    fsMock.existsSync.mockReturnValue(true)
    fsMock.readFileSync.mockReturnValue('# some line\n# termcat\nalias claude=...\n')
    expect(hasAlias()).toBe(true)
  })

  it('returns false when rc file lacks the marker', () => {
    fsMock.existsSync.mockReturnValue(true)
    fsMock.readFileSync.mockReturnValue('export PATH=...\nalias ll="ls -la"\n')
    expect(hasAlias()).toBe(false)
  })

  it('reads the rc file as utf-8', () => {
    fsMock.existsSync.mockReturnValue(true)
    fsMock.readFileSync.mockReturnValue('')
    hasAlias()
    expect(fsMock.readFileSync).toHaveBeenCalledWith(ZSHRC, 'utf-8')
  })
})

describe('appendAlias', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SHELL = '/bin/zsh'
    isMock.dev = true
  })

  it('appends to the rc file and returns its path when alias is missing', () => {
    fsMock.existsSync.mockReturnValue(true)
    fsMock.readFileSync.mockReturnValue('# nothing here')
    const result = appendAlias()
    expect(result).toBe(ZSHRC)
    expect(fsMock.appendFileSync).toHaveBeenCalledOnce()
    expect(fsMock.appendFileSync).toHaveBeenCalledWith(ZSHRC, expect.any(String), 'utf-8')
  })

  it('is idempotent — does not append when alias is already present', () => {
    fsMock.existsSync.mockReturnValue(true)
    fsMock.readFileSync.mockReturnValue('# termcat installed already')
    const result = appendAlias()
    expect(result).toBe(ZSHRC)
    expect(fsMock.appendFileSync).not.toHaveBeenCalled()
  })

  it('returns the correct rc path for the active shell (bash)', () => {
    process.env.SHELL = '/bin/bash'
    fsMock.existsSync.mockReturnValue(false)
    expect(appendAlias()).toBe(BASHRC)
  })

  describe('appended content', () => {
    let appended: string

    beforeEach(() => {
      fsMock.existsSync.mockReturnValue(false)
      appendAlias()
      appended = fsMock.appendFileSync.mock.calls[0][1] as string
    })

    it('starts with the "# termcat" marker so future runs detect it', () => {
      expect(appended).toContain('# termcat')
    })

    it('adds $HOME/.local/bin to PATH (where the CLI shim lives)', () => {
      expect(appended).toContain('export PATH="$HOME/.local/bin:$PATH"')
    })

    it.each(['claude', 'chatgpt', 'gemini'])('defines alias for %s', (cmd) => {
      expect(appended).toContain(`alias ${cmd}="termcat ${cmd}"`)
    })
  })

  it('skips CLI install in dev mode (no fs writes for symlink)', () => {
    isMock.dev = true
    fsMock.existsSync.mockReturnValue(false)
    appendAlias()
    expect(fsMock.writeFileSync).not.toHaveBeenCalled()
    expect(fsMock.mkdirSync).not.toHaveBeenCalled()
  })
})
