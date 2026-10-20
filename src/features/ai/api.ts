/**
 * Aurelia Mobile — AI API Client
 *
 * All AI requests go through the authenticated Next.js API backend.
 * Never calls Gemini/OpenAI directly from mobile.
 * Never exposes service-role keys or provider internals.
 */

import { supabase } from '@/lib/supabase'
import type {
  ExtractedRecipeData,
  RecipeModificationInput,
  ModifiedRecipeResult,
  ChatResponse,
  Conversation,
  ChatMessage,
} from './types'

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'
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

// ─── Text Extraction ──────────────────────────────────────────

export async function extractRecipeFromText(
  text: string,
  signal?: AbortSignal
): Promise<ExtractedRecipeData> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/ai/extract-text`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
    signal,
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    const error: any = new Error(json.error || `Extraction failed (${response.status})`)
    error.status = response.status
    error.rateLimited = json.rateLimited
    error.retryAfterSeconds = json.retryAfterSeconds
    throw error
  }

  return json.data
}

// ─── Image Extraction ─────────────────────────────────────────

export async function extractRecipeFromImage(
  base64Data: string,
  mimeType: string = 'image/jpeg',
  signal?: AbortSignal
): Promise<ExtractedRecipeData> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/ai/extract-image`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ base64Data, mimeType }),
    signal,
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    const error: any = new Error(json.error || `Image extraction failed (${response.status})`)
    error.status = response.status
    error.rateLimited = json.rateLimited
    error.retryAfterSeconds = json.retryAfterSeconds
    throw error
  }

  return json.data
}

// ─── Recipe Modification ──────────────────────────────────────

export async function modifyRecipe(
  input: RecipeModificationInput,
  signal?: AbortSignal
): Promise<ModifiedRecipeResult> {
  const headers = await getAuthHeaders()
  const baseUrl = getApiBaseUrl()

  const response = await fetch(`${baseUrl}/api/ai/modify-recipe`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
    signal,
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    const error: any = new Error(json.error || `Modification failed (${response.status})`)
    error.status = response.status
    error.rateLimited = json.rateLimited
    error.retryAfterSeconds = json.retryAfterSeconds
    throw error
  }

  return json.data
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

  const response = await fetch(`${baseUrl}/api/ai/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  const json = await response.json()

  if (!response.ok || json.error) {
    const error: any = new Error(json.error || `Chat failed (${response.status})`)
    error.status = response.status
    error.rateLimited = json.rateLimited
    error.retryAfterSeconds = json.retryAfterSeconds
    throw error
  }

  return json.data
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
