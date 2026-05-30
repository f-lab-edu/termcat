export type ClaudeModel =
  | 'claude-opus-4-7'
  | 'claude-sonnet-4-6'
  | 'claude-haiku-4-5-20251001'
  | (string & {})

export type IpcChannel = never // will grow as features are added

export interface SessionStats {
  model: ClaudeModel | null
  inputTokens: number
  outputTokens: number
  contextWindowSize: number
  contextUsedPercent: number
  isActive: boolean
  sessionStartedAt: string | null
}

export type SpeedLevel = 'idle' | 'slow' | 'mid' | 'fast'

export interface SpeedThresholds {
  slow: number
  mid: number
}

export const DEFAULT_SPEED_THRESHOLDS: SpeedThresholds = {
  slow: 10,
  mid: 80,
}

export type CliEvent =
  | { type: 'session:start'; pid: number; command: string }
  | { type: 'session:data'; pid: number; chars: number; timestamp: number }
  | { type: 'session:exit'; pid: number; code: number }
