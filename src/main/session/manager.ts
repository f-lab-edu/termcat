import type { SpeedLevel } from '@shared/types'

import { createSpeedMonitor } from './speed-monitor'
import type { ActiveSession } from './types'

const LEVEL_RANK: Record<SpeedLevel, number> = { idle: 0, slow: 1, mid: 2, fast: 3 }

function maxLevel(levels: SpeedLevel[]): SpeedLevel {
  return levels.reduce<SpeedLevel>((max, l) => (LEVEL_RANK[l] > LEVEL_RANK[max] ? l : max), 'idle')
}

export type SessionManager = ReturnType<typeof createSessionManager>

export function createSessionManager() {
  const sessions = new Map<number, ActiveSession>()

  return {
    onStart(pid: number, command: string): void {
      sessions.set(pid, { pid, command, startedAt: Date.now(), monitor: createSpeedMonitor() })
    },
    onData(pid: number, chars: number, timestamp: number): void {
      sessions.get(pid)?.monitor.feed(chars, timestamp)
    },
    onExit(pid: number): void {
      sessions.delete(pid)
    },
    tick(): SpeedLevel {
      if (sessions.size === 0) return 'idle'
      const levels = [...sessions.values()].map((s) => s.monitor.tick())
      return maxLevel(levels)
    },
  }
}
