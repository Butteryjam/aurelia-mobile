/**
 * Aurelia Theme Context
 *
 * Provides application-wide Light / Dark / System theme management
 * with AsyncStorage persistence. Wraps the entire app.
 *
 * Usage:
 *   const { themeMode, setThemeMode, isDark } = useThemeMode()
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = '@aurelia:theme_mode'

interface ThemeModeContextValue {
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  isDark: boolean
}

const ThemeModeContext = createContext<ThemeModeContextValue>({
  themeMode: 'system',
  setThemeMode: () => {},
  isDark: false,
})

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [hydrated, setHydrated] = useState(false)

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setThemeModeState(stored)
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true))
  }, [])

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode)
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {})
  }, [])

  const isDark =
    themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark')

  // Wait for hydration to avoid flash
  if (!hydrated) return null

  return (
    <ThemeModeContext.Provider value={{ themeMode, setThemeMode, isDark }}>
      {children}
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode(): ThemeModeContextValue {
  return useContext(ThemeModeContext)
}
