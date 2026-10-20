/**
 * Aurelia Mobile — Shopping List Types
 */

import type { Database } from '@/types/database'
import type { AisleCategory } from '@/lib/shopping-consolidator'

export type ShoppingListRow = Database['public']['Tables']['shopping_lists']['Row']
export type ShoppingListItemRow = Database['public']['Tables']['shopping_list_items']['Row']

export interface ShoppingList extends ShoppingListRow {}

export interface ShoppingListItem extends ShoppingListItemRow {
  recipe_title?: string | null
}

export interface ShoppingListWithItems extends ShoppingList {
  items: ShoppingListItem[]
}

export interface AisleSection {
  title: AisleCategory
  items: ShoppingListItem[]
  completedCount: number
  totalCount: number
}

export interface AddManualItemInput {
  shoppingListId: string
  rawText: string
}

export interface GenerateShoppingInput {
  shoppingListId: string
  plannedItemIds: string[]
}
