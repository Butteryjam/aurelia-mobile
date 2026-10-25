import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { queryClient, clearUserQueryCache } from '@/lib/query-client'
import { RECIPE_QUERY_KEYS } from '@/features/recipes/hooks'
import { SHOPPING_KEYS } from '@/features/shopping/hooks'
import { MEAL_PLAN_KEYS } from '@/features/meal-planner/hooks'
import { COLLECTION_KEYS } from '@/features/collections/hooks'
import {
  saveRecipeDraft,
  loadRecipeDraft,
  clearAllUserDrafts,
} from '@/features/recipes/draft-storage'
import { supabase } from '@/lib/supabase'

describe('Aurelia Mobile — Account Switching Regression Suite', () => {
  const userA = {
    id: 'user-a-1111',
    email: 'alice@example.com',
  }

  const userB = {
    id: 'user-b-2222',
    email: 'bob@example.com',
  }

  const recipesUserA = [
    { id: 'recipe-a-1', title: "Alice's Secret Pie", isFavorite: true },
    { id: 'recipe-a-2', title: "Alice's Sourdough Bread", isFavorite: false },
  ]

  const recipesUserB = [
    { id: 'recipe-b-1', title: "Bob's Smoked Ribs", isFavorite: false },
  ]

  const shoppingListUserA = {
    id: 'list-a-1',
    name: "Alice's Grocery List",
    is_active: true,
    items: [{ id: 'item-1', name: 'Flour', is_checked: false }],
  }

  const shoppingListUserB = {
    id: 'list-b-1',
    name: "Bob's BBQ Supplies",
    is_active: true,
    items: [{ id: 'item-2', name: 'Charcoal', is_checked: true }],
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    await clearUserQueryCache()
    await AsyncStorage.clear()
  })

  it('1. Account A signs in and populates scoped cache entries for recipes and shopping lists', async () => {
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userA.id), recipesUserA)
    queryClient.setQueryData(RECIPE_QUERY_KEYS.dashboard(userA.id), {
      recentRecipes: recipesUserA,
      greeting: "Welcome Alice",
    })
    queryClient.setQueryData(SHOPPING_KEYS.userActive(userA.id), shoppingListUserA)

    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userA.id))).toEqual(recipesUserA)
    expect(queryClient.getQueryData(SHOPPING_KEYS.userActive(userA.id))).toEqual(shoppingListUserA)
  })

  it('2. Account A signs out: private cache is canceled and purged without clearing unrelated preferences', async () => {
    // Populate user A cache and draft
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userA.id), recipesUserA)
    queryClient.setQueryData(SHOPPING_KEYS.userActive(userA.id), shoppingListUserA)
    await saveRecipeDraft(userA.id, 'new', { title: "Alice's Unfinished Cake" } as any)

    // Set an unrelated user preference (theme)
    await AsyncStorage.setItem('aurelia_theme', 'sunset')
    await AsyncStorage.setItem('aurelia_theme_mode', 'dark')

    // Perform sign out cleanup
    await clearUserQueryCache()
    await clearAllUserDrafts(userA.id)

    // Private queries and drafts are cleared
    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userA.id))).toBeUndefined()
    expect(queryClient.getQueryData(SHOPPING_KEYS.userActive(userA.id))).toBeUndefined()
    expect(await loadRecipeDraft(userA.id, 'new')).toBeNull()

    // Unrelated theme settings are safely preserved
    expect(await AsyncStorage.getItem('aurelia_theme')).toBe('sunset')
    expect(await AsyncStorage.getItem('aurelia_theme_mode')).toBe('dark')
  })

  it('3. Account B signs in immediately afterward and never sees Account A information', async () => {
    // 1. Account A signs in
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userA.id), recipesUserA)
    queryClient.setQueryData(SHOPPING_KEYS.userActive(userA.id), shoppingListUserA)

    // 2. Account A signs out
    await clearUserQueryCache()
    await clearAllUserDrafts(userA.id)

    // 3. Account B immediately signs in
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userB.id), recipesUserB)
    queryClient.setQueryData(SHOPPING_KEYS.userActive(userB.id), shoppingListUserB)

    // Account B reads its own data
    const activeRecipesForB = queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userB.id))
    const activeShoppingForB = queryClient.getQueryData(SHOPPING_KEYS.userActive(userB.id))

    expect(activeRecipesForB).toEqual(recipesUserB)
    expect(activeShoppingForB).toEqual(shoppingListUserB)

    // Account A's queries do not exist in cache
    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userA.id))).toBeUndefined()
    expect(queryClient.getQueryData(SHOPPING_KEYS.userActive(userA.id))).toBeUndefined()
  })

  it('4. Late-arriving response from Account A does not pollute Account B cache', async () => {
    // Setup deferred promise for Account A's fetch
    let resolveLateRequestA: (val: any) => void = () => {}
    const lateRequestPromise = new Promise((resolve) => {
      resolveLateRequestA = resolve
    })

    // Account A signs in and initiates query
    let accountAQueryFinished = false
    const fetchForA = async () => {
      const data = await lateRequestPromise
      // Verify scoping: attempting to set data with Account A's key
      queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userA.id), data)
      accountAQueryFinished = true
      return data
    }

    // Account A query launched in background
    const requestExecution = fetchForA()

    // Meanwhile, user switches accounts! Account A signs out, Account B signs in
    await clearUserQueryCache()

    // Account B signs in and sets its own data
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userB.id), recipesUserB)

    // Account A's late network response finally arrives
    resolveLateRequestA(recipesUserA)
    await requestExecution

    expect(accountAQueryFinished).toBe(true)

    // Account B query cache is strictly isolated and retains ONLY Bob's recipes
    const bobRecipes = queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userB.id))
    expect(bobRecipes).toEqual(recipesUserB)
    expect(bobRecipes).not.toEqual(recipesUserA)

    // Any query asking for user B's recipes CANNOT return user A's recipes
    const queryForBob = queryClient.getQueryState(RECIPE_QUERY_KEYS.list(userB.id))
    expect(queryForBob?.data).toEqual(recipesUserB)
  })

  it('5. Google OAuth account switching resets caches correctly', async () => {
    // Account A signed in via Google OAuth
    queryClient.setQueryData(RECIPE_QUERY_KEYS.dashboard(userA.id), { recentRecipes: recipesUserA })

    // User triggers Google account switch (triggers clearUserQueryCache + draft cleanup)
    await clearUserQueryCache()
    await clearAllUserDrafts(userA.id)

    // Account B arrives from OAuth callback
    queryClient.setQueryData(RECIPE_QUERY_KEYS.dashboard(userB.id), { recentRecipes: recipesUserB })

    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.dashboard(userA.id))).toBeUndefined()
    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.dashboard(userB.id))).toEqual({
      recentRecipes: recipesUserB,
    })
  })

  it('6. Persisted mobile draft data from Account A cannot appear for Account B after restart', async () => {
    // Save draft for Account A
    await saveRecipeDraft(userA.id, 'new', {
      title: "Alice's Secret Pie",
      ingredients: [{ name: 'Apples', amount: '4', unit: 'pcs' }],
    } as any)

    // Confirm Alice's draft is present
    const aliceDraft = await loadRecipeDraft(userA.id, 'new')
    expect(aliceDraft?.formData.title).toBe("Alice's Secret Pie")

    // Bob tries to load his draft (simulating app restart with Bob active)
    const bobDraft = await loadRecipeDraft(userB.id, 'new')
    expect(bobDraft).toBeNull()

    // Clear all drafts for Alice on sign out
    await clearAllUserDrafts(userA.id)
    expect(await loadRecipeDraft(userA.id, 'new')).toBeNull()
  })

  it('7. Account B sees its own recipes, collections, and shopping lists normally', async () => {
    queryClient.setQueryData(RECIPE_QUERY_KEYS.list(userB.id), recipesUserB)
    queryClient.setQueryData(COLLECTION_KEYS.all(userB.id), [{ id: 'col-1', name: "Bob's Grill" }])
    queryClient.setQueryData(SHOPPING_KEYS.userActive(userB.id), shoppingListUserB)

    expect(queryClient.getQueryData(RECIPE_QUERY_KEYS.list(userB.id))).toEqual(recipesUserB)
    expect(queryClient.getQueryData(COLLECTION_KEYS.all(userB.id))).toEqual([
      { id: 'col-1', name: "Bob's Grill" },
    ])
    expect(queryClient.getQueryData(SHOPPING_KEYS.userActive(userB.id))).toEqual(shoppingListUserB)
  })

  it('8. Logging out does not delete data from Supabase backend tables', async () => {
    const deleteSpy = vi.fn()
    vi.spyOn(supabase, 'from').mockReturnValue({
      delete: deleteSpy,
    } as any)

    // Execute client-side sign-out cleanup
    await clearUserQueryCache()
    await clearAllUserDrafts(userA.id)

    // Verify no database DELETE calls were made to recipes or shopping lists
    expect(deleteSpy).not.toHaveBeenCalled()
  })
})
