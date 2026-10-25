import { describe, it, expect, vi, beforeEach } from 'vitest'
import { classifyAiError } from '@/features/ai/types'
import { safeAiFetch, getApiBaseUrl } from '@/features/ai/api'

describe('Issue 3 — AI Chef Network Error & Classification Regression Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('classifyAiError logic', () => {
    it('classifies genuine network disconnection as network_failure', () => {
      const error = classifyAiError(0, 'TypeError: Network request failed')
      expect(error.category).toBe('network_failure')
      expect(error.message).toContain('No network connection')
      expect(error.canRetry).toBe(true)
    })

    it('NEVER classifies JSON parse or syntax errors as lack of internet connection', () => {
      const error = classifyAiError(0, 'JSON Parse error: Unexpected end of input')
      expect(error.category).not.toBe('network_failure')
      expect(error.category).toBe('provider_failure')
      expect(error.message).toContain('Unable to process server response')
      expect(error.canRetry).toBe(true)
    })

    it('classifies 307 Temporary Redirect / login redirects as auth_failure, not network_failure', () => {
      const error = classifyAiError(307, 'Redirecting to /login')
      expect(error.category).toBe('auth_failure')
      expect(error.message).toContain('session has expired')
      expect(error.canRetry).toBe(false)
    })

    it('classifies 401 Unauthorized as auth_failure requiring sign in', () => {
      const error = classifyAiError(401, 'Unauthorized')
      expect(error.category).toBe('auth_failure')
      expect(error.canRetry).toBe(false)
    })

    it('classifies 500/502/503 server errors as provider_failure with retry enabled', () => {
      const error500 = classifyAiError(500, 'Internal Server Error')
      expect(error500.category).toBe('provider_failure')
      expect(error500.canRetry).toBe(true)

      const error502 = classifyAiError(502, 'Bad Gateway')
      expect(error502.category).toBe('provider_failure')
      expect(error502.canRetry).toBe(true)
    })

    it('classifies 405 Method Not Allowed as provider_failure and never as network_failure', () => {
      const error405 = classifyAiError(405, 'Method Not Allowed')
      expect(error405.category).toBe('provider_failure')
      expect(error405.category).not.toBe('network_failure')
      expect(error405.message).toContain('refused the request method (405)')
      expect(error405.canRetry).toBe(false)
    })

    it('classifies 429 rate limit with friendly countdown', () => {
      const rateLimited = classifyAiError(429, 'Rate limit exceeded', true, 45)
      expect(rateLimited.category).toBe('rate_limit')
      expect(rateLimited.message).toContain('45 seconds')
      expect(rateLimited.retryAfterSeconds).toBe(45)
      expect(rateLimited.canRetry).toBe(true)
    })
  })

  describe('safeAiFetch resilience', () => {
    it('returns parsed data for valid 200 JSON responses', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve({ data: { response: 'Hello Chef!' } }),
      } as any)

      const data = await safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      expect(data).toEqual({ response: 'Hello Chef!' })
    })

    it('intercepts 307 redirect HTML without throwing JSON parse error and raises auth failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 307,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: () => Promise.resolve('Redirecting to /login'),
      } as any)

      await expect(
        safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      ).rejects.toMatchObject({
        message: 'Your session has expired. Please sign in again.',
        status: 401,
      })
    })

    it('handles 405 Method Not Allowed responses preserving status 405', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 405,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('Method Not Allowed'),
      } as any)

      await expect(
        safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      ).rejects.toMatchObject({
        message: expect.stringContaining('(405)'),
        status: 405,
      })
    })

    it('detects redirected login responses even if status is 405', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 405,
        redirected: true,
        url: 'https://aurelia-gamma-one.vercel.app/login',
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(''),
      } as any)

      await expect(
        safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      ).rejects.toMatchObject({
        message: 'Your session has expired. Please sign in again.',
        status: 401,
      })
    })

    it('intercepts 500 HTML server error without throwing JSON parse error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve('<html><body>Internal Error</body></html>'),
      } as any)

      await expect(
        safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      ).rejects.toMatchObject({
        message: 'AI service is temporarily unavailable. Please try again later.',
        status: 500,
      })
    })

    it('marks genuine fetch network errors with isNetworkError and status 0', async () => {
      globalThis.fetch = vi.fn().mockRejectedValueOnce(new TypeError('Network request failed'))

      await expect(
        safeAiFetch('https://example.com/api/ai/chat', { method: 'POST' })
      ).rejects.toMatchObject({
        isNetworkError: true,
        status: 0,
      })
    })
  })
})
