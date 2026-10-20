/**
 * Aurelia Mobile — AI Extraction → RecipeFormData Converter
 *
 * Converts raw AI extraction results into the mobile form data model
 * so users can edit the extracted recipe before saving.
 */

import type { ExtractedRecipeData } from './types'
import type { RecipeFormData, IngredientRow, InstructionRow } from '@/features/recipes/recipe-form-schema'
import { createEmptyIngredientRow, createEmptyInstructionRow } from '@/features/recipes/recipe-form-schema'

/**
 * Converts an AI extraction result into an editable RecipeFormData.
 */
export function extractionToFormData(extracted: ExtractedRecipeData): RecipeFormData {
  const ingredients: IngredientRow[] =
    extracted.ingredients && extracted.ingredients.length > 0
      ? extracted.ingredients.map((ing, idx) => ({
          id: `ing_ext_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          name: ing.name || '',
          quantity: ing.quantity || '',
          unit: ing.unit || '',
          preparationNote: ing.preparationNote || '',
          isOptional: Boolean(ing.isOptional),
        }))
      : [createEmptyIngredientRow()]

  const instructions: InstructionRow[] =
    extracted.instructions && extracted.instructions.length > 0
      ? extracted.instructions.map((ins, idx) => ({
          id: `ins_ext_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          instruction: ins.instruction || '',
          timerDuration: ins.timerDuration ? String(ins.timerDuration) : '',
        }))
      : [createEmptyInstructionRow()]

  const totalTime = extracted.totalTime
    ?? ((extracted.prepTime || 0) + (extracted.cookTime || 0) > 0
        ? (extracted.prepTime || 0) + (extracted.cookTime || 0)
        : null)

  return {
    title: extracted.title || '',
    description: extracted.description || '',
    cuisine: extracted.cuisine || '',
    category: extracted.category || '',
    difficulty: extracted.difficulty || 'medium',
    servings: extracted.servings ? String(extracted.servings) : '4',
    prepTime: extracted.prepTime != null ? String(extracted.prepTime) : '',
    cookTime: extracted.cookTime != null ? String(extracted.cookTime) : '',
    totalTime: totalTime != null ? String(totalTime) : '',
    imageUrl: '',
    ingredients,
    instructions,
    tags: extracted.tags || [],
  }
}
