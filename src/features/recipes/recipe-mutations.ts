import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  toCreateRecipePayload,
  type RecipeFormData,
} from './recipe-form-schema'
import { clearRecipeDraft } from './draft-storage'

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
}

/**
 * Creates a new recipe via the atomic POST /api/recipes endpoint.
 */
export async function createRecipeApi(formData: RecipeFormData): Promise<{ id: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to create a recipe.')
  }

  const payload = toCreateRecipePayload(formData)
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/recipes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    throw new Error(json.error || `Failed to create recipe (${response.status})`)
  }

  return { id: json.data?.id || json.id }
}

/**
 * Updates an existing recipe via the atomic PUT /api/recipes/[id] endpoint.
 */
export async function updateRecipeApi(
  recipeId: string,
  formData: RecipeFormData
): Promise<{ id: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to update a recipe.')
  }

  const payload = toCreateRecipePayload(formData)
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/recipes/${recipeId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    throw new Error(json.error || `Failed to update recipe (${response.status})`)
  }

  return { id: json.data?.id || recipeId }
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
