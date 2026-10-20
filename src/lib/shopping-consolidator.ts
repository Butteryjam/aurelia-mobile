/**
 * Aurelia Mobile — Smart Shopping List Consolidator & Natural Language Item Parser
 *
 * Safety contract:
 * - ONLY consolidates items when units are demonstrably compatible.
 * - Never converts between unit families (volume ↔ weight, piece ↔ weight, etc.).
 * - Preserves recipe attribution and unmerged items.
 * - Items with no unit or unknown units are kept separate.
 */

import { scaleQuantity } from './quantity-scaler'

export interface ShoppingItem {
  name: string
  quantity: string | number | null
  unit: string | null
  category: string | null
  recipeId: string | null
  recipeTitle?: string
}

export interface ConsolidatedItem {
  name: string
  quantity: string | null
  unit: string | null
  category: string | null
  recipeIds: string[]
  recipeAttributions: string[]
}

export const AISLE_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Refrigerated',
  'Bakery',
  'Pantry & Dry Goods',
  'Frozen',
  'Spices & Seasonings',
  'Beverages',
  'Other',
] as const

export type AisleCategory = (typeof AISLE_CATEGORIES)[number]

/**
 * Predicts standard grocery aisle category based on ingredient name.
 */
export function categorizeItem(name: string): AisleCategory {
  const lower = name.toLowerCase().trim()

  if (
    /apple|banana|orange|lemon|lime|onion|garlic|tomato|potato|herb|basil|rosemary|thyme|spinach|kale|lettuce|carrot|celery|pepper|avocado|mushroom|ginger|cucumber|zucchini|broccoli|berry|strawberry|blueberry/i.test(
      lower
    )
  ) {
    return 'Produce'
  }

  if (/chicken|beef|steak|pork|bacon|sausage|turkey|salmon|shrimp|fish|tuna|cod|mince|meat|prawn/i.test(
      lower
    )
  ) {
    return 'Meat & Seafood'
  }

  if (/ice cream|frozen|waffle|popsicle/i.test(lower)) {
    return 'Frozen'
  }

  if (
    /milk|cream|butter|cheese|parmesan|cheddar|mozzarella|yogurt|egg|sour cream|ricotta|ghee/i.test(
      lower
    )
  ) {
    return 'Dairy & Refrigerated'
  }

  if (/bread|bun|baguette|tortilla|pita|sourdough|croissant|roll/i.test(lower)) {
    return 'Bakery'
  }

  if (
    /oil|olive oil|flour|sugar|pasta|spaghetti|rice|bean|chickpea|lentil|sauce|canned|broth|stock|vinegar|honey|nut|almond|walnut|oats/i.test(
      lower
    )
  ) {
    return 'Pantry & Dry Goods'
  }

  if (/salt|pepper|paprika|cumin|oregano|cinnamon|turmeric|coriander|chili flakes|nutmeg|bay leaf|seasoning/i.test(lower)) {
    return 'Spices & Seasonings'
  }

  if (/coffee|tea|juice|wine|beer|soda|sparkling water|cider/i.test(lower)) {
    return 'Beverages'
  }

  return 'Other'
}

export const UNIT_ALIASES: Record<string, string> = {
  // Volume – metric
  ml: 'ml',
  milliliter: 'ml',
  milliliters: 'ml',
  millilitre: 'ml',
  millilitres: 'ml',
  l: 'l',
  liter: 'l',
  liters: 'l',
  litre: 'l',
  litres: 'l',
  // Volume – imperial / US
  tsp: 'tsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tbsp: 'tbsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  'fluid oz': 'fl oz',
  'fl oz': 'fl oz',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  cup: 'cup',
  cups: 'cup',
  pint: 'pt',
  pints: 'pt',
  pt: 'pt',
  quart: 'qt',
  quarts: 'qt',
  qt: 'qt',
  gallon: 'gal',
  gallons: 'gal',
  gal: 'gal',
  // Weight – metric
  g: 'g',
  gram: 'g',
  grams: 'g',
  gramme: 'g',
  grammes: 'g',
  kg: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  // Weight – imperial
  oz: 'oz',
  ounce: 'oz',
  ounces: 'oz',
  lb: 'lb',
  lbs: 'lb',
  pound: 'lb',
  pounds: 'lb',
  // Count
  piece: 'piece',
  pieces: 'piece',
  slice: 'slice',
  slices: 'slice',
  whole: 'whole',
  can: 'can',
  cans: 'can',
  clove: 'clove',
  cloves: 'clove',
  bottle: 'bottle',
  bottles: 'bottle',
  jar: 'jar',
  jars: 'jar',
  box: 'box',
  boxes: 'box',
  bag: 'bag',
  bags: 'bag',
  bunch: 'bunch',
  bunches: 'bunch',
  package: 'pkg',
  packages: 'pkg',
  pkg: 'pkg',
  pkgs: 'pkg',
}

export function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) return null
  const key = raw.trim().toLowerCase()
  return UNIT_ALIASES[key] ?? null
}

