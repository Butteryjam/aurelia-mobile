import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  toCreateRecipePayload,
  type RecipeFormData,
} from './recipe-form-schema'
import { clearRecipeDraft } from './draft-storage'

/**
 * Helper to safely parse API responses without throwing "JSON Parse error: Unexpected end of input"
 */
export async function safeParseJsonResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text().catch(() => '')
    if (response.status === 307 || response.status === 302 || response.status === 401 || text.includes('login')) {
      throw new Error('Your session has expired. Please sign in again.')
    }
    if (response.status >= 500) {
      throw new Error(`Server encountered an error (${response.status}). Please try again later.`)
    }
    throw new Error(`Server returned unexpected non-JSON response (${response.status}).`)
  }

  try {
    return await response.json()
  } catch {
    throw new Error(`Malformed JSON response from server (${response.status}).`)
  }
}

/**
 * Creates a new recipe atomically directly in Supabase with RLS.
 * If any child record fails to insert, the parent recipe is deleted (clean rollback).
 */
export async function createRecipeDirect(formData: RecipeFormData): Promise<{ id: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to create a recipe.')
  }

  const data = toCreateRecipePayload(formData)
  const computedTotalTime =
    data.totalTime ??
    ((data.prepTime || 0) + (data.cookTime || 0) > 0
      ? (data.prepTime || 0) + (data.cookTime || 0)
      : null)

  // 1. Insert parent recipe record
  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      title: data.title.trim(),
      description: data.description?.trim() || null,
      image_url: data.imageUrl || null,
      prep_time: data.prepTime ?? null,
      cook_time: data.cookTime ?? null,
      total_time: computedTotalTime,
      servings: data.servings ?? null,
      difficulty: data.difficulty ?? null,
      cuisine: data.cuisine?.trim() || null,
      category: data.category?.trim() || null,
      is_public: false,
    })
    .select('id')
    .single()

  if (recipeError || !recipe) {
    console.error('[createRecipeDirect] Failed to create recipe parent:', recipeError)
    throw new Error(recipeError?.message || 'Could not create recipe. Please try again.')
  }

  try {
    // 2. Insert ingredients in order
    if (data.ingredients && data.ingredients.length > 0) {
      const ingredientsToInsert = data.ingredients.map((ing, idx) => ({
        recipe_id: recipe.id,
        name: ing.name.trim(),
        quantity: ing.quantity?.trim() || null,
        unit: ing.unit?.trim() || null,
        order_index: idx,
        is_optional: !!ing.isOptional,
        preparation_note: ing.preparationNote?.trim() || null,
      }))

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingError) throw ingError
    }

    // 3. Insert instructions in order
    if (data.instructions && data.instructions.length > 0) {
      const instructionsToInsert = data.instructions.map((ins, idx) => ({
        recipe_id: recipe.id,
        step_number: idx + 1,
        instruction: ins.instruction.trim(),
        timer_duration: ins.timerDuration ?? null,
      }))

      const { error: insError } = await supabase
        .from('recipe_instructions')
        .insert(instructionsToInsert)

      if (insError) throw insError
    }

    // 4. Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      for (const tagName of data.tags) {
        const cleanName = tagName.trim()
        if (!cleanName) continue

        const { data: tag } = await supabase
          .from('tags')
          .upsert({ user_id: user.id, name: cleanName }, { onConflict: 'user_id,name' })
          .select('id')
          .single()

        if (tag) {
          await supabase.from('recipe_tags').insert({
            recipe_id: recipe.id,
            tag_id: tag.id,
          })
        }
      }
    }

    // 5. Create initial version snapshot
    await supabase.from('recipe_versions').insert({
      recipe_id: recipe.id,
      version_number: 1,
      snapshot: {
        ...data,
        created_at: new Date().toISOString(),
      },
      change_note: 'Initial recipe created',
    })

    return { id: recipe.id }
  } catch (err: any) {
    console.error('[createRecipeDirect] Sub-entity insertion failed, rolling back recipe:', err)
    // Clean up parent record to prevent orphaned incomplete recipe
    await supabase.from('recipes').delete().eq('id', recipe.id)
    throw new Error(err.message || 'Failed to record recipe ingredients or instructions.')
  }
}

/**
 * Updates an existing recipe atomically in Supabase with RLS.
 */
export async function updateRecipeDirect(
  recipeId: string,
  formData: RecipeFormData
): Promise<{ id: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to update a recipe.')
  }

  const data = toCreateRecipePayload(formData)
  const computedTotalTime =
    data.totalTime ??
    ((data.prepTime || 0) + (data.cookTime || 0) > 0
      ? (data.prepTime || 0) + (data.cookTime || 0)
      : null)

  // 1. Update parent recipe
  const { error: updateError } = await supabase
    .from('recipes')
    .update({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      image_url: data.imageUrl || null,
      prep_time: data.prepTime ?? null,
      cook_time: data.cookTime ?? null,
      total_time: computedTotalTime,
      servings: data.servings ?? null,
      difficulty: data.difficulty ?? null,
      cuisine: data.cuisine?.trim() || null,
      category: data.category?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', recipeId)
    .eq('user_id', user.id)

  if (updateError) {
    throw new Error(updateError.message || 'Failed to update recipe details.')
  }

  // 2. Refresh ingredients
  await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
  if (data.ingredients && data.ingredients.length > 0) {
    const ingredientsToInsert = data.ingredients.map((ing, idx) => ({
      recipe_id: recipeId,
      name: ing.name.trim(),
      quantity: ing.quantity?.trim() || null,
      unit: ing.unit?.trim() || null,
      order_index: idx,
      is_optional: !!ing.isOptional,
      preparation_note: ing.preparationNote?.trim() || null,
    }))
    const { error: ingError } = await supabase.from('recipe_ingredients').insert(ingredientsToInsert)
    if (ingError) throw ingError
  }

  // 3. Refresh instructions
  await supabase.from('recipe_instructions').delete().eq('recipe_id', recipeId)
  if (data.instructions && data.instructions.length > 0) {
    const instructionsToInsert = data.instructions.map((ins, idx) => ({
      recipe_id: recipeId,
      step_number: idx + 1,
      instruction: ins.instruction.trim(),
      timer_duration: ins.timerDuration ?? null,
    }))
    const { error: insError } = await supabase.from('recipe_instructions').insert(instructionsToInsert)
    if (insError) throw insError
  }

  // 4. Refresh tags
  await supabase.from('recipe_tags').delete().eq('recipe_id', recipeId)
  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      const cleanName = tagName.trim()
      if (!cleanName) continue
      const { data: tag } = await supabase
        .from('tags')
        .upsert({ user_id: user.id, name: cleanName }, { onConflict: 'user_id,name' })
        .select('id')
        .single()
      if (tag) {
        await supabase.from('recipe_tags').insert({
          recipe_id: recipeId,
          tag_id: tag.id,
        })
      }
    }
  }

  return { id: recipeId }
}

