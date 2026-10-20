import { supabase } from './supabase'
import type {
  ExtractedRecipeData,
  RecipeModificationInput,
  ModifiedRecipeResult,
  GroundedRecipeReference,
} from '@shared/features/ai/types'
import type { CreateRecipeInput, UpdateRecipeInput } from '@shared/lib/validators/recipe'
import type { AiMessage } from '@shared/types/database'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface ChatResponse {
  conversationId: string
  userMessage: AiMessage
  assistantMessage: AiMessage
  references: GroundedRecipeReference[]
}

export class ApiError extends Error {
  status: number
  rateLimited?: boolean
  retryAfterSeconds?: number

  constructor(
    message: string,
    status: number,
    rateLimited?: boolean,
    retryAfterSeconds?: number
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.rateLimited = rateLimited
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/**
 * Perform an authenticated HTTP request to the Aurelia Next.js server.
 * Automatically injects the user's Supabase JWT access token.
 */
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(options.headers || {})
  headers.set('Content-Type', 'application/json')

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers,
  })

  let json: Record<string, unknown>
  try {
    json = await response.json()
  } catch {
    throw new ApiError('Unexpected server response format', response.status)
  }

  if (!response.ok) {
    throw new ApiError(
      (json.error as string) || `Request failed with status ${response.status}`,
      response.status,
      Boolean(json.rateLimited),
      typeof json.retryAfterSeconds === 'number' ? json.retryAfterSeconds : undefined
    )
  }

  return (json.data !== undefined ? json.data : json) as T
}

export const apiClient = {
  ai: {
    chat: (data: {
      message: string
      recipeId?: string | null
      conversationId?: string
    }) => request<ChatResponse>('/api/ai/chat', { method: 'POST', body: JSON.stringify(data) }),

    extractText: (text: string) =>
      request<ExtractedRecipeData>('/api/ai/extract-text', {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),

    extractImage: (base64Data: string, mimeType: string = 'image/jpeg') =>
      request<ExtractedRecipeData>('/api/ai/extract-image', {
        method: 'POST',
        body: JSON.stringify({ base64Data, mimeType }),
      }),

    modifyRecipe: (data: RecipeModificationInput) =>
      request<ModifiedRecipeResult>('/api/ai/modify-recipe', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  recipes: {
    create: (data: CreateRecipeInput) =>
      request<{ id: string }>('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: UpdateRecipeInput) =>
      request<{ id: string; success: boolean }>(`/api/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/recipes/${id}`, {
        method: 'DELETE',
      }),
  },
}
