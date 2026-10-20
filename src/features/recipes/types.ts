export type RecipeDifficulty = 'easy' | 'medium' | 'hard'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type RecipeSortOption = 'newest' | 'cook_time' | 'alpha' | 'rating'

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  image_url: string | null
  prep_time: number | null
  cook_time: number | null
  total_time: number | null
  servings: number | null
  difficulty: RecipeDifficulty | null
  cuisine: string | null
  category: string | null
  notes: string | null
  rating: number | null
  source_url: string | null
  nutrition_facts?: any
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface RecipeListItem extends Recipe {
  isFavorite: boolean
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_id?: string | null
  name: string
  quantity: string | null
  unit: string | null
  order_index: number
  is_optional: boolean
  preparation_note: string | null
}

export interface RecipeInstruction {
  id: string
  recipe_id: string
  step_number: number
  instruction: string
  timer_duration: number | null
}

export interface RecipeDetail extends Recipe {
  ingredients: RecipeIngredient[]
  instructions: RecipeInstruction[]
  tags: string[]
  isFavorite: boolean
}

export interface RecipeFilters {
  search?: string
  sortBy?: RecipeSortOption
  favoriteOnly?: boolean
  difficulty?: 'all' | RecipeDifficulty
  cuisine?: string
  category?: string
  maxCookTime?: number | null
}

export interface RecipeFilterOptions {
  cuisines: string[]
  categories: string[]
  difficulties: RecipeDifficulty[]
}

export interface UpcomingMealItem {
  id: string
  user_id: string
  recipe_id: string | null
  title: string
  recipe_image_url_snapshot: string | null
  date: string
  meal_type: MealType
  servings: number
  notes: string | null
  is_cooked: boolean
  recipe?: {
    id?: string
    title?: string
    image_url?: string | null
    cook_time?: number | null
    difficulty?: RecipeDifficulty | null
  } | null
}

export interface DashboardStats {
  recipeCount: number
  favoriteCount: number
  upcomingMealCount: number
  cookingSessionCount: number
}

export interface CookingSession {
  id: string
  recipe_id: string | null
  cooked_at: string | null
  rating: number | null
  notes: string | null
  recipe?: {
    title?: string
    image_url?: string | null
  } | null
}

export interface HomeDashboardData {
  displayName: string | null
  email: string | null
  stats: DashboardStats
  upcomingMeals: UpcomingMealItem[]
  recentRecipes: RecipeListItem[]
  recentCookingSessions: CookingSession[]
}
