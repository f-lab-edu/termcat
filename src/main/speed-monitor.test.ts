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

    it('returns slow at exactly the slow threshold (inclusive)', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(20, Date.now()) // cps = 20 = slow threshold
      expect(monitor.tick()).toBe('slow')
    })

    it('returns mid one above the slow threshold', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(21, Date.now()) // cps = 21 > slow=20
      expect(monitor.tick()).toBe('mid')
    })

    it('returns mid at exactly the mid threshold (inclusive)', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(100, Date.now()) // cps = 100 = mid threshold
      expect(monitor.tick()).toBe('mid')
    })

    it('returns fast one above the mid threshold', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(101, Date.now()) // cps = 101 > mid=100
      expect(monitor.tick()).toBe('fast')
    })
  })

  describe('window expiry', () => {
    it('discards events older than 1 second', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(500, Date.now() - 1500) // 1.5s ago, outside window
      expect(monitor.tick()).toBe('idle')
    })

    it('includes events exactly at the 1-second boundary', () => {
      vi.useFakeTimers()
      const t = Date.now()
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(60, t - 1000) // now - ts = 1000 <= 1000 → included
      expect(monitor.tick()).toBe('mid')
    })

    it('excludes events just outside the 1-second boundary', () => {
      vi.useFakeTimers()
      const t = Date.now()
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(60, t - 1001) // now - ts = 1001 > 1000 → excluded
      expect(monitor.tick()).toBe('idle')
    })

    it('counts only events within the 1-second window', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      monitor.feed(500, Date.now() - 1500) // expired
      monitor.feed(60, Date.now()) // active — 60 cps
      expect(monitor.tick()).toBe('mid')
    })

    it('accumulates multiple events within the window', () => {
      const monitor = createSpeedMonitor(() => THRESHOLDS)
      const now = Date.now()
      monitor.feed(10, now) // 10 cps
      monitor.feed(15, now) // +15 cps → total 25 cps > slow=20
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

    it('applies updated thresholds on each tick', () => {
      let slow = 20
      const monitor = createSpeedMonitor(() => ({ slow, mid: 100, smoothingTicks: 1 }))

      monitor.feed(15, Date.now()) // 15 cps <= slow=20 → slow
      expect(monitor.tick()).toBe('slow')

      slow = 10 // threshold lowered — 15 cps now exceeds slow=10
      expect(monitor.tick()).toBe('mid') // same buffered data, new threshold
    })
  })
})
