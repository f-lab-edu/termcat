import { createSpeedMonitor, type SpeedMonitor } from '@main/speed-monitor'
import type { SessionSnapshot, SpeedLevel, SpeedThresholds, TokenStats } from '@shared/types'

interface ActiveSession {
  pid: number
  command: string
  startedAt: number
  monitor: SpeedMonitor
  lastLevel: SpeedLevel
  tokens: Partial<TokenStats> | null
}

const LEVEL_RANK: Record<SpeedLevel, number> = { idle: 0, slow: 1, mid: 2, fast: 3 }

function maxLevel(levels: SpeedLevel[]): SpeedLevel {
  return levels.reduce<SpeedLevel>((max, l) => (LEVEL_RANK[l] > LEVEL_RANK[max] ? l : max), 'idle')
}

export type SessionManager = ReturnType<typeof createSessionManager>

export function createSessionManager(getThresholds?: () => SpeedThresholds) {
  const sessions = new Map<number, ActiveSession>()

  return {
    onStart(pid: number, command: string): void {
      sessions.set(pid, {
        pid,
        command,
        startedAt: Date.now(),
        monitor: createSpeedMonitor(getThresholds),
        lastLevel: 'idle',
        tokens: null,
      })
    },
    onData(pid: number, chars: number, timestamp: number): void {
      sessions.get(pid)?.monitor.feed(chars, timestamp)
    },
    onStats(pid: number, tokens: Partial<TokenStats>): void {
      const session = sessions.get(pid)
      if (!session) return
      session.tokens = { ...session.tokens, ...tokens }
    },
    onExit(pid: number): void {
      sessions.delete(pid)
    },
    tick(): SpeedLevel {
      if (sessions.size === 0) return 'idle'
      const levels = [...sessions.values()].map((s) => {
        s.lastLevel = s.monitor.tick()
        return s.lastLevel
      })
      return maxLevel(levels)
    },
    getSnapshots(): SessionSnapshot[] {
      return [...sessions.values()].map((s) => ({
        pid: s.pid,
        command: s.command,
        startedAt: s.startedAt,
        speedLevel: s.lastLevel,
        cps: s.monitor.getCps(),
        tokens: s.tokens?.inputTokens !== undefined ? (s.tokens as TokenStats) : null,
      }))
    },
  }
}
