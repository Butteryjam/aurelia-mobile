import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

export function useCollections() {
  return useQuery({
    queryKey: ['collections'],
    queryFn: fetchCollections,
  })
}

export function useCollectionDetail(id: string) {
  return useQuery({
    queryKey: ['collection', id],
    queryFn: () => fetchCollectionDetail(id),
    enabled: Boolean(id),
  })
}

export function useEligibleRecipesForCollection(collectionId: string, enabled = true) {
  return useQuery({
    queryKey: ['eligible-recipes-for-collection', collectionId],
    queryFn: () => fetchEligibleRecipesForCollection(collectionId),
    enabled: Boolean(collectionId) && enabled,
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
