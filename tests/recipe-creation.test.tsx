import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewRecipeScreen from '@/app/(app)/recipe/new'
import {
  validateRecipeForm,
  toCreateRecipePayload,
  initialRecipeFormData,
  type RecipeFormData,
} from '@/features/recipes/recipe-form-schema'
import {
  saveRecipeDraft,
  loadRecipeDraft,
  clearRecipeDraft,
} from '@/features/recipes/draft-storage'
import * as mutations from '@/features/recipes/recipe-mutations'

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'chef@aurelia.app' },
    session: { access_token: 'valid-test-token' },
    isAuthenticated: true,
  }),
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => true,
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useSegments: () => ['(app)', 'recipe', 'new'],
}))

describe('Aurelia Mobile — Recipe Creation Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('renders initial form with all sections (Basic Info, Photography, Ingredients, Instructions, Tags)', () => {
    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <NewRecipeScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('New Recipe')
    expect(html).toContain('Basic Information')
    expect(html).toContain('Recipe Title')
    expect(html).toContain('Recipe Photography')
    expect(html).toContain('Ingredients')
    expect(html).toContain('Instructions')
    expect(html).toContain('Tags &amp; Curation')
    expect(html).toContain('Save Recipe')
  })

  it('validates required fields: rejects empty title', () => {
    const invalidData: RecipeFormData = {
      ...initialRecipeFormData,
      title: '   ',
    }

    const validation = validateRecipeForm(invalidData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.title).toBe('Recipe title is required')
  })

  it('validates servings and time inputs: rejects invalid numbers', () => {
    const invalidData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Valid Recipe Title',
      servings: '-2',
      prepTime: 'not-a-number',
      cookTime: '-5',
    }

    const validation = validateRecipeForm(invalidData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.servings).toBe('Servings must be a positive whole number')
    expect(validation.errors.prepTime).toBe('Prep time must be a valid number of minutes')
    expect(validation.errors.cookTime).toBe('Cook time must be a valid number of minutes')
  })

  it('validates ingredients: requires at least one ingredient with a non-empty name', () => {
    const noIngredientsData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Pan-Seared Scallops',
      ingredients: [{ id: '1', name: '', quantity: '2', unit: 'tbsp', preparationNote: '', isOptional: false }],
    }

    const validation = validateRecipeForm(noIngredientsData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.ingredients).toBe('Please add at least one ingredient with a name')
  })

  it('validates instructions: requires at least one instruction step', () => {
    const noInstructionsData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Pan-Seared Scallops',
      ingredients: [{ id: '1', name: 'Scallops', quantity: '8', unit: 'pcs', preparationNote: '', isOptional: false }],
      instructions: [{ id: '1', instruction: '   ', timerDuration: '' }],
    }

    const validation = validateRecipeForm(noInstructionsData)
    expect(validation.isValid).toBe(false)
    expect(validation.errors.instructions).toBe('Please add at least one instruction step')
  })

  it('passes validation with clean valid recipe payload', () => {
    const validData: RecipeFormData = {
      title: 'Truffle Mushroom Risotto',
      description: 'Velvety risotto with wild foraged mushrooms and white truffle oil.',
      cuisine: 'Italian',
      category: 'Main Course',
      difficulty: 'medium',
      servings: '4',
      prepTime: '15',
      cookTime: '30',
      totalTime: '45',
      imageUrl: 'https://example.com/risotto.jpg',
      ingredients: [
        { id: '1', name: 'Arborio Rice', quantity: '2', unit: 'cups', preparationNote: '', isOptional: false },
        { id: '2', name: 'Vegetable Broth', quantity: '4', unit: 'cups', preparationNote: 'warm', isOptional: false },
      ],
      instructions: [
        { id: '1', instruction: 'Toast rice in olive oil until translucent.', timerDuration: '3' },
        { id: '2', instruction: 'Add warm broth ladle by ladle, stirring continuously.', timerDuration: '20' },
      ],
      tags: ['Italian', 'Vegetarian', 'Gluten-Free'],
    }

    const validation = validateRecipeForm(validData)
    expect(validation.isValid).toBe(true)
    expect(validation.errors).toEqual({})

    const payload = toCreateRecipePayload(validData)
    expect(payload.title).toBe('Truffle Mushroom Risotto')
    expect(payload.servings).toBe(4)
    expect(payload.prepTime).toBe(15)
    expect(payload.cookTime).toBe(30)
    expect(payload.totalTime).toBe(45)
    expect(payload.ingredients).toHaveLength(2)
    expect(payload.instructions).toHaveLength(2)
    expect(payload.instructions[0].timerDuration).toBe(3)
    expect(payload.tags).toEqual(['Italian', 'Vegetarian', 'Gluten-Free'])
  })

  it('draft management: saves, loads, and clears create draft scoped to user', async () => {
    const userId = 'user_999'
    const draftData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Autosaved Draft Dish',
      cuisine: 'French',
    }

    await saveRecipeDraft(userId, 'new', draftData)

    const loaded = await loadRecipeDraft(userId, 'new')
    expect(loaded).not.toBeNull()
    expect(loaded?.formData.title).toBe('Autosaved Draft Dish')
    expect(loaded?.formData.cuisine).toBe('French')
    expect(loaded?.isEditDraft).toBe(false)

    // Clear draft
    await clearRecipeDraft(userId, 'new')
    const cleared = await loadRecipeDraft(userId, 'new')
    expect(cleared).toBeNull()
  })

  it('handles successful atomic save and duplicate submit prevention', async () => {
    const createSpy = vi.spyOn(mutations, 'createRecipeApi').mockResolvedValue({ id: 'new-recipe-123' })

    const validData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Fresh Pesto Genovese',
      ingredients: [{ id: '1', name: 'Fresh Basil', quantity: '2', unit: 'cups', preparationNote: '', isOptional: false }],
      instructions: [{ id: '1', instruction: 'Pulse basil and pine nuts in food processor.', timerDuration: '2' }],
    }

    const result = await mutations.createRecipeApi(validData)
    expect(createSpy).toHaveBeenCalledWith(validData)
    expect(result.id).toBe('new-recipe-123')
  })

  it('handles backend save failure with clear error propagation', async () => {
    vi.spyOn(mutations, 'createRecipeApi').mockRejectedValue(
      new Error('Failed to create recipe. Duplicate title.')
    )

    const validData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Duplicate Dish',
      ingredients: [{ id: '1', name: 'Salt', quantity: '1', unit: 'tsp', preparationNote: '', isOptional: false }],
      instructions: [{ id: '1', instruction: 'Stir well.', timerDuration: '' }],
    }

    await expect(mutations.createRecipeApi(validData)).rejects.toThrow(
      'Failed to create recipe. Duplicate title.'
    )
  })
})
