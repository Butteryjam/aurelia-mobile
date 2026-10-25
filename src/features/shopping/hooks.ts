/**
 * Aurelia Mobile — TanStack Query Hooks for Shopping Lists
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import {
  fetchActiveShoppingList,
  fetchShoppingList,
  fetchUserShoppingLists,
  createShoppingList,
  deleteShoppingList,
  renameShoppingList,
  toggleItemChecked,
  addManualShoppingItem,
  deleteShoppingItem,
  clearCompletedShoppingItems,
  generateShoppingItemsFromMealPlan,
  addRecipeToShoppingList,
} from './api'
import type { ShoppingListWithItems } from './types'

export const SHOPPING_KEYS = {
  all: ['shopping-lists'] as const,
  active: ['active-shopping-list'] as const,
  userAll: (userId?: string | null) =>
    userId ? (['shopping-lists', userId] as const) : (['shopping-lists'] as const),
  userActive: (userId?: string | null) =>
    userId ? (['active-shopping-list', userId] as const) : (['active-shopping-list'] as const),
  list: (id: string, userId?: string | null) =>
    userId ? (['shopping-list', userId, id] as const) : (['shopping-list', id] as const),
}

/**
 * Hook to retrieve the user's active shopping list.
 */
export function useActiveShoppingList() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: SHOPPING_KEYS.userActive(userId),
    queryFn: fetchActiveShoppingList,
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to retrieve a specific shopping list by ID.
 */
export function useShoppingList(listId: string) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: SHOPPING_KEYS.list(listId, userId),
    queryFn: () => fetchShoppingList(listId),
    enabled: Boolean(userId && listId),
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to retrieve all shopping lists.
 */
export function useUserShoppingLists() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: SHOPPING_KEYS.userAll(userId),
    queryFn: fetchUserShoppingLists,
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Mutation to create a new shopping list.
 */
export function useCreateShoppingList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (name: string) => createShoppingList(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userAll(userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to delete a shopping list.
 */
export function useDeleteShoppingList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (listId: string) => deleteShoppingList(listId),
    onSuccess: (_data, listId) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userAll(userId) })
      queryClient.removeQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to rename an existing shopping list.
 */
export function useRenameShoppingList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({ listId, newName }: { listId: string; newName: string }) =>
      renameShoppingList(listId, newName),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userAll(userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(updated.id, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to toggle a shopping item with optimistic update and rollback.
 */
export function useToggleShoppingItem(listId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({ itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
      toggleItemChecked(itemId, isChecked),
    onMutate: async ({ itemId, isChecked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      await queryClient.cancelQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })

      // Snapshot previous values
      const prevList = queryClient.getQueryData<ShoppingListWithItems>(
        SHOPPING_KEYS.list(listId, userId)
      )
      const prevActive = queryClient.getQueryData<ShoppingListWithItems>(
        SHOPPING_KEYS.userActive(userId)
      )

      // Optimistically update
      const updateItems = (old: ShoppingListWithItems | undefined) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === itemId ? { ...item, is_checked: isChecked } : item
          ),
        }
      }

      queryClient.setQueryData(SHOPPING_KEYS.list(listId, userId), updateItems)
      if (prevActive?.id === listId) {
        queryClient.setQueryData(SHOPPING_KEYS.userActive(userId), updateItems)
      }

      return { prevList, prevActive }
    },
    onError: (_err, _vars, context) => {
      // Rollback on failure
      if (context?.prevList) {
        queryClient.setQueryData(SHOPPING_KEYS.list(listId, userId), context.prevList)
      }
      if (context?.prevActive) {
        queryClient.setQueryData(SHOPPING_KEYS.userActive(userId), context.prevActive)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to add a manual item.
 */
export function useAddManualShoppingItem(listId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (rawText: string) => addManualShoppingItem(listId, rawText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to delete an item.
 */
export function useDeleteShoppingItem(listId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: (itemId: string) => deleteShoppingItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to clear all completed items.
 */
export function useClearCompletedShoppingItems(listId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: () => clearCompletedShoppingItems(listId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(listId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
    },
  })
}

/**
 * Mutation to generate/export shopping items from planned meals.
 */
export function useGenerateShoppingFromMealPlan() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({
      shoppingListId,
      plannedItemIds,
    }: {
      shoppingListId: string
      plannedItemIds: string[]
    }) => generateShoppingItemsFromMealPlan(shoppingListId, plannedItemIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(variables.shoppingListId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userAll(userId) })
    },
  })
}

/**
 * Mutation to add a recipe's ingredients directly to a shopping list.
 */
export function useAddRecipeToShoppingList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useMutation({
    mutationFn: ({
      shoppingListId,
      recipeId,
      targetServings,
    }: {
      shoppingListId: string
      recipeId: string
      targetServings: number
    }) => addRecipeToShoppingList(shoppingListId, recipeId, targetServings),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.list(variables.shoppingListId, userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userActive(userId) })
      queryClient.invalidateQueries({ queryKey: SHOPPING_KEYS.userAll(userId) })
    },
  })
}
