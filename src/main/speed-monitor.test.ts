import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSpeedMonitor } from '@main/speed-monitor'
import type { SpeedThresholds } from '@shared/types'

const THRESHOLDS: SpeedThresholds = { slow: 20, mid: 100, smoothingTicks: 1 }

describe('createSpeedMonitor', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('classify', () => {
    it('returns idle when no data fed', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      expect(monitor.tick()).toBe('idle')
    })

    it('returns slow for throughput at or below slow threshold', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(20, Date.now()) // 20 cps = slow threshold
      expect(monitor.tick()).toBe('slow')
    })

    it('returns mid for throughput between slow and mid threshold', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(60, Date.now()) // 60 cps, slow=20 < 60 <= mid=100
      expect(monitor.tick()).toBe('mid')
    })

    it('returns fast for throughput above mid threshold', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(200, Date.now()) // 200 cps > mid=100
      expect(monitor.tick()).toBe('fast')
    })
  })

  describe('window expiry', () => {
    it('discards events older than 1 second', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(500, Date.now() - 1500) // 1.5s ago, outside window
      expect(monitor.tick()).toBe('idle')
    })

    it('counts only events within the 1-second window', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(500, Date.now() - 1500) // expired
      monitor.feed(60, Date.now()) // active — 60 cps
      expect(monitor.tick()).toBe('mid')
    })
  })

  describe('smoothing', () => {
    it('delays level change until smoothingTicks consecutive ticks at new level', () => {
      vi.useFakeTimers()
      const t = Date.now()

      const monitor = createSpeedMonitor(() => ({ slow: 20, mid: 100, smoothingTicks: 3 }))

      monitor.feed(10, t)
      expect(monitor.tick()).toBe('slow') // baseline: slow

      // Fast data — each tick at a new second so old data expires
      vi.setSystemTime(t + 1100)
      monitor.feed(200, t + 1100)
      expect(monitor.tick()).toBe('slow') // pendingCount=1, no transition yet

      vi.setSystemTime(t + 2200)
      monitor.feed(200, t + 2200)
      expect(monitor.tick()).toBe('slow') // pendingCount=2

      vi.setSystemTime(t + 3300)
      monitor.feed(200, t + 3300)
      expect(monitor.tick()).toBe('fast') // pendingCount=3 → transitions
    })

    it('resets pending count when level fluctuates back', () => {
      vi.useFakeTimers()
      const t = Date.now()

      const monitor = createSpeedMonitor(() => ({ slow: 20, mid: 100, smoothingTicks: 3 }))

      monitor.feed(10, t)
      expect(monitor.tick()).toBe('slow') // baseline

      vi.setSystemTime(t + 1100)
      monitor.feed(200, t + 1100)
      expect(monitor.tick()).toBe('slow') // pendingCount=1

      // Drop back to slow — resets pending
      vi.setSystemTime(t + 2200)
      monitor.feed(10, t + 2200)
      expect(monitor.tick()).toBe('slow') // pendingCount reset

      // Fast again — needs 3 more consecutive ticks
      vi.setSystemTime(t + 3300)
      monitor.feed(200, t + 3300)
      expect(monitor.tick()).toBe('slow') // pendingCount=1 again, not 3
    })

    it('uses default thresholds when none provided', () => {
      const monitor = createSpeedMonitor()
      monitor.feed(200, Date.now())
      // Default smoothingTicks=3, so won't transition on first tick
      expect(monitor.tick()).not.toBe('idle')
    })
  })
})
