export type ClaudeModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'
  | (string & {})

export type CatStyle = 'cat' | 'cat2'

export type IpcChannel =
  | 'onboarding:apply'
  | 'onboarding:close'
  | 'onboarding:skip'
  | 'ai-shortcut:list'
  | 'ai-shortcut:save'
  | 'ai-shortcut:delete'
  | 'settings:close'
  | 'thresholds:get'
  | 'thresholds:set'
  | 'cat-style:get'
  | 'cat-style:set'
  | 'popup:get-sessions'
  | 'popup:quit'

export interface AIShortcut {
  id: string
  name: string
  command: string
}

export type SpeedLevel = 'idle' | 'slow' | 'mid' | 'fast'

export interface TokenStats {
  model: ClaudeModel | null
  inputTokens: number
  outputTokens: number
  contextWindowSize: number
  contextUsedPercent: number
}

export interface SessionSnapshot {
  pid: number
  command: string
  startedAt: number
  speedLevel: SpeedLevel
  cps: number
  tokens: TokenStats | null
}

export interface PopupState {
  sessions: SessionSnapshot[]
  openAtLogin: boolean
}

/** @deprecated Use SessionSnapshot */
export interface SessionStats {
  model: ClaudeModel | null
  inputTokens: number
  outputTokens: number
  contextWindowSize: number
  contextUsedPercent: number
  isActive: boolean
  sessionStartedAt: string | null
}

export interface SpeedThresholds {
  slow: number
  mid: number
  smoothingTicks: number
}

export const DEFAULT_SPEED_THRESHOLDS: SpeedThresholds = {
  slow: 20,
  mid: 100,
  smoothingTicks: 3,
}

export type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }
  | { type: 'session:stats'; pid: number; tokens: Partial<TokenStats> }
