import { DEFAULT_SPEED_THRESHOLDS, type SpeedLevel, type SpeedThresholds } from '@shared/types'

const WINDOW_MS = 1000

export type SpeedMonitor = ReturnType<typeof createSpeedMonitor>

export function createSpeedMonitor(
  getThresholds: () => SpeedThresholds = () => DEFAULT_SPEED_THRESHOLDS
) {
  let buffer: Array<{ ts: number; chars: number }> = []
  let lastLevel: SpeedLevel = 'slow'
  let pendingLevel: SpeedLevel | null = null
  let pendingCount = 0

  function classify(cps: number): SpeedLevel {
    const { slow, mid } = getThresholds()

    if (cps <= 0) return 'idle'
    if (cps <= slow) return 'slow'
    if (cps <= mid) return 'mid'

    return 'fast'
  }

  function smooth(level: SpeedLevel): SpeedLevel {
    const { smoothingTicks } = getThresholds()

    if (level === lastLevel) {
      pendingLevel = null
      pendingCount = 0
      return lastLevel
    }
    if (level === pendingLevel) {
      pendingCount++
    } else {
      pendingLevel = level
      pendingCount = 1
    }
    if (pendingCount >= smoothingTicks) {
      lastLevel = level
      pendingLevel = null
      pendingCount = 0
    }

    return lastLevel
  }

  return {
    feed(chars: number, timestamp: number): void {
      buffer.push({ ts: timestamp, chars })
    },
    tick(): SpeedLevel {
      const now = Date.now()
      buffer = buffer.filter((e) => now - e.ts <= WINDOW_MS)
      const total = buffer.reduce((sum, e) => sum + e.chars, 0)
      const cps = total / (WINDOW_MS / 1000)
      return smooth(classify(cps))
    },
  }
}