function parseQtyToFloat(qty: string | number | null | undefined): number | null {
  if (qty == null) return null
  if (typeof qty === 'number') return isNaN(qty) ? null : qty
  const s = String(qty).trim()
  if (!s) return null

  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixed) {
    const den = parseInt(mixed[3], 10)
    if (den === 0) return null
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / den
  }

  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (frac) {
    const den = parseInt(frac[2], 10)
    if (den === 0) return null
    return parseInt(frac[1], 10) / den
  }

  const num = parseFloat(s)
  return isNaN(num) ? null : num
}

/**
 * Consolidate a flat list of shopping items.
 */
export function consolidateItems(items: ShoppingItem[]): ConsolidatedItem[] {
  const map = new Map<string, ConsolidatedItem & { totalFloat: number | null }>()
  const unmerged: ConsolidatedItem[] = []

  for (const item of items) {
    const normalizedName = item.name.trim().toLowerCase()
    const canonicalUnit = normalizeUnit(item.unit)

    if (canonicalUnit !== null) {
      const key = `${normalizedName}||${canonicalUnit}`
      const existing = map.get(key)
      const parsed = parseQtyToFloat(item.quantity)

      if (existing) {
        if (parsed !== null && existing.totalFloat !== null) {
          existing.totalFloat += parsed
        } else {
          unmerged.push({
            name: item.name.trim(),
            quantity: item.quantity != null ? String(item.quantity) : null,
            unit: item.unit,
            category: item.category || categorizeItem(item.name),
            recipeIds: item.recipeId ? [item.recipeId] : [],
            recipeAttributions: item.recipeTitle ? [item.recipeTitle] : [],
          })
          continue
        }

        if (item.recipeId && !existing.recipeIds.includes(item.recipeId)) {
          existing.recipeIds.push(item.recipeId)
        }
        if (item.recipeTitle && !existing.recipeAttributions.includes(item.recipeTitle)) {
          existing.recipeAttributions.push(item.recipeTitle)
        }
      } else {
        map.set(key, {
          name: item.name.trim(),
          quantity: item.quantity != null ? String(item.quantity) : null,
          unit: item.unit,
          category: item.category || categorizeItem(item.name),
          totalFloat: parsed,
          recipeIds: item.recipeId ? [item.recipeId] : [],
          recipeAttributions: item.recipeTitle ? [item.recipeTitle] : [],
        })
      }
    } else {
      unmerged.push({
        name: item.name.trim(),
        quantity: item.quantity != null ? String(item.quantity) : null,
        unit: item.unit,
        category: item.category || categorizeItem(item.name),
        recipeIds: item.recipeId ? [item.recipeId] : [],
        recipeAttributions: item.recipeTitle ? [item.recipeTitle] : [],
      })
    }
  }

  const merged: ConsolidatedItem[] = Array.from(map.values()).map(
    ({ totalFloat, ...rest }) => ({
      ...rest,
      quantity:
        totalFloat !== null
          ? scaleQuantity(totalFloat.toString(), 1, 1)
          : rest.quantity,
    })
  )

  return [...merged, ...unmerged]
}

/**
 * Natural-language parser for manually typed shopping items.
 *
 * Examples:
 *   "2 lbs apples"        → { quantity: "2", unit: "lb", name: "apples" }
 *   "6 eggs"              → { quantity: "6", unit: null, name: "eggs" }
 *   "1 bottle olive oil"  → preserved gracefully with natural parsing
 *   "1/2 tsp salt"        → { quantity: "1/2", unit: "tsp", name: "salt" }
 */
export function parseManualItem(raw: string): {
  name: string
  quantity: string | null
  unit: string | null
  category: AisleCategory
} {
  const s = raw.trim()
  if (!s) return { name: s, quantity: null, unit: null, category: 'Other' }

  const QTY = String.raw`(?:\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)`
  const unitKeys = Object.keys(UNIT_ALIASES)
    .sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'))
  const UNIT = unitKeys.join('|')

  const pattern = new RegExp(`^(${QTY})\\s*(${UNIT})(?:\\s+(.+))?$`, 'i')
  const match = s.match(pattern)

  if (match) {
    const [, qty, unit, rest] = match
    const name = rest?.trim() || unit
    return {
      quantity: qty ?? null,
      unit: normalizeUnit(unit) ?? unit ?? null,
      name,
      category: categorizeItem(name),
    }
  }

  // Fallback: quantity only ("6 eggs")
  const qtyOnly = new RegExp(`^(${QTY})\\s+(.+)$`)
  const qMatch = s.match(qtyOnly)
  if (qMatch) {
    const name = qMatch[2]?.trim() ?? s
    return {
      quantity: qMatch[1] ?? null,
      unit: null,
      name,
      category: categorizeItem(name),
    }
  }

  // Preserved as-is
  return {
    name: s,
    quantity: null,
    unit: null,
    category: categorizeItem(s),
  }
}
