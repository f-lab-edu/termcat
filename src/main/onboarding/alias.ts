import { appendFileSync, existsSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

const ALIAS_MARKER = '# termcat'
const ALIAS_BLOCK = `
# termcat — AI session monitor
alias claude="termcat claude"
alias chatgpt="termcat chatgpt"
alias gemini="termcat gemini"
`

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

export function appendAlias(): string {
  const rcPath = getRcPath()
  appendFileSync(rcPath, ALIAS_BLOCK, 'utf-8')
  return rcPath
}
