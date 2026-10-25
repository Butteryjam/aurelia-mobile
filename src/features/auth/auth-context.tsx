import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '@/lib/supabase'
import { parseAuthUrl, normalizeAuthError } from '@/lib/auth-url'

// Complete any pending browser sessions if returning from OAuth
WebBrowser.maybeCompleteAuthSession()

export interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  recoveryActive: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>
  signUp: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; requiresEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>
  handleDeepLinkUrl: (
    url: string
  ) => Promise<{ success: boolean; isRecovery?: boolean; error?: string }>
  verifyOtp: (params: {
    email: string
    token: string
    type?: 'recovery' | 'signup'
  }) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recoveryActive, setRecoveryActive] = useState(false)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    let isMounted = true

    // 1. Retrieve initial active session persisted in AsyncStorage
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession }, error: sessionError }) => {
        if (!isMounted) return
        if (sessionError) {
          console.warn('[AuthProvider] Failed to restore session:', sessionError.message)
        }
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('[AuthProvider] Error loading initial session:', err)
        setIsLoading(false)
      })

    // 2. Subscribe to auth changes (sign in, sign out, token refresh, recovery)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!isMounted) return

      setSession(newSession)
      setUser(newSession?.user ?? null)
      setIsLoading(false)

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryActive(true)
      } else if (event === 'SIGNED_OUT') {
        setRecoveryActive(false)
        setError(null)
      } else if (event === 'SIGNED_IN') {
        setError(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (signInError) {
        const msg = normalizeAuthError(signInError)
        setError(msg)
        return { success: false, error: msg }
      }

      setSession(data.session)
      setUser(data.user)
      return { success: true }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError(null)
    try {
      const redirectUrl = Linking.createURL('auth/callback')

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
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

      if (oauthError) {
        const msg = normalizeAuthError(oauthError)
        setError(msg)
        return { success: false, error: msg }
      }

      if (!data?.url) {
        const msg = 'Could not generate Google sign-in URL.'
        setError(msg)
        return { success: false, error: msg }
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl)

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return { success: false, cancelled: true }
      }

      if (result.type === 'success' && result.url) {
        const parsed = parseAuthUrl(result.url)

        if (parsed.error) {
          const msg = normalizeAuthError(parsed.errorDescription || parsed.error)
          setError(msg)
          return { success: false, error: msg }
        }

        // Case 1: PKCE code exchange
        if (parsed.code) {
          const { data: sessionData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(parsed.code)

          if (exchangeError) {
            const msg = normalizeAuthError(exchangeError)
            setError(msg)
            return { success: false, error: msg }
          }

          setSession(sessionData.session)
          setUser(sessionData.user)
          setRecoveryActive(false)
          return { success: true }
        }

        // Case 2: Direct session tokens
        if (parsed.accessToken && parsed.refreshToken) {
          const { data: sessionData, error: setSessionError } =
            await supabase.auth.setSession({
              access_token: parsed.accessToken,
              refresh_token: parsed.refreshToken,
            })

          if (setSessionError) {
            const msg = normalizeAuthError(setSessionError)
            setError(msg)
            return { success: false, error: msg }
          }

          setSession(sessionData.session)
          setUser(sessionData.user)
          setRecoveryActive(false)
          return { success: true }
        }
      }

      const msg = 'No authentication response received from Google.'
      setError(msg)
      return { success: false, error: msg }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setError(null)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })

      if (signUpError) {
        const msg = normalizeAuthError(signUpError)
        setError(msg)
        return { success: false, error: msg }
      }

      // If email confirmation is required, session might be null
      const requiresEmailConfirmation = !data.session && Boolean(data.user)

      if (data.session) {
        setSession(data.session)
        setUser(data.user)
      }

      return {
        success: true,
        requiresEmailConfirmation,
      }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('[AuthProvider] Error during signOut:', err)
    } finally {
      setSession(null)
      setUser(null)
      setRecoveryActive(false)
      setError(null)
    }
  }, [])

  const sendPasswordReset = useCallback(async (email: string) => {
    setError(null)
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'aurelia://reset-password',
      })

      if (resetError) {
        const msg = normalizeAuthError(resetError)
        setError(msg)
        return { success: false, error: msg }
      }

      return { success: true }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        const msg = normalizeAuthError(updateError)
        setError(msg)
        return { success: false, error: msg }
      }

      setRecoveryActive(false)
      return { success: true }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const handleDeepLinkUrl = useCallback(async (url: string) => {
    setError(null)
    try {
      const parsed = parseAuthUrl(url)

      if (parsed.error) {
        const msg = normalizeAuthError(parsed.errorDescription || parsed.error)
        setError(msg)
        return { success: false, error: msg }
      }

      // Case 1: Session tokens present in hash/params (recovery / magic link)
      if (parsed.accessToken && parsed.refreshToken) {
        const { data, error: setSessionError } = await supabase.auth.setSession({
          access_token: parsed.accessToken,
          refresh_token: parsed.refreshToken,
        })

        if (setSessionError) {
          const msg = normalizeAuthError(setSessionError)
          setError(msg)
          return { success: false, error: msg }
        }

        setSession(data.session)
        setUser(data.user)

        const isRecovery = parsed.type === 'recovery'
        if (isRecovery) {
          setRecoveryActive(true)
        }
        return { success: true, isRecovery }
      }

      // Case 2: PKCE code exchange
      if (parsed.code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          parsed.code
        )

        if (exchangeError) {
          const msg = normalizeAuthError(exchangeError)
          setError(msg)
          return { success: false, error: msg }
        }

        setSession(data.session)
        setUser(data.user)
        const isRecovery = parsed.type === 'recovery'
        if (isRecovery) {
          setRecoveryActive(true)
        }
        return { success: true, isRecovery }
      }

      // Case 3: Token hash verification
      if (parsed.tokenHash) {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          token_hash: parsed.tokenHash,
          type: (parsed.type as any) || 'recovery',
        })

        if (otpError) {
          const msg = normalizeAuthError(otpError)
          setError(msg)
          return { success: false, error: msg }
        }

        setSession(data.session)
        setUser(data.user)
        const isRecovery = parsed.type === 'recovery'
        if (isRecovery) {
          setRecoveryActive(true)
        }
        return { success: true, isRecovery }
      }

      return { success: false, error: 'No authentication parameters found in link.' }
    } catch (err) {
      const msg = normalizeAuthError(err)
      setError(msg)
      return { success: false, error: msg }
    }
  }, [])

  const verifyOtp = useCallback(
    async (params: { email: string; token: string; type?: 'recovery' | 'signup' }) => {
      setError(null)
      try {
        const { data, error: otpError } = await supabase.auth.verifyOtp({
          email: params.email.trim(),
          token: params.token.trim(),
          type: params.type || 'recovery',
        })

        if (otpError) {
          const msg = normalizeAuthError(otpError)
          setError(msg)
          return { success: false, error: msg }
        }

        setSession(data.session)
        setUser(data.user)
        if (params.type === 'recovery' || !params.type) {
          setRecoveryActive(true)
        }
        return { success: true }
      } catch (err) {
        const msg = normalizeAuthError(err)
        setError(msg)
        return { success: false, error: msg }
      }
    },
    []
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      error,
      recoveryActive,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      handleDeepLinkUrl,
      verifyOtp,
      clearError,
    }),
    [
      user,
      session,
      isLoading,
      error,
      recoveryActive,
      signIn,
      signInWithGoogle,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      handleDeepLinkUrl,
      verifyOtp,
      clearError,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
