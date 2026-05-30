import type { SpeedMonitor } from './speed-monitor'

export interface ActiveSession {
  pid: number
  command: string
  startedAt: number
  monitor: SpeedMonitor
}
