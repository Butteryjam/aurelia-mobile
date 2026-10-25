/**
 * Aurelia Mobile — Shopping List API & Data Access
 */

import { supabase } from '@/lib/supabase'
import type {
  ShoppingList,
  ShoppingListWithItems,
  ShoppingListItem,
  ShoppingListSummary,
} from './types'
import {
  parseManualItem,
  consolidateItems,
  type ShoppingItem,
} from '@/lib/shopping-consolidator'
import { scaleQuantity } from '@/lib/quantity-scaler'

/**
 * Fetch all shopping lists for the current user with item count and progress stats.
 */
export async function fetchUserShoppingLists(): Promise<ShoppingListSummary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  const { data: lists, error: listsError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (listsError) throw new Error(listsError.message)
  if (!lists || lists.length === 0) return []

  const listIds = lists.map((l) => l.id)
  const { data: items, error: itemsError } = await supabase
    .from('shopping_list_items')
    .select('id, shopping_list_id, is_checked')
    .in('shopping_list_id', listIds)

  if (itemsError) throw new Error(itemsError.message)

  const statsMap = new Map<string, { total: number; completed: number }>()
  items?.forEach((it) => {
    const cur = statsMap.get(it.shopping_list_id) || { total: 0, completed: 0 }
    cur.total += 1
    if (it.is_checked) cur.completed += 1
    statsMap.set(it.shopping_list_id, cur)
  })

  return lists.map((l) => {
    const stats = statsMap.get(l.id) || { total: 0, completed: 0 }
    return {
      ...l,
      itemCount: stats.total,
      completedCount: stats.completed,
    }
  })
}

/**
 * Delete a shopping list and cascade delete all its items.
 */
export async function deleteShoppingList(listId: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)
}

/**
 * Rename an existing shopping list.
 */
export async function renameShoppingList(listId: string, newName: string): Promise<ShoppingList> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')
  const trimmed = newName.trim()
  if (!trimmed) throw new Error('List name cannot be empty.')

  const { data, error } = await supabase
    .from('shopping_lists')
    .update({ name: trimmed })
    .eq('id', listId)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to rename list.')
  return data
}

/**
 * Fetch or automatically initialize the active shopping list.
 */
export async function fetchActiveShoppingList(): Promise<ShoppingListWithItems> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  // 1. Look for existing active list
  const { data: existingList } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let targetList: ShoppingList

  if (existingList) {
    targetList = existingList
  } else {
    // Create default active list
    const { data: newList, error: createError } = await supabase
      .from('shopping_lists')
      .insert({
        user_id: user.id,
        name: 'Weekly Groceries',
        status: 'active',
      })
      .select('*')
      .single()

    if (createError || !newList) {
      throw new Error(createError?.message || 'Could not create shopping list.')
    }
    targetList = newList
  }

  return fetchShoppingList(targetList.id)
}

/**
 * Fetch a specific shopping list along with its items and recipe attribution.
 */
export async function fetchShoppingList(listId: string): Promise<ShoppingListWithItems> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single()

  if (listError || !list) {
    throw new Error(listError?.message || 'Shopping list not found.')
  }

  const { data: items, error: itemsError } = await supabase
    .from('shopping_list_items')
    .select('*')
    .eq('shopping_list_id', listId)
    .order('created_at', { ascending: true })

  if (itemsError) throw new Error(itemsError.message)

  const rawItems = items ?? []

  // Fetch recipe titles for items that have recipe attribution
  const recipeIds = Array.from(
    new Set(rawItems.map((it) => it.recipe_id).filter(Boolean) as string[])
  )

  const recipeTitleMap = new Map<string, string>()
  if (recipeIds.length > 0) {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, title')
      .in('id', recipeIds)

    recipes?.forEach((r) => recipeTitleMap.set(r.id, r.title))
  }

  const enrichedItems: ShoppingListItem[] = rawItems.map((item) => ({
    ...item,
    recipe_title: item.recipe_id ? recipeTitleMap.get(item.recipe_id) ?? null : null,
  }))

  return {
    ...list,
    items: enrichedItems,
  }
}

/**
 * Create a new shopping list.
 */
