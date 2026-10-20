import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@shared/types/database'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Aurelia Mobile] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.'
  )
}

// Memory fallback to prevent "window is not defined" crashes during Expo SSR/prerender
const memoryStorage = new Map<string, string>()
const isServer = typeof window === 'undefined'

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) {
      return memoryStorage.get(key) ?? null
    }
    try {
      return await AsyncStorage.getItem(key)
    } catch {
      return memoryStorage.get(key) ?? null
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) {
      memoryStorage.set(key, value)
      return
    }
    try {
      await AsyncStorage.setItem(key, value)
    } catch {
      memoryStorage.set(key, value)
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) {
      memoryStorage.delete(key)
      return
    }
    try {
      await AsyncStorage.removeItem(key)
    } catch {
      memoryStorage.delete(key)
    }
  },
}

/**
 * Authoritative Supabase Client for Aurelia Mobile
 *
 * Configured with:
 * - Persistent, SSR-safe AsyncStorage auth storage adapter
 * - Automatic background token refreshing
 * - Disabled URL session detection (deep linking handled by Expo Router)
 * - Complete database schema typing
 */
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      storage: safeStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
