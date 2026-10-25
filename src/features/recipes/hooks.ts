import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import {
  fetchHomeDashboard,
  fetchRecipes,
  fetchRecipeFilterOptions,
  fetchRecipeDetail,
  toggleRecipeFavorite,
} from './api'
import type { RecipeFilters, RecipeListItem, RecipeDetail, HomeDashboardData } from './types'

export const RECIPE_QUERY_KEYS = {
  dashboard: (userId?: string | null) => ['home-dashboard', userId ?? 'anonymous'] as const,
  list: (userId?: string | null, filters?: RecipeFilters) =>
    ['recipes', userId ?? 'anonymous', filters ?? {}] as const,
  filterOptions: (userId?: string | null) =>
    ['recipe-filter-options', userId ?? 'anonymous'] as const,
  detail: (userId?: string | null, id?: string) =>
    ['recipe', userId ?? 'anonymous', id ?? ''] as const,
  favorites: (userId?: string | null) =>
    ['favorites', userId ?? 'anonymous'] as const,
}

export function useHomeDashboard() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.dashboard(userId),
    queryFn: fetchHomeDashboard,
    enabled: Boolean(userId),
  })
}

export function useRecipes(filters: RecipeFilters = {}) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.list(userId, filters),
    queryFn: () => fetchRecipes(filters),
    enabled: Boolean(userId),
  })
}

export function useRecipeFilterOptions() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.filterOptions(userId),
    queryFn: fetchRecipeFilterOptions,
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useRecipeDetail(id: string) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.detail(userId, id),
    queryFn: () => fetchRecipeDetail(id),
    enabled: Boolean(userId && id),
  })
}

export function useFavoriteRecipes() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: RECIPE_QUERY_KEYS.favorites(userId),
    queryFn: () => fetchRecipes({ favoriteOnly: true }),
    enabled: Boolean(userId),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({
      recipeId,
      isCurrentlyFavorite,
    }: {
      recipeId: string
      isCurrentlyFavorite: boolean
    }) => toggleRecipeFavorite(recipeId, isCurrentlyFavorite),

    onMutate: async ({ recipeId, isCurrentlyFavorite }) => {
      // 1. Cancel outgoing queries for related queries
      await queryClient.cancelQueries({ queryKey: ['recipes', userId] })
      await queryClient.cancelQueries({ queryKey: ['recipe', userId, recipeId] })
      await queryClient.cancelQueries({ queryKey: ['home-dashboard', userId] })
      await queryClient.cancelQueries({ queryKey: ['favorites', userId] })

      const newFavoriteState = !isCurrentlyFavorite

      // 2. Snapshot previous values
      const prevRecipe = queryClient.getQueryData<RecipeDetail>(['recipe', userId, recipeId])
      const prevDashboard = queryClient.getQueryData<HomeDashboardData>(['home-dashboard', userId])
      const prevFavorites = queryClient.getQueryData<RecipeListItem[]>(['favorites', userId])

      // 3. Optimistically update single recipe cache
      if (prevRecipe) {
        queryClient.setQueryData<RecipeDetail>(['recipe', userId, recipeId], {
          ...prevRecipe,
          isFavorite: newFavoriteState,
        })
      }

      // 4. Optimistically update dashboard cache
      if (prevDashboard) {
        queryClient.setQueryData<HomeDashboardData>(['home-dashboard', userId], {
          ...prevDashboard,
          recentRecipes: prevDashboard.recentRecipes.map((r) =>
            r.id === recipeId ? { ...r, isFavorite: newFavoriteState } : r
          ),
          stats: {
            ...prevDashboard.stats,
            favoriteCount: Math.max(
              0,
              prevDashboard.stats.favoriteCount + (newFavoriteState ? 1 : -1)
            ),
          },
        })
      }

      // 5. Optimistically update favorites cache: remove if unfavoriting
      if (prevFavorites) {
        if (!newFavoriteState) {
          queryClient.setQueryData<RecipeListItem[]>(
            ['favorites', userId],
            prevFavorites.filter((r) => r.id !== recipeId)
          )
        } else {
          queryClient.setQueryData<RecipeListItem[]>(
            ['favorites', userId],
            prevFavorites.map((r) =>
              r.id === recipeId ? { ...r, isFavorite: true } : r
            )
          )
        }
      }

      // 6. Optimistically update all recipes list queries
      queryClient.setQueriesData<RecipeListItem[]>(
        { queryKey: ['recipes', userId] },
        (old) => {
          if (!old) return old
          return old.map((r) =>
            r.id === recipeId ? { ...r, isFavorite: newFavoriteState } : r
          )
        }
      )

      return { prevRecipe, prevDashboard, prevFavorites }
    },

    onError: (_err, { recipeId }, context) => {
      // Rollback on failure
      if (context?.prevRecipe) {
        queryClient.setQueryData(['recipe', userId, recipeId], context.prevRecipe)
      }
      if (context?.prevDashboard) {
        queryClient.setQueryData(['home-dashboard', userId], context.prevDashboard)
      }
      if (context?.prevFavorites) {
        queryClient.setQueryData(['favorites', userId], context.prevFavorites)
      }
    },

    onSettled: (_data, _err, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes', userId] })
      queryClient.invalidateQueries({ queryKey: ['recipe', userId, recipeId] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard', userId] })
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] })
    },
  })
}

export { useDeleteRecipe, useBulkDeleteRecipes } from './recipe-mutations'