export async function createShoppingList(name: string): Promise<ShoppingList> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  const trimmed = name.trim()
  if (!trimmed) throw new Error('List name is required.')

  const { data, error } = await supabase
    .from('shopping_lists')
    .insert({
      user_id: user.id,
      name: trimmed,
      status: 'active',
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to create list.')
  return data
}

/**
 * Toggle checked status of a shopping list item.
 */
export async function toggleItemChecked(
  itemId: string,
  isChecked: boolean
): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .update({ is_checked: isChecked })
    .eq('id', itemId)

  if (error) throw new Error(error.message)
}

/**
 * Add a manual item to a shopping list via natural language parsing.
 */
export async function addManualShoppingItem(
  listId: string,
  rawText: string
): Promise<ShoppingListItem> {
  const parsed = parseManualItem(rawText)
  if (!parsed.name) throw new Error('Item name cannot be empty.')

  const { data, error } = await supabase
    .from('shopping_list_items')
    .insert({
      shopping_list_id: listId,
      name: parsed.name,
      quantity: parsed.quantity,
      unit: parsed.unit,
      category: parsed.category,
      is_checked: false,
      recipe_id: null,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Failed to add item.')
  return data
}

/**
 * Delete an individual shopping list item.
 */
export async function deleteShoppingItem(itemId: string): Promise<void> {
  const { error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)
}

/**
 * Clear all completed (checked) items in a shopping list.
 */
export async function clearCompletedShoppingItems(listId: string): Promise<number> {
  const { data, error } = await supabase
    .from('shopping_list_items')
    .delete()
    .eq('shopping_list_id', listId)
    .eq('is_checked', true)
    .select('id')

  if (error) throw new Error(error.message)
  return data?.length ?? 0
}

/**
 * Generate/add shopping list items from selected planned meals.
 * Scales ingredients according to planned servings, consolidates with existing
 * unchecked items, and preserves recipe attribution.
 */
export async function generateShoppingItemsFromMealPlan(
  listId: string,
  plannedItemIds: string[]
): Promise<{ addedCount: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')
  if (!plannedItemIds || plannedItemIds.length === 0) {
    throw new Error('Please select at least one planned meal.')
  }

  // 1. Fetch planned meals with recipe_id and servings
  const { data: plannedMeals, error: mealsError } = await supabase
    .from('meal_plan_items')
    .select('id, recipe_id, servings')
    .eq('user_id', user.id)
    .in('id', plannedItemIds)

  if (mealsError || !plannedMeals) {
    throw new Error(mealsError?.message || 'Could not fetch planned meals.')
  }

  const recipeMeals = plannedMeals.filter((m) => Boolean(m.recipe_id))
  if (recipeMeals.length === 0) {
    throw new Error('None of the selected meals have recipe ingredients to add.')
  }

  // 2. Fetch recipe metadata and ingredients
  const uniqueRecipeIds = Array.from(new Set(recipeMeals.map((m) => m.recipe_id!)))

  const [recipesRes, ingredientsRes] = await Promise.all([
    supabase.from('recipes').select('id, title, servings').in('id', uniqueRecipeIds),
    supabase
      .from('recipe_ingredients')
      .select('recipe_id, name, quantity, unit')
      .in('recipe_id', uniqueRecipeIds)
      .order('order_index'),
  ])

  const recipes = recipesRes.data ?? []
  const ingredients = ingredientsRes.data ?? []

  const recipeMap = new Map(recipes.map((r) => [r.id, r]))

  // 3. Scale ingredients for each planned meal
  const allScaledItems: ShoppingItem[] = []

  for (const meal of recipeMeals) {
    const meta = recipeMap.get(meal.recipe_id!)
    if (!meta) continue

    const baseServings = meta.servings && meta.servings > 0 ? meta.servings : 2
    const mealServings = meal.servings

    const mealIngredients = ingredients.filter((ing) => ing.recipe_id === meal.recipe_id)

    for (const ing of mealIngredients) {
      allScaledItems.push({
        name: ing.name,
        quantity:
          mealServings !== baseServings
            ? scaleQuantity(ing.quantity, baseServings, mealServings)
            : (ing.quantity ?? null),
        unit: ing.unit ?? null,
        category: null,
        recipeId: meta.id,
        recipeTitle: meta.title,
      })
    }
  }

  if (allScaledItems.length === 0) {
    throw new Error('No ingredients found to export.')
  }

  // 4. Fetch existing unchecked items in list to consolidate
  const { data: existingItems } = await supabase
    .from('shopping_list_items')
    .select('id, name, quantity, unit, recipe_id')
    .eq('shopping_list_id', listId)
    .eq('is_checked', false)

  const existingAsShoppingItems: ShoppingItem[] = (existingItems ?? []).map((e) => ({
    name: e.name,
    quantity: e.quantity,
    unit: e.unit,
    category: null,
    recipeId: e.recipe_id,
  }))

  // 5. Consolidate
  const combined = [...existingAsShoppingItems, ...allScaledItems]
  const consolidated = consolidateItems(combined)

  // 6. Delete previous unchecked items and insert consolidated items
  const existingIds = (existingItems ?? []).map((e) => e.id)
  if (existingIds.length > 0) {
    await supabase.from('shopping_list_items').delete().in('id', existingIds)
  }

  const toInsert = consolidated.map((item) => ({
    shopping_list_id: listId,
    name: item.name,
    quantity: item.quantity || null,
    unit: item.unit || null,
    category: item.category || 'Other',
    is_checked: false,
    recipe_id: item.recipeIds[0] ?? null,
  }))

  const { error: insertError } = await supabase.from('shopping_list_items').insert(toInsert)
  if (insertError) throw new Error(insertError.message)

  return { addedCount: allScaledItems.length }
}

/**
 * Add all ingredients from a recipe (scaled to target servings) into a shopping list.
 */
export async function addRecipeToShoppingList(
  listId: string,
  recipeId: string,
  targetServings: number
): Promise<{ addedCount: number }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  // 1. Verify list
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single()

  if (listError || !list) throw new Error('Shopping list not found.')

  // 2. Fetch recipe & ingredients
  const [recipeRes, ingredientsRes] = await Promise.all([
    supabase.from('recipes').select('id, title, servings').eq('id', recipeId).single(),
    supabase
      .from('recipe_ingredients')
      .select('name, quantity, unit')
      .eq('recipe_id', recipeId)
      .order('order_index'),
  ])

  if (recipeRes.error || !recipeRes.data) throw new Error('Recipe not found.')
  const recipe = recipeRes.data
  const ingredients = ingredientsRes.data ?? []

  if (ingredients.length === 0) {
    throw new Error('This recipe has no ingredients to add.')
  }

  const baseServings = recipe.servings && recipe.servings > 0 ? recipe.servings : 2

  // 3. Scale ingredients
  const scaledItems: ShoppingItem[] = ingredients.map((ing) => ({
    name: ing.name,
    quantity:
      targetServings !== baseServings
        ? scaleQuantity(ing.quantity, baseServings, targetServings)
        : (ing.quantity ?? null),
    unit: ing.unit ?? null,
    category: null,
    recipeId: recipe.id,
    recipeTitle: recipe.title,
  }))

  // 4. Fetch existing unchecked items to consolidate
  const { data: existingItems } = await supabase
    .from('shopping_list_items')
    .select('id, name, quantity, unit, recipe_id')
    .eq('shopping_list_id', listId)
    .eq('is_checked', false)

  const existingAsShoppingItems: ShoppingItem[] = (existingItems ?? []).map((e) => ({
    name: e.name,
    quantity: e.quantity,
    unit: e.unit,
    category: null,
    recipeId: e.recipe_id,
  }))

  // 5. Consolidate
  const combined = [...existingAsShoppingItems, ...scaledItems]
  const consolidated = consolidateItems(combined)

  const existingIds = (existingItems ?? []).map((e) => e.id)
  if (existingIds.length > 0) {
    await supabase.from('shopping_list_items').delete().in('id', existingIds)
  }

  const toInsert = consolidated.map((item) => ({
    shopping_list_id: listId,
    name: item.name,
    quantity: item.quantity || null,
    unit: item.unit || null,
    category: item.category || 'Other',
    is_checked: false,
    recipe_id: item.recipeIds[0] ?? null,
  }))

  const { error: insertError } = await supabase.from('shopping_list_items').insert(toInsert)
  if (insertError) throw new Error(insertError.message)

  return { addedCount: scaledItems.length }
}
