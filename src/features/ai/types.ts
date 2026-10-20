/**
 * Aurelia Mobile — AI Feature Types
 *
 * Mirrors the backend AI schemas for type-safe mobile consumption.
 * No privileged credentials or provider internals exposed.
 */

// ─── Extraction ───────────────────────────────────────────────

export interface ExtractedIngredient {
  name: string
  quantity?: string | null
  unit?: string | null
  preparationNote?: string | null
  isOptional?: boolean
}

export interface ExtractedInstruction {
  stepNumber: number
  instruction: string
  timerDuration?: number | null
}

export interface ExtractedRecipeData {
  title: string
  description?: string | null
  ingredients: ExtractedIngredient[]
  instructions: ExtractedInstruction[]
  prepTime?: number | null
  cookTime?: number | null
  totalTime?: number | null
  servings?: number | null
  difficulty?: 'easy' | 'medium' | 'hard' | null
  cuisine?: string | null
  category?: string | null
  tags?: string[]
  notes?: string | null
  confidenceNotes?: string | null
}

export type ExtractionStage =
  | 'idle'
  | 'preparing'
  | 'extracting'
  | 'structuring'
  | 'ready'
  | 'error'

// ─── Modification ─────────────────────────────────────────────

export type RecipeModificationAction =
  | 'healthier'
  | 'protein'
  | 'vegetarian'
  | 'vegan'
  | 'spicier'
  | 'milder'
  | 'faster'
  | 'substitute'
  | 'scale'
  | 'custom'

export interface RecipeModificationInput {
  recipeId: string
  action: RecipeModificationAction
  customInstruction?: string
  targetServings?: number
  substituteIngredient?: {
    original: string
    replacement: string
  }
}

export interface ModifiedRecipeResult {
  recipe: ExtractedRecipeData
  summaryOfChanges: string
  culinaryNotes?: string | null
}

// ─── Chat / AI Chef ───────────────────────────────────────────

export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  token_count?: number | null
}

export interface RecipeReference {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  cookTime: number | null
  difficulty: string | null
  cuisine: string | null
  category: string | null
}

export interface ChatResponse {
  conversationId: string
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  references?: RecipeReference[]
}

export interface Conversation {
  id: string
  user_id: string
  title: string
  recipe_id: string | null
  created_at: string
  updated_at: string
}

// ─── Error Categories ─────────────────────────────────────────

export type AiErrorCategory =
  | 'rate_limit'
  | 'timeout'
  | 'provider_failure'
  | 'invalid_input'
  | 'auth_failure'
  | 'network_failure'
  | 'unknown'

export interface AiErrorInfo {
  category: AiErrorCategory
  message: string
  retryAfterSeconds?: number
  canRetry: boolean
}

/**
 * Classifies an API error response into a calm, user-friendly category.
 * Never exposes provider internals or API keys.
 */
export function classifyAiError(
  status: number | null,
  errorMessage?: string,
  rateLimited?: boolean,
  retryAfterSeconds?: number
): AiErrorInfo {
  if (rateLimited || status === 429) {
    return {
      category: 'rate_limit',
      message: `Please wait ${retryAfterSeconds ?? 60} seconds before trying again.`,
      retryAfterSeconds: retryAfterSeconds ?? 60,
      canRetry: true,
    }
  }

  if (status === 401 || status === 403) {
    return {
      category: 'auth_failure',
      message: 'Your session has expired. Please sign in again.',
      canRetry: false,
    }
  }

  if (status === 400) {
    return {
      category: 'invalid_input',
      message: errorMessage || 'The input provided was not valid. Please check and try again.',
      canRetry: false,
    }
  }

  if (status === 408 || (errorMessage && /timeout/i.test(errorMessage))) {
    return {
      category: 'timeout',
      message: 'The request took too long. Please try again.',
      canRetry: true,
    }
  }

  if (!status || status === 0) {
    return {
      category: 'network_failure',
      message: 'No network connection. Please check your internet and try again.',
      canRetry: true,
    }
  }

  if (status >= 500) {
    return {
      category: 'provider_failure',
      message: 'Our AI service is temporarily unavailable. Please try again in a moment.',
      canRetry: true,
    }
  }

  return {
    category: 'unknown',
    message: errorMessage || 'Something went wrong. Please try again.',
    canRetry: true,
  }
}
