import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HomeScreen from '@/app/(app)/(tabs)/home'
import * as recipeHooks from '@/features/recipes/hooks'

vi.mock('@/features/recipes/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}
vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(app)', '(tabs)', 'home'],
  useLocalSearchParams: () => ({}),
}))

describe('Aurelia Mobile — HomeScreen Suite', () => {
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

  function renderMarkup() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <HomeScreen />
      </QueryClientProvider>
    )
  }

  it('renders loading skeleton state while data is fetching', () => {
    vi.mocked(recipeHooks.useHomeDashboard).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('role="progressbar"')
  })

  it('renders authenticated dashboard data including stats, greeting, upcoming meals and recent recipes', () => {
    vi.mocked(recipeHooks.useHomeDashboard).mockReturnValue({
      data: {
        displayName: 'Chef Julia',
        email: 'julia@child.org',
        stats: { recipeCount: 12, favoriteCount: 5, upcomingMealCount: 3 },
        upcomingMeals: [
          {
            id: 'meal-1',
            user_id: 'u-1',
            recipe_id: 'r-1',
            title: 'Boeuf Bourguignon',
            recipe_image_url_snapshot: null,
            date: '2026-10-01',
            meal_type: 'dinner',
            servings: 4,
            notes: null,
            is_cooked: false,
            recipe: {
              title: 'Boeuf Bourguignon',
              cook_time: 180,
              difficulty: 'hard',
              image_url: null,
            },
          },
        ],
        recentRecipes: [
          {
            id: 'r-1',
            user_id: 'u-1',
            title: 'Boeuf Bourguignon',
            description: 'Classic French braised beef in red wine.',
            image_url: null,
            prep_time: 30,
            cook_time: 180,
            total_time: 210,
            servings: 6,
            difficulty: 'hard',
            cuisine: 'French',
            category: 'Dinner',
            notes: null,
            rating: 5,
            source_url: null,
            is_public: false,
            created_at: '2026-09-30T00:00:00Z',
            updated_at: '2026-09-30T00:00:00Z',
            isFavorite: true,
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    // Greeting contains user display name
    expect(html).toContain('Chef Julia')

    // Stats rendered in summary strip
    expect(html).toContain('12')
    expect(html).toContain('Recipes')
    expect(html).toContain('5')
    expect(html).toContain('Favorites')

    // Upcoming meals section renders meal item
    expect(html).toContain('Upcoming Meals')
    expect(html).toContain('Boeuf Bourguignon')

    // Recent recipes section
    expect(html).toContain('Recent Recipes')
    expect(html).toContain('Classic French braised beef in red wine.')
  })

  it('renders polished empty states when there are no upcoming meals or recipes', () => {
    vi.mocked(recipeHooks.useHomeDashboard).mockReturnValue({
      data: {
        displayName: 'Chef Auguste',
        email: 'auguste@escoffier.fr',
        stats: { recipeCount: 0, favoriteCount: 0, upcomingMealCount: 0 },
        upcomingMeals: [],
        recentRecipes: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('No planned meals')
    expect(html).toContain('Plan a Meal')
    expect(html).toContain('Your cookbook is empty')
    expect(html).toContain('Add First Recipe')
  })

  it('renders quick action buttons for recipe creation, import, AI chef, and meal planning', () => {
    vi.mocked(recipeHooks.useHomeDashboard).mockReturnValue({
      data: {
        displayName: 'Chef',
        email: 'chef@test.com',
        stats: { recipeCount: 0, favoriteCount: 0, upcomingMealCount: 0 },
        upcomingMeals: [],
        recentRecipes: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()

    expect(html).toContain('Add Recipe')
    expect(html).toContain('Import')
    expect(html).toContain('AI Chef')
    expect(html).toContain('Plan Meal')
  })
})
