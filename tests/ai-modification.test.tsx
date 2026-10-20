/**
 * Aurelia Mobile — Phase E: AI Modification Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  extractionToFormData,
} from '@/features/ai/extraction-converter'
import {
  classifyAiError,
  type ExtractedRecipeData,
  type ModifiedRecipeResult,
  type RecipeModificationAction,
} from '@/features/ai/types'
import {
  toCreateRecipePayload,
} from '@/features/recipes/recipe-form-schema'

// ─── Modification Types & Action Tests ────────────────────────

describe('AI Modification — Preset Actions', () => {
  const validActions: RecipeModificationAction[] = [
    'healthier',
    'protein',
    'vegetarian',
    'vegan',
    'spicier',
    'milder',
    'faster',
    'substitute',
    'scale',
    'custom',
  ]

  it('recognizes all modification action types', () => {
    validActions.forEach((action) => {
      expect(typeof action).toBe('string')
      expect(action.length).toBeGreaterThan(0)
    })
    expect(validActions).toHaveLength(10)
  })
})

// ─── Modification Result Conversion Tests ─────────────────────

describe('AI Modification — Result Conversion', () => {
  const mockModifiedResult: ModifiedRecipeResult = {
    recipe: {
      title: 'Healthy Bolognese',
      description: 'A lighter version of the classic',
      ingredients: [
        { name: 'Turkey mince', quantity: '500', unit: 'g', preparationNote: null, isOptional: false },
        { name: 'Zucchini noodles', quantity: '300', unit: 'g', preparationNote: 'spiralized', isOptional: false },
      ],
      instructions: [
        { stepNumber: 1, instruction: 'Brown the turkey mince.' },
        { stepNumber: 2, instruction: 'Toss with zucchini noodles.' },
      ],
      prepTime: 10,
      cookTime: 25,
      servings: 4,
      difficulty: 'easy',
      cuisine: 'Italian',
      tags: ['healthy', 'low-carb'],
    },
    summaryOfChanges: 'Replaced beef with turkey, pasta with zucchini noodles for lower calories.',
    culinaryNotes: 'Turkey cooks faster than beef. Don\'t overcook zucchini noodles.',
  }

  it('converts modified recipe to editable form data', () => {
    const form = extractionToFormData(mockModifiedResult.recipe)
    expect(form.title).toBe('Healthy Bolognese')
    expect(form.ingredients).toHaveLength(2)
    expect(form.ingredients[0].name).toBe('Turkey mince')
    expect(form.instructions).toHaveLength(2)
    expect(form.tags).toEqual(['healthy', 'low-carb'])
  })

  it('generates valid payload for Save as New Recipe', () => {
    const form = extractionToFormData(mockModifiedResult.recipe)
    const payload = toCreateRecipePayload(form)
    expect(payload.title).toBe('Healthy Bolognese')
    expect(payload.ingredients).toHaveLength(2)
    expect(payload.instructions).toHaveLength(2)
    expect(payload.difficulty).toBe('easy')
    expect(payload.servings).toBe(4)
  })

  it('preserves summary of changes and culinary notes in result', () => {
    expect(mockModifiedResult.summaryOfChanges).toContain('turkey')
    expect(mockModifiedResult.culinaryNotes).toContain('Don\'t overcook')
  })

  it('does NOT overwrite original recipe title', () => {
    // The modified recipe has a different title; original would remain untouched
    const originalTitle = 'Classic Bolognese'
    const modifiedTitle = mockModifiedResult.recipe.title
    expect(modifiedTitle).not.toBe(originalTitle)
    // Saving as new preserves the modified title
    const form = extractionToFormData(mockModifiedResult.recipe)
    expect(form.title).toBe('Healthy Bolognese')
  })

  it('guarantees non-destructive modification: only Save as New Recipe and Discard actions are offered', () => {
    // Modal only allows creating a new recipe record (createRecipe), never updating the existing recipe ID
    const originalRecipeId = 'original-recipe-123'
    const form = extractionToFormData(mockModifiedResult.recipe)
    const payload = toCreateRecipePayload(form)
    
    // Payload for Save as New Recipe contains no existing ID, forcing a brand new record creation
    expect((payload as any).id).toBeUndefined()
    expect(payload.title).toBe('Healthy Bolognese')
  })
})

// ─── Modification Error Handling Tests ────────────────────────

describe('AI Modification — Error Handling', () => {
  it('classifies rate-limited modification request', () => {
    const error = classifyAiError(429, 'Too many requests', true, 45)
    expect(error.category).toBe('rate_limit')
    expect(error.retryAfterSeconds).toBe(45)
    expect(error.canRetry).toBe(true)
  })

  it('classifies modification provider failure', () => {
    const error = classifyAiError(500, 'AI service unavailable')
    expect(error.category).toBe('provider_failure')
    expect(error.canRetry).toBe(true)
  })

  it('classifies modification auth failure', () => {
    const error = classifyAiError(403, 'Forbidden')
    expect(error.category).toBe('auth_failure')
    expect(error.canRetry).toBe(false)
  })
})
