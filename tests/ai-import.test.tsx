/**
 * Aurelia Mobile — Phase E: AI Import Tests
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
} from '@/features/ai/types'
import {
  validateRecipeForm,
  toCreateRecipePayload,
  type RecipeFormData,
} from '@/features/recipes/recipe-form-schema'

// ─── Extraction Converter Tests ───────────────────────────────

describe('AI Import — Extraction Converter', () => {
  const sampleExtraction: ExtractedRecipeData = {
    title: 'Classic Bolognese',
    description: 'Rich Italian meat sauce',
    ingredients: [
      { name: 'Ground beef', quantity: '500', unit: 'g', preparationNote: null, isOptional: false },
      { name: 'Onion', quantity: '1', unit: 'large', preparationNote: 'diced', isOptional: false },
      { name: 'Parmesan', quantity: '50', unit: 'g', preparationNote: 'grated', isOptional: true },
    ],
    instructions: [
      { stepNumber: 1, instruction: 'Brown the ground beef in a large pan.', timerDuration: 8 },
      { stepNumber: 2, instruction: 'Add onion and cook until translucent.', timerDuration: 5 },
      { stepNumber: 3, instruction: 'Simmer for 2 hours on low heat.', timerDuration: 120 },
    ],
    prepTime: 15,
    cookTime: 135,
    servings: 6,
    difficulty: 'medium',
    cuisine: 'Italian',
    category: 'Main Course',
    tags: ['pasta', 'comfort-food'],
  }

  it('converts extraction to RecipeFormData with correct title and metadata', () => {
    const form = extractionToFormData(sampleExtraction)
    expect(form.title).toBe('Classic Bolognese')
    expect(form.description).toBe('Rich Italian meat sauce')
    expect(form.cuisine).toBe('Italian')
    expect(form.category).toBe('Main Course')
    expect(form.difficulty).toBe('medium')
    expect(form.servings).toBe('6')
    expect(form.prepTime).toBe('15')
    expect(form.cookTime).toBe('135')
  })

  it('converts ingredients with all fields preserved', () => {
    const form = extractionToFormData(sampleExtraction)
    expect(form.ingredients).toHaveLength(3)
    expect(form.ingredients[0].name).toBe('Ground beef')
    expect(form.ingredients[0].quantity).toBe('500')
    expect(form.ingredients[0].unit).toBe('g')
    expect(form.ingredients[2].isOptional).toBe(true)
    expect(form.ingredients[1].preparationNote).toBe('diced')
  })

  it('converts instructions with timer durations', () => {
    const form = extractionToFormData(sampleExtraction)
    expect(form.instructions).toHaveLength(3)
    expect(form.instructions[0].instruction).toBe('Brown the ground beef in a large pan.')
    expect(form.instructions[0].timerDuration).toBe('8')
    expect(form.instructions[2].timerDuration).toBe('120')
  })

  it('preserves tags', () => {
    const form = extractionToFormData(sampleExtraction)
    expect(form.tags).toEqual(['pasta', 'comfort-food'])
  })

  it('handles empty extraction with defaults', () => {
    const empty: ExtractedRecipeData = {
      title: '',
      ingredients: [],
      instructions: [],
    }
    const form = extractionToFormData(empty)
    expect(form.title).toBe('')
    expect(form.ingredients.length).toBeGreaterThanOrEqual(1)
    expect(form.instructions.length).toBeGreaterThanOrEqual(1)
    expect(form.difficulty).toBe('medium')
    expect(form.servings).toBe('4')
  })

  it('calculates total time from prep + cook when not provided', () => {
    const partial: ExtractedRecipeData = {
      title: 'Quick Pasta',
      ingredients: [{ name: 'Pasta', quantity: '200', unit: 'g' }],
      instructions: [{ stepNumber: 1, instruction: 'Cook pasta' }],
      prepTime: 5,
      cookTime: 10,
    }
    const form = extractionToFormData(partial)
    expect(form.totalTime).toBe('15')
  })
})

// ─── Extraction Validation Tests ──────────────────────────────

describe('AI Import — Extracted Form Validation', () => {
  it('validates a well-formed extracted recipe as valid', () => {
    const extraction: ExtractedRecipeData = {
      title: 'Test Recipe',
      ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
      instructions: [{ stepNumber: 1, instruction: 'Add salt.' }],
      servings: 4,
    }
    const form = extractionToFormData(extraction)
    const result = validateRecipeForm(form)
    expect(result.isValid).toBe(true)
  })

  it('rejects extraction with no title', () => {
    const extraction: ExtractedRecipeData = {
      title: '',
      ingredients: [{ name: 'Salt', quantity: '1', unit: 'tsp' }],
      instructions: [{ stepNumber: 1, instruction: 'Add salt.' }],
    }
    const form = extractionToFormData(extraction)
    const result = validateRecipeForm(form)
    expect(result.isValid).toBe(false)
    expect(result.errors.title).toBeDefined()
  })

  it('generates valid POST payload from extraction', () => {
    const extraction: ExtractedRecipeData = {
      title: 'AI Imported Recipe',
      description: 'Extracted by AI',
      ingredients: [{ name: 'Flour', quantity: '2', unit: 'cups' }],
      instructions: [{ stepNumber: 1, instruction: 'Mix flour with water.' }],
      servings: 4,
      prepTime: 10,
      cookTime: 20,
      difficulty: 'easy',
      tags: ['baking'],
    }
    const form = extractionToFormData(extraction)
    const payload = toCreateRecipePayload(form)
    expect(payload.title).toBe('AI Imported Recipe')
    expect(payload.ingredients).toHaveLength(1)
    expect(payload.ingredients[0].name).toBe('Flour')
    expect(payload.instructions).toHaveLength(1)
    expect(payload.tags).toEqual(['baking'])
    expect(payload.servings).toBe(4)
  })
})

// ─── Error Classification Tests ───────────────────────────────

describe('AI Import — Error Classification', () => {
  it('classifies rate limit error', () => {
    const result = classifyAiError(429, 'Too many requests', true, 30)
    expect(result.category).toBe('rate_limit')
    expect(result.canRetry).toBe(true)
    expect(result.retryAfterSeconds).toBe(30)
  })

  it('classifies auth failure', () => {
    const result = classifyAiError(401, 'Unauthorized')
    expect(result.category).toBe('auth_failure')
    expect(result.canRetry).toBe(false)
  })

  it('classifies network failure', () => {
    const result = classifyAiError(null, 'Network error')
    expect(result.category).toBe('network_failure')
    expect(result.canRetry).toBe(true)
  })

  it('classifies server error', () => {
    const result = classifyAiError(500, 'Internal server error')
    expect(result.category).toBe('provider_failure')
    expect(result.canRetry).toBe(true)
  })

  it('classifies timeout error', () => {
    const result = classifyAiError(408, 'Request timeout')
    expect(result.category).toBe('timeout')
    expect(result.canRetry).toBe(true)
  })

  it('classifies invalid input error', () => {
    const result = classifyAiError(400, 'Text too short')
    expect(result.category).toBe('invalid_input')
    expect(result.canRetry).toBe(false)
    expect(result.message).toBe('Text too short')
  })
})
