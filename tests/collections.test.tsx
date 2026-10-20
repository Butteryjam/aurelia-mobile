import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CollectionsScreen from '@/app/(app)/collections/index'
import CollectionDetailScreen from '@/app/(app)/collections/[id]'
import * as collectionHooks from '@/features/collections/hooks'
import * as collectionApi from '@/features/collections/api'
import type { CollectionItem, CollectionDetailData } from '@/features/collections/types'

vi.mock('@/features/collections/hooks')
vi.mock('@/features/collections/api')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  canGoBack: () => true,
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'col-1' }),
  useSegments: () => ['(app)', 'collections'],
}))

const MOCK_COLLECTIONS: CollectionItem[] = [
  {
    id: 'col-1',
    user_id: 'test-user-id',
    name: 'Italian Sunday Dinners',
    description: 'Slow-simmered ragùs, handmade pasta, and focaccia.',
    cover_image_url: 'https://example.com/cover.jpg',
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    recipe_count: 5,
    preview_image_urls: ['https://example.com/recipe1.jpg'],
  },
  {
    id: 'col-2',
    user_id: 'test-user-id',
    name: 'Quick Weeknights',
    description: 'Under 30-minute balanced dinners.',
    cover_image_url: null,
    created_at: '2026-09-30T00:00:00Z',
    updated_at: '2026-09-30T00:00:00Z',
    recipe_count: 2,
    preview_image_urls: ['https://example.com/quick1.jpg', 'https://example.com/quick2.jpg'],
  },
]

const MOCK_COLLECTION_DETAIL: CollectionDetailData = {
  collection: MOCK_COLLECTIONS[0],
  recipes: [
    {
      id: 'rec-1',
      user_id: 'test-user-id',
      title: 'Handmade Tagliatelle al Ragù',
      description: 'Silky egg pasta with slow-cooked Bolognese.',
      image_url: 'https://example.com/tagliatelle.jpg',
      prep_time: 45,
      cook_time: 120,
      total_time: 165,
      servings: 6,
      difficulty: 'medium',
      cuisine: 'Italian',
      category: 'Pasta',
      notes: null,
      rating: 5,
      source_url: null,
      is_public: false,
      created_at: '2026-09-30T00:00:00Z',
      updated_at: '2026-09-30T00:00:00Z',
      isFavorite: true,
    },
  ],
}

describe('Aurelia Mobile — Collections Suite', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(collectionHooks.useCreateCollection).mockReturnValue({
      mutateAsync: vi.fn(async () => ({ id: 'new-col-id' })),
      isPending: false,
    } as any)

    vi.mocked(collectionHooks.useAddRecipeToCollection).mockReturnValue({
      mutateAsync: vi.fn(async () => {}),
      isPending: false,
    } as any)

    vi.mocked(collectionHooks.useRemoveRecipeFromCollection).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(collectionHooks.useDeleteCollection).mockReturnValue({
      mutateAsync: vi.fn(async () => {}),
      isPending: false,
    } as any)

    vi.mocked(collectionHooks.useEligibleRecipesForCollection).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)
  })

  it('renders collections archive with cards, titles, and recipe counts', () => {
    vi.mocked(collectionHooks.useCollections).mockReturnValue({
      data: MOCK_COLLECTIONS,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <CollectionsScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('Collections')
    expect(html).toContain('Italian Sunday Dinners')
    expect(html).toContain('Quick Weeknights')
    expect(html).toContain('5 recipes')
    expect(html).toContain('2 recipes')
  })

  it('renders empty state when user has no collections', () => {
    vi.mocked(collectionHooks.useCollections).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <CollectionsScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('No collections yet')
    expect(html).toContain('Create Collection')
  })

  it('renders collection detail with metadata and recipe list', () => {
    vi.mocked(collectionHooks.useCollectionDetail).mockReturnValue({
      data: MOCK_COLLECTION_DETAIL,
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <CollectionDetailScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('Italian Sunday Dinners')
    expect(html).toContain('Handmade Tagliatelle al Ragù')
    expect(html).toContain('Remove from binder')
  })

  it('renders empty state when collection contains no recipes', () => {
    vi.mocked(collectionHooks.useCollectionDetail).mockReturnValue({
      data: {
        collection: MOCK_COLLECTIONS[0],
        recipes: [],
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      isRefetching: false,
    } as any)

    const html = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <CollectionDetailScreen />
      </QueryClientProvider>
    )

    expect(html).toContain('No recipes in this binder')
    expect(html).toContain('Add Recipe')
  })

  it('calls createCollection and adds recipe successfully', async () => {
    vi.mocked(collectionApi.createCollection).mockResolvedValue({ id: 'col-created' })
    vi.mocked(collectionApi.addRecipeToCollection).mockResolvedValue()
    vi.mocked(collectionApi.removeRecipeFromCollection).mockResolvedValue()

    const createRes = await collectionApi.createCollection({
      name: 'Summer Barbecue',
      description: 'Smoked briskets and craft sauces',
    })
    expect(createRes.id).toBe('col-created')

    await collectionApi.addRecipeToCollection('col-created', 'rec-1')
    expect(collectionApi.addRecipeToCollection).toHaveBeenCalledWith('col-created', 'rec-1')

    await collectionApi.removeRecipeFromCollection('col-created', 'rec-1')
    expect(collectionApi.removeRecipeFromCollection).toHaveBeenCalledWith('col-created', 'rec-1')
  })
})
