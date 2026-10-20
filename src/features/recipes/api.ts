import { supabase } from '@/lib/supabase'
import type {
  Recipe,
  RecipeListItem,
  RecipeDetail,
  RecipeFilters,
  RecipeFilterOptions,
  HomeDashboardData,
  UpcomingMealItem,
  CookingSession,
} from './types'

/**
 * Formats a Date object into YYYY-MM-DD
 */
function getTodayISO(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Fetch home dashboard overview: user profile, stats, upcoming meals, and recent recipes.
 */
export async function fetchHomeDashboard(): Promise<HomeDashboardData> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      displayName: null,
      email: null,
      stats: { recipeCount: 0, favoriteCount: 0, upcomingMealCount: 0, cookingSessionCount: 0 },
      upcomingMeals: [],
      recentRecipes: [],
      recentCookingSessions: [],
    }
  }

  const today = getTodayISO()

  // Parallel fetching of dashboard data
  const [profileRes, recipesCountRes, recentRecipesRes, favoritesRes, upcomingMealsRes, cookSessionsRes] =
    await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
      supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase.from('favorites').select('recipe_id').eq('user_id', user.id),
      supabase
        .from('meal_plan_items')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('order_index', { ascending: true })
        .limit(6),
      supabase
        .from('cook_mode_sessions')
        .select('id, recipe_id, cooked_at, rating, notes')
        .eq('user_id', user.id)
        .order('cooked_at', { ascending: false })
        .limit(4),
    ])

  const favoriteIds = new Set((favoritesRes.data ?? []).map((f) => f.recipe_id))
  const recentRecipes: RecipeListItem[] = (recentRecipesRes.data ?? []).map((r) => ({
    ...(r as Recipe),
    isFavorite: favoriteIds.has(r.id),
  }))

  const rawMealItems = (upcomingMealsRes.data ?? []) as any[]
  const recipeIdsToFetch = Array.from(
    new Set(rawMealItems.map((m) => m.recipe_id).filter(Boolean))
  ) as string[]

  const recipeMap = new Map<string, any>()
  if (recipeIdsToFetch.length > 0) {
    const { data: matchedRecipes } = await supabase
      .from('recipes')
      .select('id, title, image_url, cook_time, difficulty')
      .in('id', recipeIdsToFetch)

    matchedRecipes?.forEach((r) => recipeMap.set(r.id, r))
  }

  const upcomingMeals: UpcomingMealItem[] = rawMealItems.map((m) => ({
    id: m.id,
    user_id: m.user_id,
    recipe_id: m.recipe_id,
    title: m.title,
    recipe_image_url_snapshot: m.recipe_image_url_snapshot,
    date: m.date,
    meal_type: m.meal_type,
    servings: m.servings,
    notes: m.notes,
    is_cooked: m.is_cooked,
    recipe: m.recipe_id ? recipeMap.get(m.recipe_id) ?? null : null,
  }))

  // Build cooking sessions with recipe data
  const rawSessions = (cookSessionsRes.data ?? []) as any[]
  const sessionRecipeIds = Array.from(
    new Set(rawSessions.map((s) => s.recipe_id).filter(Boolean))
  ) as string[]

  const sessionRecipeMap = new Map<string, any>()
  if (sessionRecipeIds.length > 0) {
    const { data: sessionRecipes } = await supabase
      .from('recipes')
      .select('id, title, image_url')
      .in('id', sessionRecipeIds)
    sessionRecipes?.forEach((r) => sessionRecipeMap.set(r.id, r))
  }

  const recentCookingSessions: CookingSession[] = rawSessions.map((s) => ({
    id: s.id,
    recipe_id: s.recipe_id,
    cooked_at: s.cooked_at,
    rating: s.rating,
    notes: s.notes,
    recipe: s.recipe_id ? sessionRecipeMap.get(s.recipe_id) ?? null : null,
  }))

  const userDisplayName =
    profileRes.data?.display_name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'Chef'

  return {
    displayName: userDisplayName,
    email: user.email ?? null,
    stats: {
      recipeCount: recipesCountRes.count ?? recentRecipes.length,
      favoriteCount: favoriteIds.size,
      upcomingMealCount: upcomingMeals.length,
      cookingSessionCount: recentCookingSessions.length,
    },
    upcomingMeals,
    recentRecipes,
    recentCookingSessions,
  }
}

/**
 * Fetch recipe library with multi-field search, filtering, and sorting.
 */
