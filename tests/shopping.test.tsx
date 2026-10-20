import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShoppingListScreen from '@/app/(app)/shopping/[id]'
import * as shoppingHooks from '@/features/shopping/hooks'
import {
  parseManualItem,
  consolidateItems,
  categorizeItem,
  type ShoppingItem,
} from '@/lib/shopping-consolidator'
import type { ShoppingListWithItems, ShoppingListItem } from '@/features/shopping/types'

vi.mock('@/features/shopping/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}
vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useSegments: () => ['(app)', 'shopping', 'active'],
  useLocalSearchParams: () => ({ id: 'active' }),
}))

describe('Aurelia Mobile — Shopping List & Consolidation Suite', () => {
  let queryClient: QueryClient

  const mockToggleMutation = {
    mutate: vi.fn(),
    isPending: false,
  }
  const mockAddManualMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }
  const mockDeleteMutation = {
    mutate: vi.fn(),
    isPending: false,
  }
  const mockClearCompletedMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  const sampleItems: ShoppingListItem[] = [
    {
      id: 'item-1',
      shopping_list_id: 'list-1',
      name: 'Organic Honeycrisp Apples',
      quantity: '2',
      unit: 'lbs',
      category: 'Produce',
      is_checked: false,
      recipe_id: 'recipe-apple-pie',
      created_at: '2026-09-30T10:00:00Z',
    },
    {
      id: 'item-2',
      shopping_list_id: 'list-1',
      name: 'Whole Milk',
      quantity: '1',
      unit: 'gallon',
      category: 'Dairy',
      is_checked: true,
      recipe_id: null,
      created_at: '2026-09-30T10:05:00Z',
    },
    {
      id: 'item-3',
      shopping_list_id: 'list-1',
      name: 'Salmon Fillets',
      quantity: '4',
      unit: null,
      category: 'Meat & Seafood',
      is_checked: false,
      recipe_id: 'recipe-salmon',
      created_at: '2026-09-30T10:10:00Z',
    },
  ]

  const sampleList: ShoppingListWithItems = {
    id: 'list-1',
    user_id: 'user-1',
    name: 'Weekly Provisions',
    status: 'active',
    created_at: '2026-09-30T09:00:00Z',
    updated_at: '2026-09-30T10:15:00Z',
    items: sampleItems,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(shoppingHooks.useToggleShoppingItem).mockReturnValue(mockToggleMutation as any)
    vi.mocked(shoppingHooks.useAddManualShoppingItem).mockReturnValue(mockAddManualMutation as any)
    vi.mocked(shoppingHooks.useDeleteShoppingItem).mockReturnValue(mockDeleteMutation as any)
    vi.mocked(shoppingHooks.useClearCompletedShoppingItems).mockReturnValue(mockClearCompletedMutation as any)
  })

  function renderMarkup() {
    return renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <ShoppingListScreen />
      </QueryClientProvider>
    )
  }

  it('renders loading indicator while shopping list is fetching', () => {
    vi.mocked(shoppingHooks.useActiveShoppingList).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('Loading shopping list...')
  })

  it('renders error state with retry button when list load fails', () => {
    vi.mocked(shoppingHooks.useActiveShoppingList).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load shopping list from server'),
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('Could not load shopping list')
    expect(html).toContain('Failed to load shopping list from server')
    expect(html).toContain('Retry')
  })

  it('renders shopping list title, progress bar, aisle sections and items', () => {
    vi.mocked(shoppingHooks.useActiveShoppingList).mockReturnValue({
      data: sampleList,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    // List Title
    expect(html).toContain('Weekly Provisions')

    // Progress
    expect(html).toContain('1 of 3 items checked (33%)')

    // Aisle Sections
    expect(html).toContain('PRODUCE')
    expect(html).toContain('DAIRY')
    expect(html).toContain('MEAT &amp; SEAFOOD')

    // Items and units
    expect(html).toContain('Organic Honeycrisp Apples')
    expect(html).toContain('2 lbs')
    expect(html).toContain('Whole Milk')
    expect(html).toContain('1 gallon')
    expect(html).toContain('Salmon Fillets')

    // Clear completed action
    expect(html).toContain('Clear completed items')
  })

  it('renders empty list state when shopping list has no items', () => {
    vi.mocked(shoppingHooks.useActiveShoppingList).mockReturnValue({
      data: { ...sampleList, items: [] },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderMarkup()
    expect(html).toContain('List is Empty')
    expect(html).toContain('Add grocery items using natural language below, or generate items directly from your planned meals.')
    expect(html).toContain('Open Meal Planner')
  })

  describe('Natural language manual item entry parsing', () => {
    it('parses quantity, unit and name correctly', () => {
      const parsed = parseManualItem('2 lbs apples')
      expect(parsed.quantity).toBe('2')
      expect(parsed.unit).toBe('lb')
      expect(parsed.name).toBe('apples')
      expect(parsed.category).toBe('Produce')
    })

    it('parses unitless quantities like eggs or avocados', () => {
      const parsed = parseManualItem('6 large eggs')
      expect(parsed.quantity).toBe('6')
      expect(parsed.unit).toBeNull()
      expect(parsed.name).toBe('large eggs')
      expect(parsed.category).toBe('Dairy & Refrigerated')
    })

    it('parses bottle/can pantry items', () => {
      const parsed = parseManualItem('1 bottle olive oil')
      expect(parsed.quantity).toBe('1')
      expect(parsed.unit).toBe('bottle')
      expect(parsed.name).toBe('olive oil')
      expect(parsed.category).toBe('Pantry & Dry Goods')
    })

    it('handles decimal and fractional quantities', () => {
      const parsedDec = parseManualItem('1.5 kg flour')
      expect(parsedDec.quantity).toBe('1.5')
      expect(parsedDec.unit).toBe('kg')
      expect(parsedDec.name).toBe('flour')

      const parsedFrac = parseManualItem('1/2 cup sugar')
      expect(parsedFrac.quantity).toBe('1/2')
      expect(parsedFrac.unit).toBe('cup')
      expect(parsedFrac.name).toBe('sugar')
    })
  })

  describe('Shopping consolidation logic & unit safety', () => {
    it('combines items with the same name and compatible units', () => {
      const items: ShoppingItem[] = [
        {
          name: 'Olive Oil',
          quantity: 2,
          unit: 'tbsp',
          category: 'Pantry & Dry Goods',
          recipeId: 'rec-1',
          recipeTitle: 'Pasta',
        },
        {
          name: 'Olive Oil',
          quantity: 1,
          unit: 'tbsp',
          category: 'Pantry & Dry Goods',
          recipeId: 'rec-2',
          recipeTitle: 'Salad',
        },
      ]

      const consolidated = consolidateItems(items)
      expect(consolidated).toHaveLength(1)
      expect(consolidated[0].name).toBe('Olive Oil')
      expect(consolidated[0].quantity).toBe('3')
      expect(consolidated[0].unit).toBe('tbsp')
      // Both recipes attributed
      expect(consolidated[0].recipeIds).toEqual(['rec-1', 'rec-2'])
      expect(consolidated[0].recipeAttributions).toEqual(['Pasta', 'Salad'])
    })

    it('never combines items with incompatible units', () => {
      const items: ShoppingItem[] = [
        {
          name: 'Fresh Cilantro',
          quantity: 1,
          unit: 'bunch',
          category: 'Produce',
          recipeId: 'rec-1',
        },
        {
          name: 'Fresh Cilantro',
          quantity: 2,
          unit: 'tbsp',
          category: 'Produce',
          recipeId: 'rec-2',
        },
      ]

      const consolidated = consolidateItems(items)
      // Because 'bunch' (count/custom) and 'tbsp' (volume) cannot be safely merged mathematically,
      // both items must be preserved separately to avoid corrupted recipes!
      expect(consolidated).toHaveLength(2)
      const mapped = consolidated.map((c) => `${c.quantity} ${c.unit}`)
      expect(mapped).toContain('1 bunch')
      expect(mapped).toContain('2 tbsp')
    })

    it('correctly categorizes ingredients into grocery store aisles', () => {
      expect(categorizeItem('Honeycrisp Apple')).toBe('Produce')
      expect(categorizeItem('Ribeye Steak')).toBe('Meat & Seafood')
      expect(categorizeItem('Greek Yogurt')).toBe('Dairy & Refrigerated')
      expect(categorizeItem('Sourdough Baguette')).toBe('Bakery')
      expect(categorizeItem('Soy Sauce')).toBe('Pantry & Dry Goods')
      expect(categorizeItem('Ground Cinnamon')).toBe('Spices & Seasonings')
      expect(categorizeItem('Ice Cream')).toBe('Frozen')
      expect(categorizeItem('Sparkling Water')).toBe('Beverages')
    })
  })
})
