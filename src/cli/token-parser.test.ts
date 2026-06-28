import { describe, expect, it } from 'vitest'

import { parseTokenStats } from '@cli/token-parser'

describe('parseTokenStats', () => {
  describe('arrow format (↑ ↓)', () => {
    it('parses comma-separated numbers with · separator', () => {
      const result = parseTokenStats('↑ 12,345 · ↓ 3,201')
      expect(result).toMatchObject({ inputTokens: 12345, outputTokens: 3201 })
    })

    it('parses k-suffix shorthand', () => {
      const result = parseTokenStats('↑12.3k ↓3.2k')
      expect(result).toMatchObject({ inputTokens: 12300, outputTokens: 3200 })
    })

    it('parses zero token counts', () => {
      const result = parseTokenStats('↑ 0 · ↓ 0')
      expect(result).toMatchObject({ inputTokens: 0, outputTokens: 0 })
    })
  })

  describe('in/out format', () => {
    it('parses "N in, M out"', () => {
      const result = parseTokenStats('Tokens: 12,345 in, 3,201 out')
      expect(result).toMatchObject({ inputTokens: 12345, outputTokens: 3201 })
    })

    it('parses "N in / M out"', () => {
      const result = parseTokenStats('12345 in / 3201 out')
      expect(result).toMatchObject({ inputTokens: 12345, outputTokens: 3201 })
    })
  })

  describe('Input/Output format', () => {
    it('parses "Input: N ... Output: M"', () => {
      const result = parseTokenStats('Input: 12,345 tokens, Output: 3,201 tokens')
      expect(result).toMatchObject({ inputTokens: 12345, outputTokens: 3201 })
    })
  })

  describe('prompt/completion format', () => {
    it('parses "N prompt tokens ... M completion tokens"', () => {
      const result = parseTokenStats('12,345 prompt tokens, 3,201 completion tokens')
      expect(result).toMatchObject({ inputTokens: 12345, outputTokens: 3201 })
    })
  })

  describe('context window', () => {
    it('parses "N% of Mk" form', () => {
      const result = parseTokenStats('Context: 7.8% of 200k')
      expect(result).toMatchObject({ contextUsedPercent: 7.8, contextWindowSize: 200000 })
    })

    it('parses "(N%, Mk ctx)" form', () => {
      const result = parseTokenStats('(6.2%, 200k ctx)')
      expect(result).toMatchObject({ contextUsedPercent: 6.2, contextWindowSize: 200000 })
    })

    it('parses size-first "Mk ctx ... N%" form', () => {
      const result = parseTokenStats('200k ctx used at 7.8%')
      expect(result).toMatchObject({ contextWindowSize: 200000, contextUsedPercent: 7.8 })
    })
  })

  describe('model detection', () => {
    it.each(['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'])(
      'detects %s',
      (model) => {
        const result = parseTokenStats(`Using ${model} for this session`)
        expect(result?.model).toBe(model)
      }
    )
  })

  describe('ANSI stripping', () => {
    it('strips color escape codes before parsing', () => {
      const result = parseTokenStats('\x1b[32m↑ 100 · ↓ 50\x1b[0m')
      expect(result).toMatchObject({ inputTokens: 100, outputTokens: 50 })
    })

    it('strips cursor movement escapes before parsing', () => {
      const result = parseTokenStats('\x1b[2K\x1b[1A↑ 100 · ↓ 50')
      expect(result).toMatchObject({ inputTokens: 100, outputTokens: 50 })
    })
  })

  describe('no match', () => {
    it('returns null for empty string', () => {
      expect(parseTokenStats('')).toBeNull()
    })

    it('returns null for unrelated text', () => {
      expect(parseTokenStats('hello world, nothing useful here')).toBeNull()
    })
  })

  describe('partial matches', () => {
    it('returns only model when token counts absent', () => {
      const result = parseTokenStats('Now using claude-opus-4-7')
      expect(result).toEqual({ model: 'claude-opus-4-7' })
    })

    it('returns only context when tokens absent', () => {
      const result = parseTokenStats('Context: 50.5% of 200k')
      expect(result).toEqual({ contextUsedPercent: 50.5, contextWindowSize: 200000 })
    })
  })

  describe('format priority', () => {
    it('arrow format takes precedence over in/out when both present', () => {
      const result = parseTokenStats('↑ 100 · ↓ 50 ... also 999 in, 888 out')
      expect(result).toMatchObject({ inputTokens: 100, outputTokens: 50 })
    })
  })

  describe('realistic combined chunk', () => {
    it('extracts tokens, context, and model from a single status line', () => {
      const chunk = '\x1b[2K\x1b[1A Tokens: 4,500 in, 234 out · 5.8% of 200k · claude-sonnet-4-6'
      const result = parseTokenStats(chunk)
      expect(result).toEqual({
        inputTokens: 4500,
        outputTokens: 234,
        contextUsedPercent: 5.8,
        contextWindowSize: 200000,
        model: 'claude-sonnet-4-6',
      })
    })
  })
})
