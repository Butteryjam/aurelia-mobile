import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecipeDetailScreen from '@/app/(app)/recipe/[id]/index'
import * as recipeHooks from '@/features/recipes/hooks'
import type { RecipeDetail } from '@/features/recipes/types'

vi.mock('@/features/recipes/hooks')

vi.mock('@/features/auth/auth-context', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'chef@aurelia.app' },
    session: null,
    isLoading: false,
    error: null,
    recoveryActive: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    sendPasswordReset: vi.fn(),
    updatePassword: vi.fn(),
    handleDeepLinkUrl: vi.fn(),
    verifyOtp: vi.fn(),
    clearError: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => true,
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'recipe-test-123' }),
  useSegments: () => ['(app)', 'recipe', '[id]'],
}))

const MOCK_RECIPE_DETAIL: RecipeDetail = {
  id: 'recipe-test-123',
  user_id: 'user-1',
  title: 'Classic Risotto alla Milanese',
  description: 'Rich, saffron-infused arborio rice finished with Parmigiano-Reggiano.',
  image_url: 'https://images.unsplash.com/photo-test',
  prep_time: 10,
  cook_time: 25,
  total_time: 35,
  servings: 4,
  difficulty: 'medium',
  cuisine: 'Italian',
  category: 'Primi',
  notes: 'Use homemade chicken bone broth for deepest flavor.',
  rating: 4.9,
  source_url: null,
  is_public: false,
  created_at: '2026-09-30T00:00:00Z',
  updated_at: '2026-09-30T00:00:00Z',
  isFavorite: false,
  tags: ['Gluten-Free', 'Comfort Food'],
  ingredients: [
    {
      id: 'ing-1',
      recipe_id: 'recipe-test-123',
      name: 'carnaroli or arborio rice',
      quantity: '2',
      unit: 'cups',
      order_index: 0,
      is_optional: false,
      preparation_note: null,
    },
    {
      id: 'ing-2',
      recipe_id: 'recipe-test-123',
      name: 'saffron threads',
      quantity: '1/2',
      unit: 'tsp',
      order_index: 1,
      is_optional: false,
      preparation_note: 'steeped in warm broth',
    },
    {
      id: 'ing-3',
      recipe_id: 'recipe-test-123',
      name: 'dry white wine',
      quantity: '1/2',
      unit: 'cup',
      order_index: 2,
      is_optional: true,
      preparation_note: null,
    },
  ],
  instructions: [
    {
      id: 'inst-1',
      recipe_id: 'recipe-test-123',
      step_number: 1,
      instruction: 'Bring broth to a gentle simmer in a saucepan and keep warm.',
      timer_duration: 5,
    },
    {
      id: 'inst-2',
      recipe_id: 'recipe-test-123',
      step_number: 2,
      instruction: 'Toast the rice in melted butter and olive oil until translucent around the edges.',
      timer_duration: 3,
    },
  ],
}

describe('Aurelia Mobile — RecipeDetailScreen Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(recipeHooks.useToggleFavorite).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(recipeHooks.useDeleteRecipe).mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)
  })

  function renderMarkup() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <RecipeDetailScreen />
      </QueryClientProvider>
    )
  }

  it('renders loading state while recipe is being fetched', () => {
    vi.mocked(recipeHooks.useRecipeDetail).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as any)

    const html = renderMarkup()
    expect(html).toContain('role="progressbar"')
  })

  it('renders full recipe details, metadata, ingredients, instructions and notes', () => {
    vi.mocked(recipeHooks.useRecipeDetail).mockReturnValue({
      data: MOCK_RECIPE_DETAIL,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    const html = renderMarkup()

    // Title and Description
    expect(html).toContain('Classic Risotto alla Milanese')
    expect(html).toContain('Rich, saffron-infused arborio rice finished with Parmigiano-Reggiano.')

    // Metadata
    expect(html).toContain('PREP')
    expect(html).toContain('10m')
    expect(html).toContain('COOK')
    expect(html).toContain('25m')
    expect(html).toContain('Medium')

    // Ingredients
    expect(html).toContain('Ingredients')
    expect(html).toContain('carnaroli or arborio rice')
    expect(html).toContain('saffron threads')
    expect(html).toContain('steeped in warm broth')

    // Instructions
    expect(html).toContain('Instructions')
    expect(html).toContain('Bring broth to a gentle simmer in a saucepan and keep warm.')
    expect(html).toContain('Toast the rice in melted butter and olive oil until translucent around the edges.')
    expect(html).toContain('5 min timer')

    // Chef's notes
    expect(html).toContain("Chef&#x27;s Notes &amp; Advice")
    expect(html).toContain('Use homemade chicken bone broth for deepest flavor.')

    // Cook mode button
    expect(html).toContain('Start Cook Mode')
  })

  it('renders error empty state when recipe fails to load', () => {
    vi.mocked(recipeHooks.useRecipeDetail).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Recipe not found')
    expect(html).toContain('All Recipes')
  })
})
