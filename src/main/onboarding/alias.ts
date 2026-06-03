import { is } from '@electron-toolkit/utils'
import { app } from 'electron'
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  unlinkSync,
} from 'fs'
import { homedir } from 'os'
import { join } from 'path'

import { createLogger } from '@main/logger'

const log = createLogger('alias')

const ALIAS_MARKER = '# termcat'
const ALIAS_BLOCK = `
# termcat — AI session monitor
export PATH="$HOME/.local/bin:$PATH"
alias claude="termcat claude"
alias chatgpt="termcat chatgpt"
alias gemini="termcat gemini"
`

const LOCAL_BIN_DIR = join(homedir(), '.local', 'bin')
const SYMLINK_PATH = join(LOCAL_BIN_DIR, 'termcat')

export function getRcPath(): string {
  const shell = process.env.SHELL ?? ''
  if (shell.includes('zsh')) return join(homedir(), '.zshrc')
  if (shell.includes('bash')) return join(homedir(), '.bashrc')
  return join(homedir(), '.profile')
}

export function hasAlias(): boolean {
  const rcPath = getRcPath()
  if (!existsSync(rcPath)) return false
  return readFileSync(rcPath, 'utf-8').includes(ALIAS_MARKER)
}

function installCli(): void {
  if (is.dev) return

  const cliPath = join(app.getAppPath(), 'out', 'main', 'cli', 'index.js')

  if (!existsSync(LOCAL_BIN_DIR)) {
    mkdirSync(LOCAL_BIN_DIR, { recursive: true })
  }

  try {
    if (existsSync(SYMLINK_PATH)) unlinkSync(SYMLINK_PATH)
    symlinkSync(cliPath, SYMLINK_PATH)
    chmodSync(cliPath, '755')
  } catch (err) {
    log.warn('failed to install CLI symlink:', err)
  }
}

export function appendAlias(): string {
  const rcPath = getRcPath()
  appendFileSync(rcPath, ALIAS_BLOCK, 'utf-8')
  installCli()
  return rcPath
}