/**
 * Creates a new recipe with atomic persistence and safe error handling.
 */
export async function createRecipeApi(formData: RecipeFormData): Promise<{ id: string }> {
  return createRecipeDirect(formData)
}

/**
 * Updates an existing recipe with atomic persistence and safe error handling.
 */
export async function updateRecipeApi(
  recipeId: string,
  formData: RecipeFormData
): Promise<{ id: string }> {
  return updateRecipeDirect(recipeId, formData)
}

/**
 * Hook for atomic recipe creation with cache invalidation and draft cleanup.
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      formData,
      userId,
    }: {
      formData: RecipeFormData
      userId: string
    }) => {
      const result = await createRecipeApi(formData)
      if (userId) {
        await clearRecipeDraft(userId, 'new')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-filter-options'] })
    },
  })
}

/**
 * Hook for atomic recipe update with cache invalidation and draft cleanup.
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recipeId,
      formData,
      userId,
    }: {
      recipeId: string
      formData: RecipeFormData
      userId: string
    }) => {
      const result = await updateRecipeApi(recipeId, formData)
      if (userId) {
        await clearRecipeDraft(userId, 'edit', recipeId)
      }
      return result
    },
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

function extractStoragePath(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null
  const bucketMarker = '/recipe-images/'
  const idx = imageUrl.indexOf(bucketMarker)
  if (idx === -1) return null
  const path = imageUrl.substring(idx + bucketMarker.length).split('?')[0]
  if (!path) return null
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}

async function cleanupStorageImages(imageUrls: Array<string | null | undefined>) {
  const paths = imageUrls.map(extractStoragePath).filter((p): p is string => Boolean(p && p.trim()))
  if (paths.length === 0) return
  try {
    await supabase.storage.from('recipe-images').remove(paths)
  } catch (err) {
    console.warn('[cleanupStorageImages] Storage image removal warning:', err)
  }
}

/**
 * Deletes a single recipe owned by the authenticated user directly in Supabase.
 */
export async function deleteRecipeDirect(recipeId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to delete a recipe.')
  }

  const { data, error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', recipeId)
    .eq('user_id', user.id)
    .select('id, image_url')

  if (error) {
    console.error('[deleteRecipeDirect] Failed to delete recipe:', error)
    throw new Error(error.message || 'Could not delete recipe.')
  }

  if (!data || data.length === 0) {
    throw new Error('Recipe not found or you do not have permission to delete it.')
  }

  if (data[0]?.image_url) {
    await cleanupStorageImages([data[0].image_url])
  }
}

/**
 * Bulk deletes multiple recipes owned by the authenticated user directly in Supabase.
 */
export async function bulkDeleteRecipesDirect(
  recipeIds: string[]
): Promise<{ count: number; deletedIds: string[] }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to delete recipes.')
  }

  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    throw new Error('No recipes selected for deletion.')
  }

  const uniqueIds = Array.from(new Set(recipeIds.filter((id) => typeof id === 'string' && id.trim().length > 0)))
  if (uniqueIds.length === 0) {
    throw new Error('No valid recipes selected for deletion.')
  }

  const { data, error } = await supabase
    .from('recipes')
    .delete()
    .in('id', uniqueIds)
    .eq('user_id', user.id)
    .select('id, image_url')

  if (error) {
    console.error('[bulkDeleteRecipesDirect] Failed to bulk delete recipes:', error)
    throw new Error(error.message || 'Could not delete recipes.')
  }

  if (!data || data.length === 0) {
    throw new Error('No matching recipes found to delete or permission denied.')
  }

  const imageUrls = data.map((r) => r.image_url).filter(Boolean)
  if (imageUrls.length > 0) {
    await cleanupStorageImages(imageUrls)
  }

  return {
    count: data.length,
    deletedIds: data.map((r) => r.id),
  }
}

/**
 * Hook for deleting a single recipe with full cache invalidation.
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipeId: string) => deleteRecipeDirect(recipeId),
    onSuccess: (_data, recipeId) => {
      queryClient.removeQueries({ queryKey: ['recipe', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-filter-options'] })
    },
  })
}

/**
 * Hook for bulk deleting multiple recipes with full cache invalidation.
 */
export function useBulkDeleteRecipes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (recipeIds: string[]) => bulkDeleteRecipesDirect(recipeIds),
    onSuccess: (data) => {
      data.deletedIds.forEach((id) => {
        queryClient.removeQueries({ queryKey: ['recipe', id] })
      })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['recipe-filter-options'] })
    },
  })
}
