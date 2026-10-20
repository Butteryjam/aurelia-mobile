/**
 * Aurelia Mobile — Meal Planner Types
 */

import type { Database, Json } from '@/types/database'

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type MealPlanItemRow = Database['public']['Tables']['meal_plan_items']['Row']

export interface MealPlanRecipeSummary {
  id: string
  title: string
  image_url: string | null
  prep_time: number | null
  cook_time: number | null
  total_time: number | null
  servings: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  cuisine: string | null
  nutrition_facts: Json
}

export interface MealPlanItemWithRecipe extends MealPlanItemRow {
  recipe?: MealPlanRecipeSummary | null
}

export interface DayMeals {
  date: string // YYYY-MM-DD
  dayName: string // e.g. "Monday"
  dayShort: string // e.g. "Mon"
  dayNumber: number // e.g. 21
  monthShort: string // e.g. "Sep"
  isToday: boolean
  slots: {
    breakfast: MealPlanItemWithRecipe[]
    lunch: MealPlanItemWithRecipe[]
    dinner: MealPlanItemWithRecipe[]
    snack: MealPlanItemWithRecipe[]
  }
}

export interface DayNutritionSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  hasData: boolean
}

export interface WeekRange {
  startDate: string // YYYY-MM-DD (Monday)
  endDate: string // YYYY-MM-DD (Sunday)
  formattedRange: string // "Sep 21 – Sep 27, 2026"
  prevWeekDate: string
  nextWeekDate: string
  currentWeekDate: string
}

export interface AddMealPlanItemInput {
  date: string
  mealType: MealType
  recipeId?: string | null
  customTitle?: string | null
  servings?: number
  notes?: string | null
}

export interface UpdateMealPlanItemInput {
  id: string
  date?: string
  mealType?: MealType
  servings?: number
  notes?: string | null
  isCooked?: boolean
}
