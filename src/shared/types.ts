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
