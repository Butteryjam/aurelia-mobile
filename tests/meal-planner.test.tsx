import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PlannerTabScreen from '@/app/(app)/(tabs)/planner'
import * as mealPlannerHooks from '@/features/meal-planner/hooks'
import {
  formatDateToISO,
  getWeekRange,
  calculateDayNutrition,
} from '@/features/meal-planner/utils'
import { DayMeals, MealPlanItemWithRecipe } from '@/features/meal-planner/types'

vi.mock('@/features/meal-planner/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}
vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(app)', '(tabs)', 'planner'],
  useLocalSearchParams: () => ({}),
}))

describe('Aurelia Mobile — Meal Planner Suite', () => {
  let queryClient: QueryClient

  const mockAddMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }
  const mockUpdateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }
  const mockToggleCookedMutation = {
    mutate: vi.fn(),
    isPending: false,
  }
  const mockDeleteMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  const samplePlannedMeal: MealPlanItemWithRecipe = {
    id: 'meal-1',
    user_id: 'test-user-id',
    cooking_session_id: null,
    meal_plan_id: null,
    recipe_id: 'recipe-101',
    title: 'Herb Butter Salmon',
    recipe_image_url_snapshot: 'https://example.com/salmon.jpg',
    date: '2026-09-28',
    meal_type: 'dinner',
    servings: 4,
    notes: 'Use wild sockeye salmon if available',
    is_cooked: false,
    order_index: 0,
    created_at: '2026-09-28T10:00:00Z',
    updated_at: '2026-09-28T10:00:00Z',
    recipe: {
      id: 'recipe-101',
      title: 'Herb Butter Salmon',
      image_url: 'https://example.com/salmon.jpg',
      servings: 2,
      prep_time: 15,
      cook_time: 20,
      total_time: 35,
      difficulty: 'medium',
      cuisine: 'French',
      nutrition_facts: {
        calories: 520,
        protein_g: 44,
        carbs_g: 6,
        fat_g: 32,
      },
    },
  }

  const sampleCookedMeal: MealPlanItemWithRecipe = {
    id: 'meal-2',
    user_id: 'test-user-id',
    cooking_session_id: null,
    meal_plan_id: null,
    recipe_id: 'recipe-102',
    title: 'Avocado Toast & Poached Egg',
    recipe_image_url_snapshot: null,
    date: '2026-09-28',
    meal_type: 'breakfast',
    servings: 2,
    notes: null,
    is_cooked: true,
    order_index: 0,
    created_at: '2026-09-28T08:00:00Z',
    updated_at: '2026-09-28T08:30:00Z',
    recipe: {
      id: 'recipe-102',
      title: 'Avocado Toast & Poached Egg',
      image_url: null,
      servings: 1,
      prep_time: 10,
      cook_time: 5,
      total_time: 15,
      difficulty: 'easy',
      cuisine: 'American',
      nutrition_facts: {
        calories: 310,
        protein_g: 14,
        carbs_g: 22,
        fat_g: 18,
      },
    },
  }

  const sampleWeekDays: DayMeals[] = [
    {
      date: '2026-09-28',
      dayName: 'Monday',
      dayShort: 'Mon',
      dayNumber: 28,
      monthShort: 'Sep',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
    {
      date: '2026-09-29',
      dayName: 'Tuesday',
      dayShort: 'Tue',
      dayNumber: 29,
      monthShort: 'Sep',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
    {
      date: '2026-09-30',
      dayName: 'Wednesday',
      dayShort: 'Wed',
      dayNumber: 30,
      monthShort: 'Sep',
      isToday: true,
      slots: {
        breakfast: [sampleCookedMeal],
        lunch: [],
        dinner: [samplePlannedMeal],
        snack: [],
      },
    },
    {
      date: '2026-10-01',
      dayName: 'Thursday',
      dayShort: 'Thu',
      dayNumber: 1,
      monthShort: 'Oct',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
    {
      date: '2026-10-02',
      dayName: 'Friday',
      dayShort: 'Fri',
      dayNumber: 2,
      monthShort: 'Oct',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
    {
      date: '2026-10-03',
      dayName: 'Saturday',
      dayShort: 'Sat',
      dayNumber: 3,
      monthShort: 'Oct',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
    {
      date: '2026-10-04',
      dayName: 'Sunday',
      dayShort: 'Sun',
      dayNumber: 4,
      monthShort: 'Oct',
      isToday: false,
      slots: { breakfast: [], lunch: [], dinner: [], snack: [] },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(mealPlannerHooks.useAddMealPlanItem).mockReturnValue(mockAddMutation as any)
    vi.mocked(mealPlannerHooks.useUpdateMealPlanItem).mockReturnValue(mockUpdateMutation as any)
    vi.mocked(mealPlannerHooks.useToggleMealCooked).mockReturnValue(mockToggleCookedMutation as any)
    vi.mocked(mealPlannerHooks.useDeleteMealPlanItem).mockReturnValue(mockDeleteMutation as any)
    vi.mocked(mealPlannerHooks.useRecipesForMealPicker).mockReturnValue({
      data: [
        {
          id: 'recipe-101',
          title: 'Herb Butter Salmon',
          image_url: 'https://example.com/salmon.jpg',
          servings: 2,
          prep_time: 15,
          cook_time: 20,
          total_time: 35,
          cuisine: 'French',
          category: 'Dinner',
        },
      ],
      isLoading: false,
    } as any)
  })

  function renderMarkup() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <PlannerTabScreen />
      </QueryClientProvider>
    )
  }

  it('renders loading state when meal plan data is fetching', () => {
    vi.mocked(mealPlannerHooks.useMealPlanWeek).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('Loading meal plan...')
  })

  it('renders error state with retry button when fetch fails', () => {
    vi.mocked(mealPlannerHooks.useMealPlanWeek).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network timeout loading week'),
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('Could not load meal plan')
    expect(html).toContain('Network timeout loading week')
    expect(html).toContain('Retry')
  })

  it('renders current week bar, day selector, and meal slots', () => {
    vi.mocked(mealPlannerHooks.useMealPlanWeek).mockReturnValue({
      data: sampleWeekDays,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    // Week navigation & title
    expect(html).toContain('Meal Planner')
    expect(html).toContain('Culinary Rhythm')
    expect(html).toContain('Export to Shopping List')

    // Day selector items
    expect(html).toContain('Monday')
    expect(html).toContain('Tuesday')
    expect(html).toContain('Wednesday')

    // Meal types
    expect(html).toContain('Breakfast')
    expect(html).toContain('Lunch')
    expect(html).toContain('Dinner')
    expect(html).toContain('Snacks')
  })

  it('renders planned meal cards with title, servings, and cooked state', () => {
    // Pin system clock to Wednesday 2026-09-30 (the day with sample meals)
    // so the planner's initial selected date lands on the day with data.
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 30, 12, 0, 0))

    vi.mocked(mealPlannerHooks.useMealPlanWeek).mockReturnValue({
      data: sampleWeekDays,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    // Herb Butter Salmon dinner
    expect(html).toContain('Herb Butter Salmon')
    expect(html).toContain('4 servings')

    // Cooked badge / indicator for breakfast
    expect(html).toContain('Avocado Toast &amp; Poached Egg')
    expect(html).toContain('cooked')

    vi.useRealTimers()
  })

  it('renders empty meal slots when no meal is scheduled', () => {
    vi.mocked(mealPlannerHooks.useMealPlanWeek).mockReturnValue({
      data: sampleWeekDays,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    // Lunch is empty on Wednesday
    expect(html).toContain('Add Lunch')
    // Snack is empty on Wednesday
    expect(html).toContain('Add Snacks')
  })

  describe('Nutrition summary calculations', () => {
    it('calculates daily nutrition accurately scaled to planned servings', () => {
      // Herb Butter Salmon: baseServings=2, planned=4 -> scaleFactor=2
      // calories: 520 * 2 = 1040, protein: 44 * 2 = 88, carbs: 6 * 2 = 12, fat: 32 * 2 = 64
      // Avocado Toast: baseServings=1, planned=2 -> scaleFactor=2
      // calories: 310 * 2 = 620, protein: 14 * 2 = 28, carbs: 22 * 2 = 44, fat: 18 * 2 = 36
      // Total: calories=1660, protein=116, carbs=56, fat=100
      const summary = calculateDayNutrition([samplePlannedMeal, sampleCookedMeal])

      expect(summary.hasData).toBe(true)
      expect(summary.calories).toBe(1660)
      expect(summary.protein_g).toBe(116)
      expect(summary.carbs_g).toBe(56)
      expect(summary.fat_g).toBe(100)
    })

    it('returns hasData=false when recipes have no nutrition fields', () => {
      const mealWithoutNutrition: MealPlanItemWithRecipe = {
        ...samplePlannedMeal,
        recipe: {
          id: 'recipe-empty',
          title: 'Simple Salad',
          image_url: null,
          servings: 1,
          prep_time: null,
          cook_time: null,
          total_time: null,
          difficulty: 'easy',
          cuisine: 'American',
          nutrition_facts: {},
        },
      }

      const summary = calculateDayNutrition([mealWithoutNutrition])
      expect(summary.hasData).toBe(false)
      expect(summary.calories).toBe(0)
    })
  })

  describe('Week range and date utilities', () => {
    it('computes correct Monday-to-Sunday week range for a date', () => {
      // 2026-09-30 is Wednesday
      const range = getWeekRange('2026-09-30')
      expect(range.startDate).toBe('2026-09-28') // Monday
      expect(range.endDate).toBe('2026-10-04') // Sunday
      expect(range.formattedRange).toContain('Sep 28')
      expect(range.formattedRange).toContain('Oct 4')
      expect(range.prevWeekDate).toBe('2026-09-21')
      expect(range.nextWeekDate).toBe('2026-10-05')
    })

    it('formats dates consistently to ISO YYYY-MM-DD', () => {
      const d = new Date(2026, 8, 30) // Sep 30, 2026
      expect(formatDateToISO(d)).toBe('2026-09-30')
    })
  })
})
