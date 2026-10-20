/**
 * Aurelia Mobile — Cooking Sessions API
 */

import { supabase } from '@/lib/supabase'
import type { CompleteCookingSessionInput, CookingSessionRow } from './types'

/**
 * Persist a completed cooking session to Supabase.
 * Respects Row Level Security (RLS) guaranteeing user ownership.
 */
export async function recordCookingSession(
  input: CompleteCookingSessionInput
): Promise<CookingSessionRow> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('You must be signed in to record a cooking session.')
  }

  // 1. Verify recipe existence/ownership
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .select('id')
    .eq('id', input.recipeId)
    .single()

  if (recipeError || !recipe) {
    throw new Error('Recipe not found or inaccessible.')
  }

  // 2. Insert cooking session record
  const { data, error } = await supabase
    .from('cooking_sessions')
    .insert({
      user_id: user.id,
      recipe_id: input.recipeId,
      started_at: input.startedAt,
      completed_at: input.completedAt,
      notes: input.notes?.trim() || null,
      rating: input.rating ?? null,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Could not record cooking session.')
  }

  return data
}
