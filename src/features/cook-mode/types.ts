/**
 * Aurelia Mobile — Cook Mode Types
 */

import type { Database } from '@/types/database'
import type { RecipeIngredient, RecipeInstruction, RecipeDetail } from '@/features/recipes/types'

export type CookingSessionRow = Database['public']['Tables']['cooking_sessions']['Row']
export type CookingSessionInsert = Database['public']['Tables']['cooking_sessions']['Insert']

export interface CompleteCookingSessionInput {
  recipeId: string
  startedAt: string
  completedAt: string
  notes?: string | null
  rating?: number | null
}

export interface ActiveTimerState {
  stepNumber: number
  totalDurationSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isFinished: boolean
  targetEndTimestamp: number | null
}

export interface CookModeState {
  currentStepIndex: number
  totalSteps: number
  servings: number
  baseServings: number
  isKeepAwakeActive: boolean
}
