import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import RecipesTabScreen from '@/app/(app)/(tabs)/recipes'
import * as recipeHooks from '@/features/recipes/hooks'
import type { RecipeListItem } from '@/features/recipes/types'

vi.mock('@/features/recipes/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}
vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(app)', '(tabs)', 'recipes'],
  useLocalSearchParams: () => ({}),
}))

const MOCK_RECIPES: RecipeListItem[] = [
  {
    id: 'r-1',
    user_id: 'u-1',
    title: 'Tuscan White Bean Soup',
    description: 'Creamy cannellini soup with rosemary.',
    image_url: null,
    prep_time: 15,
    cook_time: 25,
    total_time: 40,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'Italian',
    category: 'Soup',
    notes: null,
    rating: 4.8,
    source_url: null,
    is_public: false,
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    isFavorite: true,
  },
  {
    id: 'r-2',
    user_id: 'u-1',
    title: 'Beef Wellington',
    description: 'Tender beef fillet wrapped in prosciutto and puff pastry.',
    image_url: null,
    prep_time: 45,
    cook_time: 50,
    total_time: 95,
    servings: 6,
    difficulty: 'hard',
    cuisine: 'British',
    category: 'Dinner',
    notes: null,
    rating: 5.0,
    source_url: null,
    is_public: false,
    created_at: '2026-09-29T00:00:00Z',
    updated_at: '2026-09-29T00:00:00Z',
    isFavorite: false,
  },
]

describe('Aurelia Mobile — RecipesTabScreen Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(recipeHooks.useRecipeFilterOptions).mockReturnValue({
      data: {
        cuisines: ['Italian', 'British', 'French'],
        categories: ['Soup', 'Dinner', 'Dessert'],
        difficulties: ['easy', 'medium', 'hard'],
      },
      isLoading: false,
      isError: false,
    } as any)

    vi.mocked(recipeHooks.useToggleFavorite).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)
  })

  function renderMarkup() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <RecipesTabScreen />
      </QueryClientProvider>
    )
  }

  it('renders recipe library and cards with cook times, titles and tags', () => {
    vi.mocked(recipeHooks.useRecipes).mockReturnValue({
      data: MOCK_RECIPES,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Recipes')
    expect(html).toContain('Tuscan White Bean Soup')
    expect(html).toContain('25 min')
    expect(html).toContain('Beef Wellington')
    expect(html).toContain('50 min')
    expect(html).toContain('Italian')
  })

  it('renders search bar and filter trigger button', () => {
    vi.mocked(recipeHooks.useRecipes).mockReturnValue({
      data: MOCK_RECIPES,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Search recipes, ingredients...')
    expect(html).toContain('aria-label="Filter recipes. 0 active filters."')
  })

  it('renders sort option and quick filter pills', () => {
    vi.mocked(recipeHooks.useRecipes).mockReturnValue({
      data: MOCK_RECIPES,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Newest First')
    expect(html).toContain('★ Favorites')
    expect(html).toContain('&lt; 30 min')
  })

  it('renders empty state when recipe catalog has no recipes', () => {
    vi.mocked(recipeHooks.useRecipes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Your vault is empty')
    expect(html).toContain('Create Recipe')
  })
})
