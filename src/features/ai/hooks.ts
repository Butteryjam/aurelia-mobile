/**
 * Aurelia Mobile — AI TanStack Query Hooks
 *
 * Provides mutation/query hooks for AI extraction, modification, and chat.
 * Handles cache invalidation, abort controllers, and error classification.
 */

import { useRef, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  extractRecipeFromText,
  extractRecipeFromImage,
  modifyRecipe,
  sendChatMessage,
  fetchConversations,
  fetchConversationMessages,
  deleteConversation,
} from './api'
import type {
  ExtractedRecipeData,
  RecipeModificationInput,
  ModifiedRecipeResult,
  ChatResponse,
  ChatMessage,
  Conversation,
} from './types'
import type { RecipeFormData } from '@/features/recipes/recipe-form-schema'

// ─── Extraction Hooks ─────────────────────────────────────────

export function useExtractRecipeFromText() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const mutation = useMutation<ExtractedRecipeData, Error, string>({
    mutationFn: async (text: string) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      return extractRecipeFromText(text, controller.signal)
    },
  })

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return { ...mutation, cancel }
}

export function useExtractRecipeFromImage() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const mutation = useMutation<
    ExtractedRecipeData,
    Error,
    { base64Data: string; mimeType: string }
  >({
    mutationFn: async ({ base64Data, mimeType }) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      return extractRecipeFromImage(base64Data, mimeType, controller.signal)
    },
  })

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return { ...mutation, cancel }
}

// ─── Modification Hook ────────────────────────────────────────

export function useModifyRecipe() {
  const abortControllerRef = useRef<AbortController | null>(null)

  const mutation = useMutation<ModifiedRecipeResult, Error, RecipeModificationInput>({
    mutationFn: async (input) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      return modifyRecipe(input, controller.signal)
    },
  })

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return { ...mutation, cancel }
}

// ─── Chat Hooks ───────────────────────────────────────────────

export function useSendChatMessage() {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  const mutation = useMutation<
    ChatResponse,
    Error,
    { message: string; conversationId?: string; recipeId?: string | null }
  >({
    mutationFn: async ({ message, conversationId, recipeId }) => {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller
      return sendChatMessage(message, conversationId, recipeId, controller.signal)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
      if (data.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ['ai-messages', data.conversationId],
        })
      }
    },
  })

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
  }, [])

  return { ...mutation, cancel }
}

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: ['ai-conversations'],
    queryFn: fetchConversations,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery<ChatMessage[]>({
    queryKey: ['ai-messages', conversationId],
    queryFn: () => fetchConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] })
    },
  })
}
