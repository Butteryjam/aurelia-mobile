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
  retryAfterSeconds?: number,
  errorCategory?: string
): AiErrorInfo {
  if (rateLimited || status === 429 || errorCategory === 'quota_exhausted') {
    return {
      category: 'rate_limit',
      message: `Please wait ${retryAfterSeconds ?? 60} seconds before trying again.`,
      retryAfterSeconds: retryAfterSeconds ?? 60,
      canRetry: true,
    }
  }

  if (
    status === 401 ||
    status === 403 ||
    status === 307 ||
    status === 302 ||
    errorCategory === 'auth_failure' ||
    (errorMessage && /login|unauthorized|session expired|bearer/i.test(errorMessage))
  ) {
    return {
      category: 'auth_failure',
      message: 'Your session has expired. Please sign in again.',
      canRetry: false,
    }
  }

  if (status === 400 || errorCategory === 'invalid_input') {
    return {
      category: 'invalid_input',
      message: errorMessage || 'The input provided was not valid. Please check and try again.',
      canRetry: false,
    }
  }

  if (
    status === 408 ||
    status === 504 ||
    errorCategory === 'timeout' ||
    (errorMessage && /timeout|timed out/i.test(errorMessage))
  ) {
    return {
      category: 'timeout',
      message: 'The request took too long. Please try again.',
      canRetry: true,
    }
  }

  if (status === 422 || errorCategory === 'parsing_failure') {
    return {
      category: 'provider_failure',
      message: errorMessage || 'Could not interpret the recipe format. Please try again.',
      canRetry: true,
    }
  }

  if (status === 503 || errorCategory === 'provider_unavailable') {
    return {
      category: 'provider_failure',
      message: errorMessage || 'Our AI service is temporarily unavailable. Please try again in a moment.',
      canRetry: true,
    }
  }

  if (status === 404) {
    return {
      category: 'provider_failure',
      message: 'AI service endpoint is temporarily unavailable. Please try again later.',
      canRetry: true,
    }
  }

  if (status === 405) {
    return {
      category: 'provider_failure',
      message: 'The AI service route refused the request method (405). Please verify backend deployment.',
      canRetry: false,
    }
  }

  if (status && status >= 500) {
    return {
      category: 'provider_failure',
      message: errorMessage || 'Our AI service is temporarily unavailable. Please try again in a moment.',
      canRetry: true,
    }
  }

  // Distinguish genuine network disconnections from parse/syntax errors
  const isSyntaxOrParseError = Boolean(
    errorMessage &&
      /json parse|unexpected (end|token)|syntaxerror|malformed/i.test(errorMessage)
  )

  if (isSyntaxOrParseError) {
    return {
      category: 'provider_failure',
      message: 'Unable to process server response. Please try again in a moment.',
      canRetry: true,
    }
  }

  // Network failures: status is 0 or null, and error is connection/network-related
  if (status === 0 || !status) {
    return {
      category: 'network_failure',
      message: 'No network connection. Please check your internet and try again.',
      canRetry: true,
    }
  }

  return {
    category: 'unknown',
    message: errorMessage || 'Something went wrong. Please try again.',
    canRetry: true,
  }
}
