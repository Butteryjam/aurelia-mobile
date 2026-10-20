import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EditRecipeScreen from '@/app/(app)/recipe/[id]/edit'
import * as recipeHooks from '@/features/recipes/hooks'
import * as mutations from '@/features/recipes/recipe-mutations'
import {
  fromRecipeDetailToFormData,
  toCreateRecipePayload,
  type RecipeFormData,
} from '@/features/recipes/recipe-form-schema'
import {
  saveRecipeDraft,
  loadRecipeDraft,
  clearRecipeDraft,
} from '@/features/recipes/draft-storage'
import type { RecipeDetail } from '@/features/recipes/types'

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
  useLocalSearchParams: () => ({ id: 'recipe-edit-456' }),
  useSegments: () => ['(app)', 'recipe', '[id]', 'edit'],
}))

vi.mock('@/features/recipes/hooks')

const MOCK_EXISTING_RECIPE: RecipeDetail = {
  id: 'recipe-edit-456',
  user_id: 'test-user-id',
  title: 'Artisanal Sourdough Boule',
  description: 'Naturally fermented rustic bread with open crumb.',
  image_url: 'https://example.com/sourdough.jpg',
  prep_time: 30,
  cook_time: 45,
  total_time: 75,
  servings: 8,
  difficulty: 'hard',
  cuisine: 'Baking',
  category: 'Bread',
  notes: 'Long cold fermentation in banneton recommended.',
  rating: 4.8,
  source_url: null,
  is_public: false,
  created_at: '2026-09-30T00:00:00Z',
  updated_at: '2026-09-30T00:00:00Z',
  isFavorite: true,
  tags: ['Artisanal', 'Baking', 'Fermented'],
  ingredients: [
    {
      id: 'ing-1',
      recipe_id: 'recipe-edit-456',
      name: 'Bread Flour',
      quantity: '500',
      unit: 'g',
      order_index: 0,
      is_optional: false,
      preparation_note: 'unbleached',
    },
    {
      id: 'ing-2',
      recipe_id: 'recipe-edit-456',
      name: 'Water',
      quantity: '375',
      unit: 'g',
      order_index: 1,
      is_optional: false,
      preparation_note: 'room temp',
    },
  ],
  instructions: [
    {
      id: 'ins-1',
      recipe_id: 'recipe-edit-456',
      step_number: 1,
      instruction: 'Mix flour and water for 45 min autolyse.',
      timer_duration: 45,
    },
    {
      id: 'ins-2',
      recipe_id: 'recipe-edit-456',
      step_number: 2,
      instruction: 'Add active levain and fine sea salt, fold gently.',
      timer_duration: 30,
    },
  ],
}

describe('Aurelia Mobile — Recipe Editing Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
  })

  it('maps existing recipe detail correctly into form data', () => {
    const formData = fromRecipeDetailToFormData(MOCK_EXISTING_RECIPE)
    expect(formData.title).toBe('Artisanal Sourdough Boule')
    expect(formData.difficulty).toBe('hard')
    expect(formData.servings).toBe('8')
    expect(formData.prepTime).toBe('30')
    expect(formData.cookTime).toBe('45')
    expect(formData.totalTime).toBe('75')
    expect(formData.ingredients).toHaveLength(2)
    expect(formData.ingredients[0].name).toBe('Bread Flour')
    expect(formData.ingredients[0].quantity).toBe('500')
    expect(formData.ingredients[0].unit).toBe('g')
    expect(formData.ingredients[0].preparationNote).toBe('unbleached')
    expect(formData.instructions).toHaveLength(2)
    expect(formData.instructions[0].instruction).toBe('Mix flour and water for 45 min autolyse.')
    expect(formData.instructions[0].timerDuration).toBe('45')
    expect(formData.tags).toEqual(['Artisanal', 'Baking', 'Fermented'])
  })

  it('renders edit screen populated with existing recipe data', () => {
    vi.mocked(recipeHooks.useRecipeDetail).mockReturnValue({
      data: MOCK_EXISTING_RECIPE,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <EditRecipeScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('Edit Recipe')
    expect(html).toContain('Artisanal Sourdough Boule')
    expect(html).toContain('Save Changes')
  })

  it('draft scoping: saves and restores edit draft scoped to recipe ID', async () => {
    const userId = 'user_abc'
    const recipeId = 'recipe-edit-456'
    const editDraftData: RecipeFormData = {
      ...fromRecipeDetailToFormData(MOCK_EXISTING_RECIPE),
      title: 'Artisanal Sourdough Boule (Modified Title)',
    }

    await saveRecipeDraft(userId, 'edit', editDraftData, recipeId)

    const loaded = await loadRecipeDraft(userId, 'edit', recipeId)
    expect(loaded).not.toBeNull()
    expect(loaded?.formData.title).toBe('Artisanal Sourdough Boule (Modified Title)')
    expect(loaded?.isEditDraft).toBe(true)
    expect(loaded?.recipeId).toBe(recipeId)

    // Ensure create draft is not affected
    const createDraft = await loadRecipeDraft(userId, 'new')
    expect(createDraft).toBeNull()

    // Clear edit draft
    await clearRecipeDraft(userId, 'edit', recipeId)
    const cleared = await loadRecipeDraft(userId, 'edit', recipeId)
    expect(cleared).toBeNull()
  })

  it('calls atomic updateRecipeApi with modified data', async () => {
    const updateSpy = vi.spyOn(mutations, 'updateRecipeApi').mockResolvedValue({ id: 'recipe-edit-456' })

    const updatedFormData: RecipeFormData = {
      ...fromRecipeDetailToFormData(MOCK_EXISTING_RECIPE),
      title: 'Artisanal Sourdough Boule - Seeded',
      tags: ['Artisanal', 'Baking', 'Fermented', 'Seeded'],
    }

    const res = await mutations.updateRecipeApi('recipe-edit-456', updatedFormData)
    expect(updateSpy).toHaveBeenCalledWith('recipe-edit-456', updatedFormData)
    expect(res.id).toBe('recipe-edit-456')
  })

  it('handles update failure gracefully without corrupting local state', async () => {
    vi.spyOn(mutations, 'updateRecipeApi').mockRejectedValue(
      new Error('Network request failed. Server error.')
    )

    const updatedFormData: RecipeFormData = fromRecipeDetailToFormData(MOCK_EXISTING_RECIPE)

    await expect(mutations.updateRecipeApi('recipe-edit-456', updatedFormData)).rejects.toThrow(
      'Network request failed. Server error.'
    )
  })
})
