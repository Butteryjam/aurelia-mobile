/**
 * Aurelia Mobile — AI API Client
 *
 * All AI requests go through the authenticated Next.js API backend.
 * Never calls Gemini/OpenAI directly from mobile.
 * Never exposes service-role keys or provider internals.
 */

import { Platform } from 'react-native'
import { supabase } from '@/lib/supabase'
import type {
  ExtractedRecipeData,
  RecipeModificationInput,
  ModifiedRecipeResult,
  ChatResponse,
  Conversation,
  ChatMessage,
} from './types'

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim()
  if (envUrl) {
    // If running on a physical Android/iOS device, localhost/127.0.0.1 is unreachable
    if (Platform.OS !== 'web' && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return 'https://aurelia-gamma-one.vercel.app'
    }
    return envUrl
  }
  return 'https://aurelia-gamma-one.vercel.app'
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to use AI features.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

/**
 * Robust fetch wrapper for AI operations.
 * Safely parses JSON, handles HTML/redirects without crashing, and attaches accurate HTTP status codes.
 */
export async function safeAiFetch(url: string, options: RequestInit): Promise<any> {
  let response: Response
  try {
    response = await fetch(url, options)
  } catch (err: any) {
    const error: any = new Error(err.message || 'Network request failed')
    error.status = 0
    error.isNetworkError = true
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  let json: any = null

  if (contentType.includes('application/json')) {
    try {
      json = await response.json()
    } catch {
      const error: any = new Error('Malformed JSON received from AI service.')
      error.status = response.status
      throw error
    }
  } else {
    const text = await response.text().catch(() => '')
    if (
      response.status === 307 ||
      response.status === 302 ||
      response.status === 401 ||
      text.includes('login') ||
      (response.redirected && response.url.includes('/login'))
    ) {
      const error: any = new Error('Your session has expired. Please sign in again.')
      error.status = 401
      throw error
    }
    if (response.status === 405) {
      const error: any = new Error('The AI service route refused the request method (405). Please verify backend deployment.')
      error.status = 405
      throw error
    }
    if (response.status === 404) {
      const error: any = new Error('AI service endpoint was not found (404).')
      error.status = 404
      throw error
    }
    if (response.status >= 500) {
      const error: any = new Error('AI service is temporarily unavailable. Please try again later.')
      error.status = response.status
      throw error
    }
    const error: any = new Error(`Unexpected server response (${response.status}).`)
    error.status = response.status
    throw error
  }

  if (!response.ok || json?.error) {
    const error: any = new Error(json?.error || `AI request failed (${response.status})`)
    error.status = response.status
    error.errorCategory = json?.errorCategory
    error.rateLimited = json?.rateLimited
    error.retryAfterSeconds = json?.retryAfterSeconds
    throw error
  }

  return json.data
}

// ─── Text Extraction ──────────────────────────────────────────

export async function extractRecipeFromText(
  text: string,
  signal?: AbortSignal
): Promise<ExtractedRecipeData> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  return safeAiFetch(`${baseUrl}/api/ai/extract-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
    signal,
  })
}

// ─── Image Extraction ─────────────────────────────────────────

export async function extractRecipeFromImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
  signal?: AbortSignal
): Promise<ExtractedRecipeData> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  return safeAiFetch(`${baseUrl}/api/ai/extract-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ base64Data, mimeType }),
    signal,
  })
}

// ─── Recipe Modification ──────────────────────────────────────

export async function modifyRecipe(
  input: RecipeModificationInput,
  signal?: AbortSignal
): Promise<ModifiedRecipeResult> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  return safeAiFetch(`${baseUrl}/api/ai/modify-recipe`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal,
  })
}

// ─── AI Chef Chat ─────────────────────────────────────────────

export async function sendChatMessage(
  message: string,
  conversationId?: string,
  recipeId?: string | null,
  signal?: AbortSignal
): Promise<ChatResponse> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const body: Record<string, any> = { message }
  if (conversationId) body.conversationId = conversationId
  if (recipeId) body.recipeId = recipeId

  return safeAiFetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })
}

// ─── Conversation Management ──────────────────────────────────

export async function fetchConversations(): Promise<Conversation[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Conversation[]
}

export async function fetchConversationMessages(
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as ChatMessage[]
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  // Delete messages first (cascade should handle this but being explicit)
  await supabase
    .from('ai_messages')
    .delete()
    .eq('conversation_id', conversationId)

  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    throw new Error(error.message)
  }
}
