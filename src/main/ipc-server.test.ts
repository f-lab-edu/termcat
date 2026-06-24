import { describe, expect, it } from 'vitest'

import { parseCliEvent } from '@main/ipc-server'

describe('parseCliEvent', () => {
  describe('session:start', () => {
    it('parses a valid session:start event', () => {
      const result = parseCliEvent({ type: 'session:start', pid: 123, command: 'claude' })
      expect(result).toEqual({ type: 'session:start', pid: 123, command: 'claude' })
    })

    it('throws when pid is missing', () => {
      expect(() => parseCliEvent({ type: 'session:start', command: 'claude' })).toThrow()
    })

    it('throws when command is missing', () => {
      expect(() => parseCliEvent({ type: 'session:start', pid: 123 })).toThrow()
    })
  })

  describe('session:data', () => {
    it('parses a valid session:data event', () => {
      const result = parseCliEvent({ type: 'session:data', pid: 123, chars: 50, timestamp: 1000 })
      expect(result).toEqual({ type: 'session:data', pid: 123, chars: 50, timestamp: 1000 })
    })

    it('throws when chars is missing', () => {
      expect(() => parseCliEvent({ type: 'session:data', pid: 123, timestamp: 1000 })).toThrow()
    })
  })

  describe('session:exit', () => {
    it('parses a valid session:exit event', () => {
      const result = parseCliEvent({ type: 'session:exit', pid: 123, code: 0 })
      expect(result).toEqual({ type: 'session:exit', pid: 123, code: 0 })
    })

    it('parses non-zero exit codes', () => {
      const result = parseCliEvent({ type: 'session:exit', pid: 123, code: 1 })
      expect(result).toEqual({ type: 'session:exit', pid: 123, code: 1 })
    })
  })

  describe('invalid input', () => {
    it('throws for unknown event type', () => {
      expect(() => parseCliEvent({ type: 'unknown', pid: 1 })).toThrow('unknown event type')
    })

    it('throws for null input', () => {
      expect(() => parseCliEvent(null)).toThrow('invalid event')
    })

    it('throws for non-object input', () => {
      expect(() => parseCliEvent('string')).toThrow('invalid event')
    })

    it('throws for missing type field', () => {
      expect(() => parseCliEvent({ pid: 123 })).toThrow()
    })
  })
})
