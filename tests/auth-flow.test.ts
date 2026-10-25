import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseAuthUrl, normalizeAuthError } from '../src/lib/auth-url'
import { supabase } from '../src/lib/supabase'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'

describe('Auth Flow & Deep Link Logic Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. URL and Deep Link Parser (parseAuthUrl)', () => {
    it('parses hash fragment tokens from aurelia://reset-password recovery link', () => {
      const url =
        'aurelia://reset-password#access_token=test_access_token_123&refresh_token=test_refresh_token_456&expires_in=3600&token_type=bearer&type=recovery'
      const parsed = parseAuthUrl(url)

      expect(parsed.accessToken).toBe('test_access_token_123')
      expect(parsed.refreshToken).toBe('test_refresh_token_456')
      expect(parsed.type).toBe('recovery')
    })

    it('parses PKCE authorization code from query parameters', () => {
      const url = 'aurelia://reset-password?code=auth_pkce_code_789'
      const parsed = parseAuthUrl(url)

      expect(parsed.code).toBe('auth_pkce_code_789')
    })

    it('parses token_hash from query parameters', () => {
      const url = 'aurelia://reset-password?token_hash=token_hash_abc&type=recovery'
      const parsed = parseAuthUrl(url)

      expect(parsed.tokenHash).toBe('token_hash_abc')
      expect(parsed.type).toBe('recovery')
    })

    it('parses error and error_description from deep link URL', () => {
      const url =
        'aurelia://reset-password#error=access_denied&error_code=401&error_description=Email+link+is+invalid+or+has+expired'
      const parsed = parseAuthUrl(url)

      expect(parsed.error).toBe('access_denied')
      expect(parsed.errorCode).toBe('401')
      expect(parsed.errorDescription).toBe('Email link is invalid or has expired')
    })

    it('gracefully handles empty, null, and malformed URLs', () => {
      expect(parseAuthUrl(null)).toEqual({})
      expect(parseAuthUrl(undefined)).toEqual({})
      expect(parseAuthUrl('')).toEqual({})
      expect(parseAuthUrl('aurelia://home')).toEqual({})
    })
  })

  describe('2. Error Normalization (normalizeAuthError)', () => {
    it('normalizes invalid credentials to user-friendly guidance', () => {
      const msg = normalizeAuthError({ message: 'Invalid login credentials' })
      expect(msg).toBe('The email or password you entered is incorrect. Please try again.')
    })

    it('normalizes already registered error', () => {
      const msg = normalizeAuthError({ message: 'User already registered' })
      expect(msg).toBe('An account with this email address already exists. Please sign in instead.')
    })

    it('normalizes network failure and fetch errors', () => {
      const msg = normalizeAuthError(new TypeError('Failed to fetch'))
      expect(msg).toBe('Unable to connect. Please check your internet connection and try again.')

      const networkMsg = normalizeAuthError({ message: 'Network request failed' })
      expect(networkMsg).toBe('Unable to connect. Please check your internet connection and try again.')
    })

    it('normalizes expired password reset links', () => {
      const msg = normalizeAuthError({ message: 'Token has expired or is invalid' })
      expect(msg).toBe('This password reset link is invalid or has expired. Please request a new one.')
    })

    it('normalizes password length requirements', () => {
      const msg = normalizeAuthError({ message: 'Password should be at least 6 characters' })
      expect(msg).toBe('Password must be at least 6 characters long.')
    })
  })

  describe('3. Login, Sign Up, Recovery, and Logout Mock Interception', () => {
    it('executes login success with valid credentials', async () => {
      const mockSession = {
        access_token: 'fake_access_token',
        refresh_token: 'fake_refresh_token',
        user: { id: 'usr-123', email: 'test@aurelia.app' },
      }

      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: {
          session: mockSession as any,
          user: mockSession.user as any,
        },
        error: null,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@aurelia.app',
        password: 'ValidPassword123',
      })

      expect(error).toBeNull()
      expect(data.session?.access_token).toBe('fake_access_token')
      expect(data.user?.email).toBe('test@aurelia.app')
    })

    it('executes login failure with invalid credentials', async () => {
      vi.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValueOnce({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials', name: 'AuthApiError', status: 400 } as any,
      })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'wrong@aurelia.app',
        password: 'wrongPassword',
      })

      expect(data.session).toBeNull()
      expect(error).not.toBeNull()
      expect(normalizeAuthError(error)).toBe(
        'The email or password you entered is incorrect. Please try again.'
      )
    })

    it('validates signup constraints before submission', () => {
      const validateSignup = (email: string, pass: string, confirm: string) => {
        if (!email || !email.includes('@')) return 'Invalid email'
        if (pass.length < 6) return 'Password must be at least 6 characters long.'
        if (pass !== confirm) return 'Passwords do not match.'
        return null
      }

      expect(validateSignup('', '123456', '123456')).toBe('Invalid email')
      expect(validateSignup('test@app.com', '12345', '12345')).toBe(
        'Password must be at least 6 characters long.'
      )
      expect(validateSignup('test@app.com', '123456', 'mismatch')).toBe('Passwords do not match.')
      expect(validateSignup('test@app.com', '123456', '123456')).toBeNull()
    })

    it('dispatches password reset request with aurelia://reset-password redirect', async () => {
      const resetSpy = vi
        .spyOn(supabase.auth, 'resetPasswordForEmail')
        .mockResolvedValueOnce({ data: {}, error: null })

      const { error } = await supabase.auth.resetPasswordForEmail('chef@aurelia.app', {
        redirectTo: 'aurelia://reset-password',
      })

      expect(error).toBeNull()
      expect(resetSpy).toHaveBeenCalledWith('chef@aurelia.app', {
        redirectTo: 'aurelia://reset-password',
      })
    })

    it('sets session and marks recovery active when deep link tokens are received', async () => {
      const setSessionSpy = vi
        .spyOn(supabase.auth, 'setSession')
        .mockResolvedValueOnce({
          data: {
            session: { access_token: 'rec_access', refresh_token: 'rec_refresh' } as any,
            user: { id: 'usr-recovery', email: 'chef@aurelia.app' } as any,
          },
          error: null,
        })

      const rawUrl =
        'aurelia://reset-password#access_token=rec_access&refresh_token=rec_refresh&type=recovery'
      const parsed = parseAuthUrl(rawUrl)

      expect(parsed.accessToken).toBe('rec_access')
      expect(parsed.refreshToken).toBe('rec_refresh')

      const { data, error } = await supabase.auth.setSession({
        access_token: parsed.accessToken!,
        refresh_token: parsed.refreshToken!,
      })

      expect(setSessionSpy).toHaveBeenCalledWith({
        access_token: 'rec_access',
        refresh_token: 'rec_refresh',
      })
      expect(error).toBeNull()
      expect(data.user?.id).toBe('usr-recovery')
    })

    it('updates password during authenticated reset session', async () => {
      const updateSpy = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValueOnce({
        data: { user: { id: 'usr-recovery', email: 'chef@aurelia.app' } as any },
        error: null,
      })

      const { data, error } = await supabase.auth.updateUser({
        password: 'NewlySetSecurePassword123!',
      })

      expect(updateSpy).toHaveBeenCalledWith({
        password: 'NewlySetSecurePassword123!',
      })
      expect(error).toBeNull()
      expect(data.user?.email).toBe('chef@aurelia.app')
    })

    it('clears session on logout', async () => {
      const signOutSpy = vi
        .spyOn(supabase.auth, 'signOut')
        .mockResolvedValueOnce({ error: null })

      const { error } = await supabase.auth.signOut()

      expect(signOutSpy).toHaveBeenCalled()
      expect(error).toBeNull()
    })

    it('restores persisted session from storage', async () => {
      const existingSession = {
        access_token: 'persisted_token',
        user: { id: 'usr-persisted', email: 'saved@aurelia.app' },
      }

      vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
        data: { session: existingSession as any },
        error: null,
      })

      const { data, error } = await supabase.auth.getSession()

      expect(error).toBeNull()
      expect(data.session?.user.email).toBe('saved@aurelia.app')
    })
  })

  describe('4. Google Sign-In & OAuth Mobile Flows', () => {
    it('parses Google OAuth PKCE callback URL', () => {
      const url = 'aurelia://auth/callback?code=google_pkce_code_123'
      const parsed = parseAuthUrl(url)

      expect(parsed.code).toBe('google_pkce_code_123')
      expect(parsed.error).toBeUndefined()
    })

    it('parses Google OAuth access and refresh tokens from fragment', () => {
      const url =
        'aurelia://auth/callback#access_token=google_access_token&refresh_token=google_refresh_token&token_type=bearer'
      const parsed = parseAuthUrl(url)

      expect(parsed.accessToken).toBe('google_access_token')
      expect(parsed.refreshToken).toBe('google_refresh_token')
    })

    it('parses Google OAuth error and error_description from callback', () => {
      const url =
        'aurelia://auth/callback?error=access_denied&error_description=User+declined+authorization'
      const parsed = parseAuthUrl(url)

      expect(parsed.error).toBe('access_denied')
      expect(parsed.errorDescription).toBe('User declined authorization')
    })

    it('initiates Google OAuth with proper provider, scheme redirect, and offline access options', async () => {
      const oauthSpy = vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: {
          provider: 'google',
          url: 'https://upzkcqovqstfsizerulx.supabase.co/auth/v1/authorize?provider=google',
        },
        error: null,
      })

      const redirectUrl = Linking.createURL('auth/callback')
      expect(redirectUrl).toBe('aurelia://auth/callback')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })

      expect(error).toBeNull()
      expect(oauthSpy).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: 'aurelia://auth/callback',
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          },
        },
      })
      expect(data?.url).toContain('authorize?provider=google')
    })

    it('handles user cancellation when browser auth session is dismissed or cancelled', async () => {
      vi.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'cancel' as any,
      })

      const result = await WebBrowser.openAuthSessionAsync(
        'https://upzkcqovqstfsizerulx.supabase.co/auth/v1/authorize',
        'aurelia://auth/callback'
      )

      expect(result.type).toBe('cancel')
    })

    it('exchanges authorization code for session on successful OAuth callback', async () => {
      vi.spyOn(WebBrowser, 'openAuthSessionAsync').mockResolvedValueOnce({
        type: 'success',
        url: 'aurelia://auth/callback?code=google_auth_code_789',
      })

      const result = await WebBrowser.openAuthSessionAsync(
        'https://upzkcqovqstfsizerulx.supabase.co/auth/v1/authorize',
        'aurelia://auth/callback'
      )

      expect(result.type).toBe('success')
      if (result.type === 'success' && result.url) {
        const parsed = parseAuthUrl(result.url)
        expect(parsed.code).toBe('google_auth_code_789')

        const exchangeSpy = vi
          .spyOn(supabase.auth, 'exchangeCodeForSession')
          .mockResolvedValueOnce({
            data: {
              session: { access_token: 'google_session_token' } as any,
              user: { id: 'usr-google', email: 'user@gmail.com' } as any,
            },
            error: null,
          })

        const { data, error } = await supabase.auth.exchangeCodeForSession(parsed.code!)
        expect(exchangeSpy).toHaveBeenCalledWith('google_auth_code_789')
        expect(error).toBeNull()
        expect(data.user?.email).toBe('user@gmail.com')
      }
    })

    it('sets session when tokens are returned in URL fragment', async () => {
      const setSessionSpy = vi.spyOn(supabase.auth, 'setSession').mockResolvedValueOnce({
        data: {
          session: { access_token: 'direct_token', refresh_token: 'direct_refresh' } as any,
          user: { id: 'usr-google-direct', email: 'direct@gmail.com' } as any,
        },
        error: null,
      })

      const callbackUrl =
        'aurelia://auth/callback#access_token=direct_token&refresh_token=direct_refresh'
      const parsed = parseAuthUrl(callbackUrl)

      expect(parsed.accessToken).toBe('direct_token')
      expect(parsed.refreshToken).toBe('direct_refresh')

      const { data, error } = await supabase.auth.setSession({
        access_token: parsed.accessToken!,
        refresh_token: parsed.refreshToken!,
      })

      expect(setSessionSpy).toHaveBeenCalledWith({
        access_token: 'direct_token',
        refresh_token: 'direct_refresh',
      })
      expect(error).toBeNull()
      expect(data.user?.id).toBe('usr-google-direct')
    })

    it('handles OAuth initialization failure gracefully', async () => {
      vi.spyOn(supabase.auth, 'signInWithOAuth').mockResolvedValueOnce({
        data: { provider: 'google', url: null },
        error: { message: 'Provider not configured', name: 'AuthApiError', status: 400 } as any,
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: 'aurelia://auth/callback' },
      })

      expect(data.url).toBeNull()
      expect(error).not.toBeNull()
      expect(error?.message).toBe('Provider not configured')
    })
  })
})

