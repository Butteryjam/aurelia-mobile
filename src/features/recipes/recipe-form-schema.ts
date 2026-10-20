import { z } from 'zod'
import type { RecipeDetail } from './types'

export interface IngredientRow {
  id: string
  name: string
  quantity: string
  unit: string
  preparationNote: string
  isOptional: boolean
}

export interface InstructionRow {
  id: string
  instruction: string
  timerDuration: string // minutes input as string for easy phone typing
}

export interface RecipeFormData {
  title: string
  description: string
  cuisine: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | null
  servings: string
  prepTime: string
  cookTime: string
  totalTime: string
  imageUrl: string
  ingredients: IngredientRow[]
  instructions: InstructionRow[]
  tags: string[]
}

export function createEmptyIngredientRow(): IngredientRow {
  return {
    id: `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: '',
    quantity: '',
    unit: '',
    preparationNote: '',
    isOptional: false,
  }
}

export function createEmptyInstructionRow(): InstructionRow {
  return {
    id: `ins_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    instruction: '',
    timerDuration: '',
  }
}

export const initialRecipeFormData: RecipeFormData = {
  title: '',
  description: '',
  cuisine: '',
  category: '',
  difficulty: 'medium',
  servings: '4',
  prepTime: '15',
  cookTime: '30',
  totalTime: '45',
  imageUrl: '',
  ingredients: [createEmptyIngredientRow(), createEmptyIngredientRow()],
  instructions: [createEmptyInstructionRow()],
  tags: [],
}

export interface FormValidationResult {
  isValid: boolean
  errors: Record<string, string>
  firstError: string | null
}

export function validateRecipeForm(data: RecipeFormData): FormValidationResult {
  const errors: Record<string, string> = {}

  // 1. Title validation
  if (!data.title || !data.title.trim()) {
    errors.title = 'Recipe title is required'
  } else if (data.title.trim().length > 200) {
    errors.title = 'Title must be 200 characters or fewer'
  }

  // 2. Servings validation
  if (data.servings && data.servings.trim()) {
    const parsedServings = Number(data.servings)
    if (isNaN(parsedServings) || !Number.isInteger(parsedServings) || parsedServings <= 0) {
      errors.servings = 'Servings must be a positive whole number'
    }
  }

  // 3. Prep Time validation
  if (data.prepTime && data.prepTime.trim()) {
    const parsedPrep = Number(data.prepTime)
    if (isNaN(parsedPrep) || !Number.isInteger(parsedPrep) || parsedPrep < 0) {
      errors.prepTime = 'Prep time must be a valid number of minutes'
    }
  }

  // 4. Cook Time validation
  if (data.cookTime && data.cookTime.trim()) {
    const parsedCook = Number(data.cookTime)
    if (isNaN(parsedCook) || !Number.isInteger(parsedCook) || parsedCook < 0) {
      errors.cookTime = 'Cook time must be a valid number of minutes'
    }
  }

  // 5. Total Time validation
  if (data.totalTime && data.totalTime.trim()) {
    const parsedTotal = Number(data.totalTime)
    if (isNaN(parsedTotal) || !Number.isInteger(parsedTotal) || parsedTotal < 0) {
      errors.totalTime = 'Total time must be a valid number of minutes'
    }
  }

  // 6. Ingredients validation
  const validIngredients = data.ingredients.filter((ing) => ing.name.trim().length > 0)
  if (validIngredients.length === 0) {
    errors.ingredients = 'Please add at least one ingredient with a name'
  } else {
    for (const ing of validIngredients) {
      if (ing.name.trim().length > 200) {
        errors.ingredients = 'Ingredient name must be 200 characters or fewer'
        break
      }
    }
  }

  // 7. Instructions validation
  const validInstructions = data.instructions.filter((ins) => ins.instruction.trim().length > 0)
  if (validInstructions.length === 0) {
    errors.instructions = 'Please add at least one instruction step'
  } else {
    for (const ins of validInstructions) {
      if (ins.instruction.trim().length > 2000) {
        errors.instructions = 'Instruction step must be 2000 characters or fewer'
        break
      }
      if (ins.timerDuration && ins.timerDuration.trim()) {
        const timerNum = Number(ins.timerDuration)
        if (isNaN(timerNum) || timerNum <= 0) {
          errors.instructions = 'Timer duration must be a positive number of minutes'
          break
        }
      }
    }
  }

  const errorKeys = Object.keys(errors)
  const firstError = errorKeys.length > 0 ? errors[errorKeys[0]] : null

  return {
    isValid: errorKeys.length === 0,
    errors,
    firstError,
  }
}

