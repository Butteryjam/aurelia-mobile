import { supabase } from '@/lib/supabase'
import type {
  CollectionItem,
  CollectionDetailData,
  CreateCollectionInput,
  UpdateCollectionInput,
} from './types'
import type { Recipe, RecipeListItem } from '@/features/recipes/types'

/**
 * Fetch all collections belonging to current user with recipe count and preview covers.
 */
export async function fetchCollections(): Promise<CollectionItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: collections, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error || !collections) {
    console.error('[fetchCollections] Error:', error)
    return []
  }

  // Get recipe links for user's collections
  const { data: colRecipes } = await supabase
    .from('collection_recipes')
    .select('collection_id, recipe_id')

  const countMap = new Map<string, number>()
  const recipeIdsByCol = new Map<string, string[]>()

  colRecipes?.forEach((cr) => {
    countMap.set(cr.collection_id, (countMap.get(cr.collection_id) ?? 0) + 1)
    const list = recipeIdsByCol.get(cr.collection_id) || []
    if (list.length < 3) list.push(cr.recipe_id)
    recipeIdsByCol.set(cr.collection_id, list)
  })

  // Fetch preview recipe images for collections without a custom cover
  const allPreviewRecipeIds = Array.from(
    new Set(Array.from(recipeIdsByCol.values()).flat())
  )

  const recipeImageMap = new Map<string, string>()
  if (allPreviewRecipeIds.length > 0) {
    const { data: recipes } = await supabase
      .from('recipes')
      .select('id, image_url')
      .in('id', allPreviewRecipeIds)

    recipes?.forEach((r) => {
      if (r.image_url) recipeImageMap.set(r.id, r.image_url)
    })
  }

  return collections.map((col) => {
    const previewIds = recipeIdsByCol.get(col.id) || []
    const previewImages = previewIds
      .map((rid) => recipeImageMap.get(rid))
      .filter((img): img is string => Boolean(img))

    return {
      ...col,
      recipe_count: countMap.get(col.id) ?? 0,
      preview_image_urls: previewImages,
    }
  })
}

/**
 * Fetch single collection detail and its contained recipes.
 */
export async function fetchCollectionDetail(id: string): Promise<CollectionDetailData | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const [colRes, linksRes, favsRes] = await Promise.all([
    supabase.from('collections').select('*').eq('id', id).maybeSingle(),
    supabase.from('collection_recipes').select('recipe_id').eq('collection_id', id),
    supabase.from('favorites').select('recipe_id').eq('user_id', user.id),
  ])

  if (colRes.error || !colRes.data) {
    return null
  }

  const favoriteIds = new Set((favsRes.data ?? []).map((f) => f.recipe_id))
  const recipeIds = (linksRes.data ?? []).map((l) => l.recipe_id)

  let recipes: RecipeListItem[] = []
  if (recipeIds.length > 0) {
    const { data: fetchedRecipes } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds)
      .order('created_at', { ascending: false })

    if (fetchedRecipes) {
      recipes = fetchedRecipes.map((r) => ({
        ...(r as Recipe),
        isFavorite: favoriteIds.has(r.id),
      }))
    }
  }

  const collectionItem: CollectionItem = {
    ...colRes.data,
    recipe_count: recipes.length,
    preview_image_urls: recipes
      .map((r) => r.image_url)
      .filter((img): img is string => Boolean(img))
      .slice(0, 3),
  }

  return {
    collection: collectionItem,
    recipes,
  }
}

/**
 * Create a new recipe collection.
 */
export async function createCollection(input: CreateCollectionInput): Promise<{ id: string }> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to create a collection.')
  }

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      cover_image_url: input.coverImageUrl || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[createCollection] Error:', error)
    throw new Error(error?.message || 'Could not create collection.')
  }

  return { id: data.id }
}

/**
 * Update collection metadata (name, description, cover image).
 */
export async function updateCollection(
  id: string,
  input: UpdateCollectionInput
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to edit a collection.')
  }

  const updates: {
    name?: string
    description?: string | null
    cover_image_url?: string | null
    updated_at?: string
  } = {
    updated_at: new Date().toISOString(),
  }
  if (input.name !== undefined) updates.name = input.name.trim()
  if (input.description !== undefined) updates.description = input.description?.trim() || null
  if (input.coverImageUrl !== undefined) updates.cover_image_url = input.coverImageUrl || null

  const { error } = await supabase
    .from('collections')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[updateCollection] Error:', error)
    throw new Error(error.message || 'Could not update collection.')
  }
}

/**
 * Delete a collection.
 */
export async function deleteCollection(id: string): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to delete a collection.')
  }

  // Delete links first
  await supabase.from('collection_recipes').delete().eq('collection_id', id)

  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[deleteCollection] Error:', error)
    throw new Error(error.message || 'Could not delete collection.')
  }
}

/**
 * Add a recipe to a collection.
 */
export async function addRecipeToCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabase.from('collection_recipes').upsert({
    collection_id: collectionId,
    recipe_id: recipeId,
  })

  if (error) {
    console.error('[addRecipeToCollection] Error:', error)
    throw new Error(error.message || 'Could not add recipe to collection.')
  }
}

/**
 * Remove a recipe from a collection.
 */
export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
): Promise<void> {
  const { error } = await supabase
    .from('collection_recipes')
    .delete()
    .eq('collection_id', collectionId)
    .eq('recipe_id', recipeId)

  if (error) {
    console.error('[removeRecipeFromCollection] Error:', error)
    throw new Error(error.message || 'Could not remove recipe from collection.')
  }
}

/**
 * Fetch recipes owned by user that can be added to the collection.
 */
export async function fetchEligibleRecipesForCollection(
  collectionId: string
): Promise<RecipeListItem[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const [allRecipesRes, existingLinksRes, favsRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('user_id', user.id).order('title', { ascending: true }),
    supabase.from('collection_recipes').select('recipe_id').eq('collection_id', collectionId),
    supabase.from('favorites').select('recipe_id').eq('user_id', user.id),
  ])

  const existingIds = new Set((existingLinksRes.data ?? []).map((l) => l.recipe_id))
  const favIds = new Set((favsRes.data ?? []).map((f) => f.recipe_id))

  const eligible = (allRecipesRes.data ?? [])
    .filter((r) => !existingIds.has(r.id))
    .map((r) => ({
      ...(r as Recipe),
      isFavorite: favIds.has(r.id),
    }))

  return eligible
}
