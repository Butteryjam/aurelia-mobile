import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ShoppingListsOverviewScreen from '@/app/(app)/shopping/index'
import * as shoppingHooks from '@/features/shopping/hooks'
import {
  fetchUserShoppingLists,
  createShoppingList,
  deleteShoppingList,
  addManualShoppingItem,
  toggleItemChecked,
  deleteShoppingItem,
  addRecipeToShoppingList,
} from '@/features/shopping/api'
import { supabase } from '@/lib/supabase'
import type { ShoppingListSummary } from '@/features/shopping/types'

vi.mock('@/features/shopping/hooks')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => true,
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
  useSegments: () => ['(app)', 'shopping'],
}))

describe('Issue 4 — Shopping Lists Management & Item Association Suite', () => {
  let queryClient: QueryClient

  const mockLists: ShoppingListSummary[] = [
    {
      id: 'list-weekly-uuid',
      user_id: 'user-chef',
      name: 'Weekly Groceries',
      status: 'active',
      created_at: '2026-10-01T10:00:00Z',
      updated_at: '2026-10-01T10:00:00Z',
      itemCount: 6,
      completedCount: 2,
    },
    {
      id: 'list-biryani-uuid',
      user_id: 'user-chef',
      name: 'Biryani Ingredients',
      status: 'active',
      created_at: '2026-10-02T11:00:00Z',
      updated_at: '2026-10-02T11:00:00Z',
      itemCount: 4,
      completedCount: 4,
    },
    {
      id: 'list-yes-uuid',
      user_id: 'user-chef',
      name: 'yes',
      status: 'active',
      created_at: '2026-09-28T09:00:00Z',
      updated_at: '2026-09-28T09:00:00Z',
      itemCount: 1,
      completedCount: 0,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(shoppingHooks.useUserShoppingLists).mockReturnValue({
      data: mockLists,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    vi.mocked(shoppingHooks.useCreateShoppingList).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ id: 'new-list-uuid', name: 'Party Shopping' }),
      isPending: false,
    } as any)

    vi.mocked(shoppingHooks.useDeleteShoppingList).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
    } as any)
  })

  describe('Shopping Lists Overview Screen', () => {
    it('renders overview with multiple named shopping lists and progress indicators', () => {
      const html = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <ShoppingListsOverviewScreen />
        </QueryClientProvider>
      )

      expect(html).toContain('Shopping Lists')
      expect(html).toContain('Weekly Groceries')
      expect(html).toContain('Biryani Ingredients')
      expect(html).toContain('yes') // Preserves existing list named 'yes'
      expect(html).toContain('2 of 6 items checked (33%)')
      expect(html).toContain('All 4 items completed')
      expect(html).toContain('0 of 1 items checked (0%)')
    })

    it('renders empty state when user has no shopping lists', () => {
      vi.mocked(shoppingHooks.useUserShoppingLists).mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        error: null,
        refetch: vi.fn(),
        isRefetching: false,
      } as any)

      const html = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <ShoppingListsOverviewScreen />
        </QueryClientProvider>
      )

      expect(html).toContain('No shopping lists yet')
      expect(html).toContain('Create Shopping List')
    })
  })

  describe('Multi-List API & Item Association', () => {
    it('fetches all lists for the user with item count calculations', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: 'user-chef' } as any },
        error: null,
      })

      const mockListsData = [
        { id: 'list-1', user_id: 'user-chef', name: 'Weekly Groceries', status: 'active' },
        { id: 'list-2', user_id: 'user-chef', name: 'Party Shopping', status: 'active' },
      ]

      const mockItemsData = [
        { id: 'it-1', shopping_list_id: 'list-1', is_checked: true },
        { id: 'it-2', shopping_list_id: 'list-1', is_checked: false },
        { id: 'it-3', shopping_list_id: 'list-2', is_checked: false },
      ]

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'shopping_lists') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockListsData, error: null }),
              }),
            }),
          } as any
        }
        if (table === 'shopping_list_items') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockItemsData, error: null }),
            }),
          } as any
        }
        return {} as any
      })

      const result = await fetchUserShoppingLists()
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Weekly Groceries')
      expect(result[0].itemCount).toBe(2)
      expect(result[0].completedCount).toBe(1)
      expect(result[1].name).toBe('Party Shopping')
      expect(result[1].itemCount).toBe(1)
      expect(result[1].completedCount).toBe(0)
    })

    it('creates a new named shopping list saved to Supabase with user_id', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: 'user-chef' } as any },
        error: null,
      })

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-list-100', user_id: 'user-chef', name: 'Biryani Ingredients', status: 'active' },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({ insert: insertMock } as any)

      const created = await createShoppingList('  Biryani Ingredients  ')
      expect(insertMock).toHaveBeenCalledWith({
        user_id: 'user-chef',
        name: 'Biryani Ingredients',
        status: 'active',
      })
      expect(created.id).toBe('new-list-100')
    })

    it('associates manual items strictly with the intended list UUID', async () => {
      const insertItemMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'item-egg-1', shopping_list_id: 'list-weekly-uuid', name: 'Eggs', quantity: '6' },
            error: null,
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({ insert: insertItemMock } as any)

      await addManualShoppingItem('list-weekly-uuid', '6 eggs')

      expect(insertItemMock).toHaveBeenCalledWith(
        expect.objectContaining({
          shopping_list_id: 'list-weekly-uuid',
          name: 'eggs',
          quantity: '6',
        })
      )
    })

    it('deletes an individual item targeting only that item ID', async () => {
      const eqMock = vi.fn().mockResolvedValue({ error: null })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any)

      await deleteShoppingItem('item-specific-uuid')

      expect(deleteMock).toHaveBeenCalled()
      expect(eqMock).toHaveBeenCalledWith('id', 'item-specific-uuid')
    })

    it('deletes a shopping list scoping by user_id and list UUID', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: { id: 'user-chef' } as any },
        error: null,
      })

      const eqUserMock = vi.fn().mockResolvedValue({ error: null })
      const eqIdMock = vi.fn().mockReturnValue({ eq: eqUserMock })
      const deleteMock = vi.fn().mockReturnValue({ eq: eqIdMock })

      vi.mocked(supabase.from).mockReturnValue({ delete: deleteMock } as any)

      await deleteShoppingList('list-to-delete')

      expect(eqIdMock).toHaveBeenCalledWith('id', 'list-to-delete')
      expect(eqUserMock).toHaveBeenCalledWith('user_id', 'user-chef')
    })
  })
})
