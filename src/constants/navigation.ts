import React from 'react'
import {
  Compass,
  BookOpen,
  CalendarDays,
  Sparkles,
  MoreHorizontal,
  FolderArchive,
  ShoppingCart,
  Heart,
  Settings,
} from 'lucide-react-native'

export interface TabConfig {
  name: string
  label: string
  icon: React.ComponentType<{ size: number; color: string }>
}

export interface HubItem {
  id: string
  title: string
  subtitle: string
  route: string
  icon: React.ComponentType<{ size: number; color: string }>
}

/**
 * Authoritative 5-Tab Navigation Configuration for Aurelia
 */
export const TABS: TabConfig[] = [
  { name: 'home', label: 'Home', icon: Compass },
  { name: 'recipes', label: 'Recipes', icon: BookOpen },
  { name: 'planner', label: 'Planner', icon: CalendarDays },
  { name: 'chef', label: 'AI Chef', icon: Sparkles },
  { name: 'more', label: 'More', icon: MoreHorizontal },
]

/**
 * More Hub Navigation Destinations
 */
export const MORE_HUB_ITEMS: HubItem[] = [
  {
    id: 'collections',
    title: 'Collections',
    subtitle: 'Curated folders and thematic cookbooks',
    route: '/(app)/collections',
    icon: FolderArchive,
  },
  {
    id: 'shopping',
    title: 'Shopping',
    subtitle: 'Consolidated grocery lists and aisles',
    route: '/(app)/shopping',
    icon: ShoppingCart,
  },
  {
    id: 'favorites',
    title: 'Favorites',
    subtitle: 'Quick access to your most cherished dishes',
    route: '/(app)/favorites',
    icon: Heart,
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Preferences, dietary rules, and account profile',
    route: '/(app)/settings',
    icon: Settings,
  },
]

/**
 * Architectural Placeholder Routes required for Phase B
 */
export const ARCHITECTURAL_ROUTES = [
  'recipe/[id]',
  'recipe/new',
  'recipe/[id]/edit',
  'recipe/import',
  'cook/[id]',
  'collections',
  'collections/[id]',
  'shopping/[id]',
  'favorites',
  'settings',
] as const
