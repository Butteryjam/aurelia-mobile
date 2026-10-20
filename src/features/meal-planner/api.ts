/**
 * Aurelia Mobile — Meal Planner API & Data Access
 */

import { supabase } from '@/lib/supabase'
import type {
  DayMeals,
  MealPlanItemRow,
  MealPlanItemWithRecipe,
  MealPlanRecipeSummary,
  AddMealPlanItemInput,
  UpdateMealPlanItemInput,
} from './types'
import { formatDateToISO } from './utils'

/**
 * Fetch all planned meal entries for a week range, joined with recipe metadata,
 * grouped into 7 days with slots (breakfast, lunch, dinner, snack).
 */
export async function fetchMealPlanForWeek(
  startDate: string,
  endDate: string
): Promise<DayMeals[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  // 1. Fetch items in range
  const { data: dbItems, error: dbError } = await supabase
    .from('meal_plan_items')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('order_index', { ascending: true })

  if (dbError) throw new Error(dbError.message)

  const rawItems = (dbItems ?? []) as MealPlanItemRow[]

  // 2. Batch-fetch recipe metadata
  const recipeIds = Array.from(
    new Set(rawItems.map((i) => i.recipe_id).filter(Boolean) as string[])
  )

  const recipeMap = new Map<string, MealPlanRecipeSummary>()
  if (recipeIds.length > 0) {
    const { data: recipes, error: recipesError } = await supabase
      .from('recipes')
      .select(
        'id, title, image_url, prep_time, cook_time, total_time, servings, difficulty, cuisine, nutrition_facts'
      )
      .in('id', recipeIds)

    if (recipesError) throw new Error(recipesError.message)

    recipes?.forEach((r) => {
      recipeMap.set(r.id, r as MealPlanRecipeSummary)
    })
  }

  // 3. Enriched items
  const enrichedItems: MealPlanItemWithRecipe[] = rawItems.map((item) => ({
    ...item,
    recipe: item.recipe_id ? recipeMap.get(item.recipe_id) ?? null : null,
  }))

  // 4. Construct 7 days (Monday -> Sunday)
  const [startY, startM, startD] = startDate.split('-').map(Number)
  const currentIter = new Date(startY, startM - 1, startD)
  const todayISO = formatDateToISO(new Date())

  const days: DayMeals[] = []

  for (let i = 0; i < 7; i++) {
    const dateISO = formatDateToISO(currentIter)
    const dayItems = enrichedItems.filter((it) => it.date === dateISO)

    days.push({
      date: dateISO,
      dayName: currentIter.toLocaleDateString('en-US', { weekday: 'long' }),
      dayShort: currentIter.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: currentIter.getDate(),
      monthShort: currentIter.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateISO === todayISO,
      slots: {
        breakfast: dayItems
          .filter((it) => it.meal_type === 'breakfast')
          .sort((a, b) => a.order_index - b.order_index),
        lunch: dayItems
          .filter((it) => it.meal_type === 'lunch')
          .sort((a, b) => a.order_index - b.order_index),
        dinner: dayItems
          .filter((it) => it.meal_type === 'dinner')
          .sort((a, b) => a.order_index - b.order_index),
        snack: dayItems
          .filter((it) => it.meal_type === 'snack')
          .sort((a, b) => a.order_index - b.order_index),
      },
    })

    currentIter.setDate(currentIter.getDate() + 1)
  }

  return days
}

/**
 * Fetch available recipes for the Add Meal bottom sheet.
 */
export async function fetchRecipesForPicker(search?: string): Promise<MealPlanRecipeSummary[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  let query = supabase
    .from('recipes')
    .select(
      'id, title, image_url, prep_time, cook_time, total_time, servings, difficulty, cuisine, nutrition_facts'
    )
    .eq('user_id', user.id)
    .order('title', { ascending: true })

  if (search && search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`)
  }

  const { data, error } = await query.limit(50)
  if (error) throw new Error(error.message)

  return (data ?? []) as MealPlanRecipeSummary[]
}

/**
 * Add a new planned meal entry.
 */
export async function addMealPlanItem(input: AddMealPlanItemInput): Promise<MealPlanItemRow> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in.')

  if (!input.recipeId && (!input.customTitle || !input.customTitle.trim())) {
    throw new Error('Please choose a recipe or enter a meal title.')
  }

  let title = input.customTitle?.trim() || ''
  let imageSnapshot: string | null = null
  let defaultServings = input.servings && input.servings > 0 ? input.servings : 2

  if (input.recipeId) {
    const { data: recipe } = await supabase
      .from('recipes')
      .select('title, image_url, servings')
      .eq('id', input.recipeId)
      .maybeSingle()

    if (recipe) {
      title = recipe.title
      imageSnapshot = recipe.image_url ?? null
      if (!input.servings && recipe.servings) {
        defaultServings = recipe.servings
      }
    }
  }

  const { data, error } = await supabase
    .from('meal_plan_items')
    .insert({
      user_id: user.id,
      meal_plan_id: null,
      recipe_id: input.recipeId ?? null,
      title,
      recipe_image_url_snapshot: imageSnapshot,
      date: input.date,
      meal_type: input.mealType,
      servings: defaultServings,
      notes: input.notes?.trim() || null,
      order_index: 0,
      is_cooked: false,
      cooking_session_id: null,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Could not add meal to plan.')
  return data
}

/**
 * Update an existing planned meal item.
 */
export async function updateMealPlanItem(
  input: UpdateMealPlanItemInput
): Promise<MealPlanItemRow> {
  const updates: {
    date?: string
    meal_type?: string
    servings?: number
    notes?: string | null
    is_cooked?: boolean
  } = {}

  if (input.date !== undefined) updates.date = input.date
  if (input.mealType !== undefined) updates.meal_type = input.mealType
  if (input.servings !== undefined) updates.servings = Math.max(1, input.servings)
  if (input.notes !== undefined) updates.notes = input.notes?.trim() || null
  if (input.isCooked !== undefined) updates.is_cooked = input.isCooked

  const { data, error } = await supabase
    .from('meal_plan_items')
    .update(updates as any)
    .eq('id', input.id)
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message || 'Could not update meal.')
  return data
}

/**
 * Toggle the cooked state of a planned meal item.
 */
export async function toggleMealPlanItemCooked(
  id: string,
  isCooked: boolean
): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_items')
    .update({ is_cooked: isCooked })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

/**
 * Delete a planned meal item.
 */
export async function deleteMealPlanItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_items')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
