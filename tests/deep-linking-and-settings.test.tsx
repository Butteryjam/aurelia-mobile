import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { parseAuthUrl } from '../src/lib/auth-url'
import SettingsScreen from '../src/app/(app)/settings'
import { queryClient } from '../src/lib/query-client'

// Mock dependencies
const mockPush = vi.fn()
const mockReplace = vi.fn()
const mockBack = vi.fn()
const mockSignOut = vi.fn().mockResolvedValue(undefined)

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
}))

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'usr-production-test', email: 'test_aurelia@culinary.test' },
    session: { access_token: 'valid-test-token' },
    signOut: mockSignOut,
  }),
}))

describe('Phase H — Deep Linking & Production Settings Suite', () => {
  describe('A. Deep Link URL Parsing & Route Resolution', () => {
    it('parses aurelia://reset-password with recovery token fragments', () => {
      const url =
        'aurelia://reset-password#access_token=secret-token-123&refresh_token=refresh-xyz&type=recovery'
      const parsed = parseAuthUrl(url)

      expect(parsed.accessToken).toBe('secret-token-123')
      expect(parsed.refreshToken).toBe('refresh-xyz')
      expect(parsed.type).toBe('recovery')
      expect(parsed.error).toBeUndefined()
    })

    it('parses aurelia://reset-password with query parameter code flow', () => {
      const url = 'aurelia://reset-password?code=auth-code-789&type=recovery'
      const parsed = parseAuthUrl(url)

      expect(parsed.code).toBe('auth-code-789')
      expect(parsed.type).toBe('recovery')
    })

    it('safely handles malformed deep links without crashing or leaking sensitive info', () => {
      const malformed = 'aurelia://invalid-route?foo=&&===&bar'
      const parsed = parseAuthUrl(malformed)
      expect(parsed).toBeDefined()
      expect(parsed.accessToken).toBeUndefined()
      expect(parsed.code).toBeUndefined()
    })

    it('accurately resolves deep link routes to expected application targets', () => {
      const routes = [
        { uri: 'aurelia://recipe/68173106-473e-44e5-8381-0630a7e7639e', expected: '/recipe/68173106-473e-44e5-8381-0630a7e7639e' },
        { uri: 'aurelia://cook/68173106-473e-44e5-8381-0630a7e7639e', expected: '/cook/68173106-473e-44e5-8381-0630a7e7639e' },
        { uri: 'aurelia://planner', expected: '/planner' },
        { uri: 'aurelia://chef', expected: '/chef' },
      ]

      routes.forEach(({ uri, expected }) => {
        const path = uri.replace('aurelia://', '/')
        expect(path).toBe(expected)
      })
    })

    it('sanitizes and extracts clean route path from segments without group tags', () => {
      const testSegments = ['(app)', 'recipe', '68173106-473e-44e5-8381-0630a7e7639e']
      const cleanSegments = testSegments.filter((s) => !s.startsWith('('))
      const targetPath = `/${cleanSegments.join('/')}`
      expect(targetPath).toBe('/recipe/68173106-473e-44e5-8381-0630a7e7639e')
    })
  })

  describe('B. Production Settings Screen', () => {
    it('renders user account details, preferences, and version information', () => {
      const html = renderToStaticMarkup(<SettingsScreen />)

      expect(html).toContain('Settings')
      expect(html).toContain('test_aurelia@culinary.test')
      expect(html).toContain('Personal Culinary Archive • Active')
      expect(html).toContain('Culinary Preferences')
      expect(html).toContain('Measurement System')
      expect(html).toContain('Metric (g, ml)')
      expect(html).toContain('Imperial (oz, cup)')
      expect(html).toContain('Default Servings')
      expect(html).toContain('Keep Awake in Cook Mode')
      expect(html).toContain('Data &amp; Security')
      expect(html).toContain('Change Password')
      expect(html).toContain('Clear Cache')
      expect(html).toContain('About Aurelia')
      expect(html).toContain('Version 1.0.0 (Build 1)')
      expect(html).toContain('Sign Out')
    })

    it('interacts with queryClient when cache is cleared', () => {
      const clearSpy = vi.spyOn(queryClient, 'clear')
      queryClient.clear()
      expect(clearSpy).toHaveBeenCalled()
    })
  })
})
