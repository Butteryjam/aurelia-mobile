/**
 * Aurelia Mobile — TanStack Query Hooks for Cooking Sessions
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { recordCookingSession } from './api'
import type { CompleteCookingSessionInput, CookingSessionRow } from './types'

export const COOK_MODE_KEYS = {
  all: ['cooking-sessions'] as const,
  byRecipe: (recipeId: string) => ['cooking-sessions', recipeId] as const,
}

export function useCompleteCookingSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CompleteCookingSessionInput) => recordCookingSession(input),
    onSuccess: (data: CookingSessionRow, variables) => {
      // Invalidate specific recipe detail cache
      queryClient.invalidateQueries({ queryKey: ['recipe', variables.recipeId] })
      // Invalidate home dashboard to refresh recent cooking activity and stats
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      // Invalidate general cooking sessions
      queryClient.invalidateQueries({ queryKey: COOK_MODE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: COOK_MODE_KEYS.byRecipe(variables.recipeId) })
    },
  })
}
