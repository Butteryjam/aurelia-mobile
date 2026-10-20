import type { RecipeListItem } from '@/features/recipes/types'

export interface CollectionItem {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image_url: string | null
  created_at: string
  updated_at: string
  recipe_count: number
  preview_image_urls?: string[]
}

export interface CollectionDetailData {
  collection: CollectionItem
  recipes: RecipeListItem[]
}

export interface CreateCollectionInput {
  name: string
  description?: string | null
  coverImageUrl?: string | null
}

export interface UpdateCollectionInput {
  name?: string
  description?: string | null
  coverImageUrl?: string | null
}
