import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface ProfileUpdateResult {
  success: boolean
  error?: string
  user?: User
  profile?: {
    id: string
    display_name: string | null
    updated_at: string
  }
}

/**
 * Validates a display name candidate.
 * Returns error message string if invalid, or null if valid.
 */
export function validateDisplayName(name: string): string | null {
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Name cannot be empty or contain only whitespace.'
  }
  if (trimmed.length > 60) {
    return 'Name cannot exceed 60 characters.'
  }
  return null
}

/**
 * Fetches the user's profile row from Supabase profiles table.
 */
export async function fetchUserProfile(userId: string) {
  if (!userId) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, updated_at')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.warn('[fetchUserProfile] Failed to load profile:', error)
    return null
  }

  return data
}

/**
 * Updates the user's display name atomically:
 * 1. Validates the trimmed name string (1-60 characters).
 * 2. Updates the Supabase 'profiles' table for the active user (enforces RLS: auth.uid() = id).
 * 3. Updates the Supabase Auth user metadata (display_name & full_name).
 *
 * Does NOT modify email, password, auth identities, or unrelated profile settings.
 */
export async function updateUserProfile(displayName: string): Promise<ProfileUpdateResult> {
  const validationError = validateDisplayName(displayName)
  if (validationError) {
    return { success: false, error: validationError }
  }

  const trimmed = displayName.trim()

  // 1. Ensure user is currently authenticated
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      success: false,
      error: 'You must be signed in to update your profile name.',
    }
  }

  // 2. Update the public.profiles record with RLS enforcement
  const now = new Date().toISOString()
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: trimmed,
      updated_at: now,
    })
    .eq('id', user.id)
    .select('id, display_name, updated_at')
    .maybeSingle()

  if (profileError) {
    console.error('[updateUserProfile] Database error updating profile:', profileError)
    return {
      success: false,
      error: profileError.message || 'Could not update profile in database.',
    }
  }

  // 3. Update Supabase Auth user metadata so session & offline user stay in sync
  const { data: authData, error: authError } = await supabase.auth.updateUser({
    data: {
      display_name: trimmed,
      full_name: trimmed,
    },
  })

  if (authError) {
    console.error('[updateUserProfile] Auth metadata update error:', authError)
    return {
      success: false,
      error: authError.message || 'Could not update auth user metadata.',
    }
  }

  return {
    success: true,
    user: authData.user,
    profile: profileData ?? { id: user.id, display_name: trimmed, updated_at: now },
  }
}