/**
 * Converts mobile form state to the atomic POST /api/recipes payload.
 */
export function toCreateRecipePayload(data: RecipeFormData) {
  const prepTime = data.prepTime.trim() ? parseInt(data.prepTime, 10) : null
  const cookTime = data.cookTime.trim() ? parseInt(data.cookTime, 10) : null
  const totalTime = data.totalTime.trim()
    ? parseInt(data.totalTime, 10)
    : (prepTime || 0) + (cookTime || 0) > 0
      ? (prepTime || 0) + (cookTime || 0)
      : null

  const servings = data.servings.trim() ? parseInt(data.servings, 10) : null

  const ingredients = data.ingredients
    .filter((ing) => ing.name.trim().length > 0)
    .map((ing, idx) => ({
      name: ing.name.trim(),
      quantity: ing.quantity.trim() || null,
      unit: ing.unit.trim() || null,
      orderIndex: idx,
      isOptional: ing.isOptional,
      preparationNote: ing.preparationNote.trim() || null,
    }))

  const instructions = data.instructions
    .filter((ins) => ins.instruction.trim().length > 0)
    .map((ins, idx) => ({
      stepNumber: idx + 1,
      instruction: ins.instruction.trim(),
      timerDuration: ins.timerDuration.trim() ? parseInt(ins.timerDuration, 10) : null,
    }))

  return {
    title: data.title.trim(),
    description: data.description.trim() || null,
    imageUrl: data.imageUrl.trim() || null,
    prepTime: isNaN(prepTime as number) ? null : prepTime,
    cookTime: isNaN(cookTime as number) ? null : cookTime,
    totalTime: isNaN(totalTime as number) ? null : totalTime,
    servings: isNaN(servings as number) ? null : servings,
    difficulty: data.difficulty,
    cuisine: data.cuisine.trim() || null,
    category: data.category.trim() || null,
    tags: data.tags.filter((t) => t.trim().length > 0),
    ingredients,
    instructions,
  }
}

/**
 * Maps a loaded RecipeDetail into editable RecipeFormData.
 */
export function fromRecipeDetailToFormData(detail: RecipeDetail): RecipeFormData {
  const ingredients: IngredientRow[] =
    detail.ingredients && detail.ingredients.length > 0
      ? detail.ingredients.map((ing) => ({
          id: ing.id || `ing_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: ing.name || '',
          quantity: ing.quantity || '',
          unit: ing.unit || '',
          preparationNote: ing.preparation_note || '',
          isOptional: Boolean(ing.is_optional),
        }))
      : [createEmptyIngredientRow()]

  const instructions: InstructionRow[] =
    detail.instructions && detail.instructions.length > 0
      ? detail.instructions.map((ins) => ({
          id: ins.id || `ins_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          instruction: ins.instruction || '',
          timerDuration: ins.timer_duration ? String(ins.timer_duration) : '',
        }))
      : [createEmptyInstructionRow()]

  return {
    title: detail.title || '',
    description: detail.description || '',
    cuisine: detail.cuisine || '',
    category: detail.category || '',
    difficulty: detail.difficulty || 'medium',
    servings: detail.servings ? String(detail.servings) : '',
    prepTime: detail.prep_time != null ? String(detail.prep_time) : '',
    cookTime: detail.cook_time != null ? String(detail.cook_time) : '',
    totalTime: detail.total_time != null ? String(detail.total_time) : '',
    imageUrl: detail.image_url || '',
    ingredients,
    instructions,
    tags: detail.tags || [],
  }
}

/**
 * Computes whether form data has meaningful changes compared to empty state or original state.
 */
export function hasMeaningfulContent(data: RecipeFormData): boolean {
  if (data.title.trim().length > 0) return true
  if (data.description.trim().length > 0) return true
  if (data.imageUrl.trim().length > 0) return true
  if (data.ingredients.some((i) => i.name.trim().length > 0)) return true
  if (data.instructions.some((i) => i.instruction.trim().length > 0)) return true
  if (data.tags.length > 0) return true
  return false
}
