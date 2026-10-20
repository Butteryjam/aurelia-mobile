import AsyncStorage from '@react-native-async-storage/async-storage'
import type { RecipeFormData } from './recipe-form-schema'

const DRAFT_PREFIX = 'aurelia_recipe_draft_'
const isServer = typeof window === 'undefined'
const memoryDrafts = new Map<string, string>()

export interface RecipeDraftPayload {
  formData: RecipeFormData
  updatedAt: number
  isEditDraft: boolean
  recipeId?: string
}

function getDraftKey(userId: string, type: 'new' | 'edit', recipeId?: string): string {
  if (type === 'edit' && recipeId) {
    return `${DRAFT_PREFIX}${userId}_edit_${recipeId}`
  }
  return `${DRAFT_PREFIX}${userId}_new`
}

/**
 * Save a recipe draft to persistent storage.
 */
export async function saveRecipeDraft(
  userId: string,
  type: 'new' | 'edit',
  formData: RecipeFormData,
  recipeId?: string
): Promise<void> {
  if (!userId) return

  const key = getDraftKey(userId, type, recipeId)
  const payload: RecipeDraftPayload = {
    formData,
    updatedAt: Date.now(),
    isEditDraft: type === 'edit',
    recipeId,
  }

  const serialized = JSON.stringify(payload)

  if (isServer) {
    memoryDrafts.set(key, serialized)
    return
  }

  try {
    await AsyncStorage.setItem(key, serialized)
  } catch (err) {
    console.warn('[saveRecipeDraft] Storage write failed, falling back to memory:', err)
    memoryDrafts.set(key, serialized)
  }
}

/**
 * Retrieve a saved draft from persistent storage.
 */
export async function loadRecipeDraft(
  userId: string,
  type: 'new' | 'edit',
  recipeId?: string
): Promise<RecipeDraftPayload | null> {
  if (!userId) return null

  const key = getDraftKey(userId, type, recipeId)

  if (isServer) {
    const raw = memoryDrafts.get(key)
    return raw ? JSON.parse(raw) : null
  }

  try {
    const raw = await AsyncStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as RecipeDraftPayload
  } catch (err) {
    console.warn('[loadRecipeDraft] Storage read failed:', err)
    const raw = memoryDrafts.get(key)
    return raw ? JSON.parse(raw) : null
  }
}

/**
 * Clear a saved draft upon successful save or explicit discard.
 */
export async function clearRecipeDraft(
  userId: string,
  type: 'new' | 'edit',
  recipeId?: string
): Promise<void> {
  if (!userId) return

  const key = getDraftKey(userId, type, recipeId)
  memoryDrafts.delete(key)

  if (isServer) return

  try {
    await AsyncStorage.removeItem(key)
  } catch (err) {
    console.warn('[clearRecipeDraft] Storage remove failed:', err)
  }
}
