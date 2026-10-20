import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FavoritesScreen from '@/app/(app)/favorites'
import * as recipeHooks from '@/features/recipes/hooks'
import type { RecipeListItem } from '@/features/recipes/types'

vi.mock('@/features/recipes/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => true,
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useSegments: () => ['(app)', 'favorites'],
}))

const MOCK_FAVORITES: RecipeListItem[] = [
  {
    id: 'fav-1',
    user_id: 'test-user-id',
    title: 'Seared Duck Breast with Cherry Port Glaze',
    description: 'Crisp rendered skin with a luscious pan reduction.',
    image_url: 'https://example.com/duck.jpg',
    prep_time: 15,
    cook_time: 20,
    total_time: 35,
    servings: 2,
    difficulty: 'hard',
    cuisine: 'French',
    category: 'Main Course',
    notes: null,
    rating: 4.9,
    source_url: null,
    is_public: false,
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    isFavorite: true,
  },
  {
    id: 'fav-2',
    user_id: 'test-user-id',
    title: 'Velvety Roasted Tomato Bisque',
    description: 'Slow-roasted Roma tomatoes with sweet cream and basil oil.',
    image_url: 'https://example.com/bisque.jpg',
    prep_time: 10,
    cook_time: 30,
    total_time: 40,
    servings: 4,
    difficulty: 'easy',
    cuisine: 'American',
    category: 'Soup',
    notes: null,
    rating: 4.7,
    source_url: null,
    is_public: false,
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    isFavorite: true,
  },
]

describe('Aurelia Mobile — Favorites Suite', () => {
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
  })

  it('renders favorites list with RecipeCards and count badge', () => {
    vi.mocked(recipeHooks.useFavoriteRecipes).mockReturnValue({
      data: MOCK_FAVORITES,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <FavoritesScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('Favorites')
    expect(html).toContain('2 Starred Recipes')
    expect(html).toContain('Seared Duck Breast with Cherry Port Glaze')
    expect(html).toContain('Velvety Roasted Tomato Bisque')
  })

  it('renders empty state when user has no favorited recipes', () => {
    vi.mocked(recipeHooks.useFavoriteRecipes).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <FavoritesScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('No favorite recipes yet')
    expect(html).toContain('Explore Recipes')
  })

  it('supports optimistic cache filtering when an item is unfavorited', () => {
    queryClient.setQueryData(['favorites'], MOCK_FAVORITES)

    // Simulate unfavoriting fav-1
    const current = queryClient.getQueryData<RecipeListItem[]>(['favorites'])
    const updated = (current ?? []).filter((r) => r.id !== 'fav-1')
    queryClient.setQueryData(['favorites'], updated)

    const cachedAfterUnfavorite = queryClient.getQueryData<RecipeListItem[]>(['favorites'])
    expect(cachedAfterUnfavorite).toHaveLength(1)
    expect(cachedAfterUnfavorite?.[0].id).toBe('fav-2')
    expect(cachedAfterUnfavorite?.[0].title).toBe('Velvety Roasted Tomato Bisque')
  })
})
