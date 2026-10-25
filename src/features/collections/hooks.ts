import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/auth-context'
import {
  fetchCollections,
  fetchCollectionDetail,
  createCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  fetchEligibleRecipesForCollection,
} from './api'
import type { CreateCollectionInput, UpdateCollectionInput } from './types'

export const COLLECTION_KEYS = {
  all: (userId?: string | null) =>
    userId ? (['collections', userId] as const) : (['collections'] as const),
  detail: (id: string, userId?: string | null) =>
    userId ? (['collection', userId, id] as const) : (['collection', id] as const),
  eligible: (collectionId: string, userId?: string | null) =>
    userId
      ? (['eligible-recipes-for-collection', userId, collectionId] as const)
      : (['eligible-recipes-for-collection', collectionId] as const),
}

export function useCollections() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: COLLECTION_KEYS.all(userId),
    queryFn: fetchCollections,
    enabled: Boolean(userId),
  })
}

export function useCollectionDetail(id: string) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: COLLECTION_KEYS.detail(id, userId),
    queryFn: () => fetchCollectionDetail(id),
    enabled: Boolean(userId && id),
  })
}

export function useEligibleRecipesForCollection(collectionId: string, enabled = true) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  return useQuery({
    queryKey: COLLECTION_KEYS.eligible(collectionId, userId),
    queryFn: () => fetchEligibleRecipesForCollection(collectionId),
    enabled: Boolean(userId && collectionId) && enabled,
  })
}

export function useCreateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCollectionInput) => createCollection(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useUpdateCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCollectionInput }) =>
      updateCollection(id, input),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collection', id] })
    },
  })
}

export function useDeleteCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

export function useAddRecipeToCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      addRecipeToCollection(collectionId, recipeId),
    onSuccess: (_data, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['eligible-recipes-for-collection', collectionId] })
    },
  })
}

export function useRemoveRecipeFromCollection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ collectionId, recipeId }: { collectionId: string; recipeId: string }) =>
      removeRecipeFromCollection(collectionId, recipeId),
    onSuccess: (_data, { collectionId }) => {
      queryClient.invalidateQueries({ queryKey: ['collection', collectionId] })
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['eligible-recipes-for-collection', collectionId] })
    },
  })
}
