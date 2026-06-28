import type { ClaudeModel, TokenStats } from '@shared/types'

// Matches ANSI escape sequences (CSI, OSC, simple escapes)
const ANSI_RE = /\x1b(?:\[[0-9;?]*[A-Za-z]|\][^\x07]*\x07|[()][A-Z0-9]|.)/g

function stripAnsi(text: string): string {
  return text.replace(ANSI_RE, '')
}

function parseCount(raw: string): number | null {
  const s = raw.replace(/,/g, '').trim()
  const kMatch = s.match(/^(\d+(?:\.\d+)?)k$/i)
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000)
  const n = parseInt(s, 10)
  return isNaN(n) ? null : n
}

// ↑ 12,345 · ↓ 3,201  or  ↑12.3k ↓3.2k
const ARROW_RE = /↑\s*([\d,.]+k?)\s*[·,•]?\s*↓\s*([\d,.]+k?)/i

// Tokens: 12,345 in, 3,201 out  or  12345 in / 3201 out
const IN_OUT_RE = /([\d,.]+k?)\s+in[,/\s]+\s*([\d,.]+k?)\s+out/i

// Input: 12,345 ... Output: 3,201
const INPUT_OUTPUT_RE = /input[:\s]+([\d,.]+k?).*?output[:\s]+([\d,.]+k?)/is

// N prompt tokens ... M completion tokens
const PROMPT_COMPLETION_RE = /([\d,.]+k?)\s+prompt.*?([\d,.]+k?)\s+completion/is

// context: 7.8% of 200k  or  (6.2%, 200k ctx)
const CONTEXT_PCT_RE = /([\d.]+)%(?:\s+of\s+|\s*[/,]\s*)([\d.]+k?)/i
const CONTEXT_SIZE_RE = /([\d.]+k?)\s+ctx.*?([\d.]+)%/i

// claude-opus-4-7, claude-sonnet-4-6, etc.
const MODEL_RE = /claude-(?:opus|sonnet|haiku)-[\w.-]+/i

const TOKEN_BUFFER_MAX = 8192

export interface TokenStatsExtractor {
  feed(chunk: string): Partial<TokenStats> | null
}

export function createTokenStatsExtractor(): TokenStatsExtractor {
  let buffer = ''
  return {
    feed(chunk: string): Partial<TokenStats> | null {
      buffer = (buffer + chunk).slice(-TOKEN_BUFFER_MAX)
      const result = parseTokenStats(buffer)
      if (result !== null) buffer = ''
      return result
    },
  }
}

export function parseTokenStats(chunk: string): Partial<TokenStats> | null {
  const text = stripAnsi(chunk)
  const result: Partial<TokenStats> = {}

  let inTokens: number | null = null
  let outTokens: number | null = null

  const arrowMatch = text.match(ARROW_RE)
  if (arrowMatch) {
    inTokens = parseCount(arrowMatch[1])
    outTokens = parseCount(arrowMatch[2])
  }

  if (inTokens === null) {
    const inOutMatch = text.match(IN_OUT_RE)
    if (inOutMatch) {
      inTokens = parseCount(inOutMatch[1])
      outTokens = parseCount(inOutMatch[2])
    }
  }

  if (inTokens === null) {
    const ioMatch = text.match(INPUT_OUTPUT_RE)
    if (ioMatch) {
      inTokens = parseCount(ioMatch[1])
      outTokens = parseCount(ioMatch[2])
    }
  }

  if (inTokens === null) {
    const pcMatch = text.match(PROMPT_COMPLETION_RE)
    if (pcMatch) {
      inTokens = parseCount(pcMatch[1])
      outTokens = parseCount(pcMatch[2])
    }
  }

  if (inTokens !== null) result.inputTokens = inTokens
  if (outTokens !== null) result.outputTokens = outTokens

  const ctxPctMatch = text.match(CONTEXT_PCT_RE)
  if (ctxPctMatch) {
    result.contextUsedPercent = parseFloat(ctxPctMatch[1])
    const size = parseCount(ctxPctMatch[2])
    if (size !== null) result.contextWindowSize = size
  } else {
    const ctxSizeMatch = text.match(CONTEXT_SIZE_RE)
    if (ctxSizeMatch) {
      const size = parseCount(ctxSizeMatch[1])
      if (size !== null) result.contextWindowSize = size
      result.contextUsedPercent = parseFloat(ctxSizeMatch[2])
    }
  }

  const modelMatch = text.match(MODEL_RE)
  if (modelMatch) result.model = modelMatch[0] as ClaudeModel

  return Object.keys(result).length > 0 ? result : null
}