export async function fetchRecipes(filters: RecipeFilters = {}): Promise<RecipeListItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  // Always fetch user's favorites to establish favorite state
  const { data: favs } = await supabase
    .from('favorites')
    .select('recipe_id')
    .eq('user_id', user.id)

  const favoriteIds = new Set((favs ?? []).map((f) => f.recipe_id))

  let query = supabase.from('recipes').select('*').eq('user_id', user.id)

  // 1. Favorites filter
  if (filters.favoriteOnly) {
    const favArray = Array.from(favoriteIds)
    if (favArray.length === 0) {
      return []
    }
    query = query.in('id', favArray)
  }

  // 2. Difficulty filter
  if (filters.difficulty && filters.difficulty !== 'all') {
    query = query.eq('difficulty', filters.difficulty)
  }

  // 3. Cuisine filter
  if (filters.cuisine && filters.cuisine !== 'all') {
    query = query.ilike('cuisine', filters.cuisine)
  }

  // 4. Category filter
  if (filters.category && filters.category !== 'all') {
    query = query.ilike('category', filters.category)
  }

  // 5. Max Cook Time
  if (filters.maxCookTime && filters.maxCookTime > 0) {
    query = query.lte('cook_time', filters.maxCookTime)
  }

  // 6. Search query (title, description, cuisine, category)
  if (filters.search && filters.search.trim()) {
    const cleanSearch = filters.search.trim().replace(/[%_]/g, '')
    query = query.or(
      `title.ilike.%${cleanSearch}%,description.ilike.%${cleanSearch}%,cuisine.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`
    )
  }

  // 7. Sorting
  switch (filters.sortBy) {
    case 'cook_time':
      query = query.order('cook_time', { ascending: true, nullsFirst: false })
      break
    case 'alpha':
      query = query.order('title', { ascending: true })
      break
    case 'rating':
      query = query.order('rating', { ascending: false, nullsFirst: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
      break
  }

  const { data, error } = await query

  if (error) {
    console.error('[fetchRecipes] error:', error.message)
    throw new Error(error.message)
  }

  return (data ?? []).map((r) => ({
    ...(r as Recipe),
    isFavorite: favoriteIds.has(r.id),
  }))
}

/**
 * Fetch available filter options (cuisines, categories) from the user's recipe library.
 */
export async function fetchRecipeFilterOptions(): Promise<RecipeFilterOptions> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { cuisines: [], categories: [], difficulties: ['easy', 'medium', 'hard'] }
  }

  const { data } = await supabase
    .from('recipes')
    .select('cuisine, category')
    .eq('user_id', user.id)

  const cuisines = new Set<string>()
  const categories = new Set<string>()

  data?.forEach((r) => {
    if (r.cuisine?.trim()) cuisines.add(r.cuisine.trim())
    if (r.category?.trim()) categories.add(r.category.trim())
  })

  return {
    cuisines: Array.from(cuisines).sort(),
    categories: Array.from(categories).sort(),
    difficulties: ['easy', 'medium', 'hard'],
  }
}

/**
 * Fetch a single recipe with ingredients, instructions, tags, and favorite status.
 */
export async function fetchRecipeDetail(id: string): Promise<RecipeDetail | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [recipeRes, ingredientsRes, instructionsRes, tagsRes, favoriteRes] =
    await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', id)
        .order('order_index', { ascending: true }),
      supabase
        .from('recipe_instructions')
        .select('*')
        .eq('recipe_id', id)
        .order('step_number', { ascending: true }),
      supabase
        .from('recipe_tags')
        .select('tag_id, tags:tag_id(name)')
        .eq('recipe_id', id),
      user
        ? supabase
            .from('favorites')
            .select('recipe_id')
            .eq('user_id', user.id)
            .eq('recipe_id', id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

  if (recipeRes.error || !recipeRes.data) {
    return null
  }

  const recipe = recipeRes.data as Recipe
  const ingredients = (ingredientsRes.data ?? []) as any[]
  const instructions = (instructionsRes.data ?? []) as any[]

  const tagNames: string[] = []
  if (tagsRes.data) {
    tagsRes.data.forEach((t: any) => {
      if (t.tags?.name) tagNames.push(t.tags.name)
    })
  }

  const isFavorite = Boolean(favoriteRes.data)

  return {
    ...recipe,
    ingredients,
    instructions,
    tags: tagNames,
    isFavorite,
  }
}

/**
 * Toggle favorite status for a recipe in the database.
 */
export async function toggleRecipeFavorite(
  recipeId: string,
  isCurrentlyFavorite: boolean
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to manage favorites.')
  }

  if (isCurrentlyFavorite) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('recipe_id', recipeId)

    if (error) throw new Error(error.message)
    return false
  } else {
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: user.id, recipe_id: recipeId })

    if (error) throw new Error(error.message)
    return true
  }
}
