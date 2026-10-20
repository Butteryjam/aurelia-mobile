import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchHomeDashboard,
  fetchRecipes,
  fetchRecipeFilterOptions,
  fetchRecipeDetail,
  toggleRecipeFavorite,
} from './api'
import type { RecipeFilters, RecipeListItem, RecipeDetail, HomeDashboardData } from './types'

export function useHomeDashboard() {
  return useQuery({
    queryKey: ['home-dashboard'],
    queryFn: fetchHomeDashboard,
  })
}

export function useRecipes(filters: RecipeFilters = {}) {
  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: () => fetchRecipes(filters),
  })
}

export function useRecipeFilterOptions() {
  return useQuery({
    queryKey: ['recipe-filter-options'],
    queryFn: fetchRecipeFilterOptions,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export function useRecipeDetail(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: () => fetchRecipeDetail(id),
    enabled: Boolean(id),
  })
}

export function useFavoriteRecipes() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => fetchRecipes({ favoriteOnly: true }),
  })
}

export function useToggleFavorite() {
  const queryClient = useQueryClient()

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
      await queryClient.cancelQueries({ queryKey: ['recipes'] })
      await queryClient.cancelQueries({ queryKey: ['recipe', recipeId] })
      await queryClient.cancelQueries({ queryKey: ['home-dashboard'] })
      await queryClient.cancelQueries({ queryKey: ['favorites'] })

      const newFavoriteState = !isCurrentlyFavorite

      // 2. Snapshot previous values
      const prevRecipe = queryClient.getQueryData<RecipeDetail>(['recipe', recipeId])
      const prevDashboard = queryClient.getQueryData<HomeDashboardData>(['home-dashboard'])
      const prevFavorites = queryClient.getQueryData<RecipeListItem[]>(['favorites'])

      // 3. Optimistically update single recipe cache
      if (prevRecipe) {
        queryClient.setQueryData<RecipeDetail>(['recipe', recipeId], {
          ...prevRecipe,
          isFavorite: newFavoriteState,
        })
      }

      // 4. Optimistically update dashboard cache
      if (prevDashboard) {
        queryClient.setQueryData<HomeDashboardData>(['home-dashboard'], {
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
            ['favorites'],
            prevFavorites.filter((r) => r.id !== recipeId)
          )
        } else {
          queryClient.setQueryData<RecipeListItem[]>(
            ['favorites'],
            prevFavorites.map((r) =>
              r.id === recipeId ? { ...r, isFavorite: true } : r
            )
          )
        }
      }

      // 6. Optimistically update all recipes list queries
      queryClient.setQueriesData<RecipeListItem[]>(
        { queryKey: ['recipes'] },
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
        queryClient.setQueryData(['recipe', recipeId], context.prevRecipe)
      }
      if (context?.prevDashboard) {
        queryClient.setQueryData(['home-dashboard'], context.prevDashboard)
      }
      if (context?.prevFavorites) {
        queryClient.setQueryData(['favorites'], context.prevFavorites)
      }
    },

    onSettled: (_data, _err, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      queryClient.invalidateQueries({ queryKey: ['recipe', recipeId] })
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['favorites'] })
    },
  })
}

