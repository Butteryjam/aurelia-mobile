import React, { useState, useEffect, useMemo } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  Search,
  SlidersHorizontal,
  X,
  Plus,
  BookOpen,
  ArrowUpDown,
  Sparkles,
  Trash2,
  Check,
  Minus,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import {
  useRecipes,
  useRecipeFilterOptions,
  useToggleFavorite,
  useBulkDeleteRecipes,
} from '@/features/recipes/hooks'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { FilterBottomSheet } from '@/components/recipes/filter-bottom-sheet'
import { EmptyState } from '@/components/common/empty-state'
import { SkeletonRecipeCard } from '@/components/common/skeleton'
import type { RecipeFilters, RecipeSortOption } from '@/features/recipes/types'

const SORT_OPTIONS: Array<{ label: string; value: RecipeSortOption }> = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Cook Time', value: 'cook_time' },
  { label: 'Alphabetical', value: 'alpha' },
  { label: 'Highest Rated', value: 'rating' },
]

export default function RecipesTabScreen() {
  const router = useRouter()
  const { colors, typography, spacing, radii } = useAureliaTheme()

  // Search state with debouncing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Filter & sort state
  const [filters, setFilters] = useState<RecipeFilters>({
    sortBy: 'newest',
    favoriteOnly: false,
    difficulty: 'all',
    cuisine: undefined,
    category: undefined,
    maxCookTime: null,
  })

  const [isFilterSheetVisible, setFilterSheetVisible] = useState(false)
  const [isSortMenuVisible, setSortMenuVisible] = useState(false)

  // Debounce search input by 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 350)
    return () => clearTimeout(handler)
  }, [searchInput])

  const activeFilters = useMemo<RecipeFilters>(
    () => ({
      ...filters,
      search: debouncedSearch.trim() || undefined,
    }),
    [filters, debouncedSearch]
  )

  const { data: recipes, isLoading, isError, refetch, isRefetching } = useRecipes(activeFilters)
  const { data: filterOptions } = useRecipeFilterOptions()
  const toggleFavorite = useToggleFavorite()
  const bulkDeleteMutation = useBulkDeleteRecipes()

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Scoped selection calculations
  const allSelected = useMemo(
    () => Boolean(recipes && recipes.length > 0 && recipes.every((r) => selectedIds.has(r.id))),
    [recipes, selectedIds]
  )
  const someSelected = useMemo(
    () => Boolean(recipes && recipes.some((r) => selectedIds.has(r.id)) && !allSelected),
    [recipes, selectedIds, allSelected]
  )

  const handleToggleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set((recipes ?? []).map((r) => r.id)))
    }
  }

  const handleToggleRecipe = React.useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleExitSelectionMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setIsSelectionMode(false)
    setSelectedIds(new Set())
  }

  const handleBulkDelete = () => {
    const count = selectedIds.size
    if (count === 0 || bulkDeleteMutation?.isPending) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    Alert.alert(
      `Delete ${count} ${count === 1 ? 'recipe' : 'recipes'}?`,
      'The selected recipes will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Delete ${count} ${count === 1 ? 'Recipe' : 'Recipes'}`,
          style: 'destructive',
          onPress: async () => {
            try {
              await bulkDeleteMutation.mutateAsync(Array.from(selectedIds))
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
              setSelectedIds(new Set())
              setIsSelectionMode(false)
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete recipes.')
            }
          },
        },
      ]
    )
  }

  // Calculate active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.favoriteOnly) count++
    if (filters.difficulty && filters.difficulty !== 'all') count++
    if (filters.maxCookTime) count++
    if (filters.cuisine && filters.cuisine !== 'all') count++
    if (filters.category && filters.category !== 'all') count++
    return count
  }, [filters])

  const handleFavoriteToggle = React.useCallback(
    (recipeId: string, currentStatus: boolean) => {
      toggleFavorite.mutate({ recipeId, isCurrentlyFavorite: currentStatus })
    },
    [toggleFavorite]
  )

  const handleClearSearch = () => {
    setSearchInput('')
    setDebouncedSearch('')
  }

  const handleClearAllFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setFilters({
      sortBy: 'newest',
      favoriteOnly: false,
      difficulty: 'all',
      cuisine: undefined,
      category: undefined,
      maxCookTime: null,
    })
  }

  const handleCycleSort = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const currentIndex = SORT_OPTIONS.findIndex((s) => s.value === filters.sortBy)
    const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length
    setFilters((prev) => ({ ...prev, sortBy: SORT_OPTIONS[nextIndex].value }))
  }

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.value === filters.sortBy)?.label || 'Newest'

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Header with Title & Add Recipe action */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View>
          <Text style={[typography.eyebrow, { color: colors.primary }]}>
            Culinary Catalog
          </Text>
          <Text style={[typography.pageTitle, { color: colors.foreground, fontSize: 26, marginTop: 2 }]}>
            Recipes
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              if (isSelectionMode) {
                handleExitSelectionMode()
              } else {
                setIsSelectionMode(true)
                setSelectedIds(new Set())
              }
            }}
            disabled={!recipes || recipes.length === 0}
            style={({ pressed }) => [
              styles.headerSelectBtn,
              {
                backgroundColor: isSelectionMode ? colors.primary : colors.card,
                borderColor: isSelectionMode ? colors.primary : colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.8 : 1,
                marginRight: 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isSelectionMode ? 'Exit selection mode' : 'Enter selection mode'}
          >
            <Text
              style={{
                color: isSelectionMode ? colors.primaryForeground : colors.foreground,
                fontSize: 13,
                fontWeight: '600',
              }}
            >
              {isSelectionMode ? 'Done' : 'Select'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/recipe/new')}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.pill,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create New Recipe"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={18} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </View>

      {/* 2. Search & Filter Bar */}
      <View style={styles.searchBarRow}>
        <View
          style={[
            styles.searchInputContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.control,
            },
          ]}
        >
          <Search size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            value={searchInput}
            onChangeText={setSearchInput}
            placeholder="Search recipes, ingredients..."
            placeholderTextColor={colors.mutedForeground}
            style={[typography.body, styles.input, { color: colors.foreground }]}
            returnKeyType="search"
            accessibilityLabel="Search recipe catalog"
          />
          {searchInput.length > 0 && (
            <Pressable
              onPress={handleClearSearch}
              style={styles.clearSearchBtn}
              accessibilityRole="button"
              accessibilityLabel="Clear search input"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filter Sheet Trigger */}
        <Pressable
          onPress={() => setFilterSheetVisible(true)}
          style={({ pressed }) => [
            styles.filterTrigger,
            {
              backgroundColor: activeFilterCount > 0 ? colors.primary + '18' : colors.card,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
              borderRadius: radii.control,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Filter recipes. ${activeFilterCount} active filters.`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <SlidersHorizontal
            size={18}
            color={activeFilterCount > 0 ? colors.primary : colors.foreground}
          />
          {activeFilterCount > 0 && (
            <View
              style={[
                styles.badge,
                { backgroundColor: colors.primary, borderRadius: radii.pill },
              ]}
            >
              <Text style={{ color: colors.primaryForeground, fontSize: 10, fontWeight: '700' }}>
                {activeFilterCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* 3. Sort & Quick Filter Chips Strip */}
      <View style={styles.pillsStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {/* Sort Button Pill */}
          <Pressable
            onPress={handleCycleSort}
            style={[
              styles.pill,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Sort by: ${currentSortLabel}. Tap to change.`}
          >
            <ArrowUpDown size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
            <Text style={[typography.caption, { color: colors.foreground, fontSize: 12, fontWeight: '500' }]}>
              {currentSortLabel}
            </Text>
          </Pressable>

          {/* Quick Filter: Favorites Only */}
          <Pressable
            onPress={() =>
              setFilters((prev) => ({ ...prev, favoriteOnly: !prev.favoriteOnly }))
            }
            style={[
              styles.pill,
              {
                backgroundColor: filters.favoriteOnly ? colors.primary : colors.card,
                borderColor: filters.favoriteOnly ? colors.primary : colors.border,
                borderRadius: radii.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter by favorites only"
          >
            <Text
              style={[
                typography.caption,
                {
                  color: filters.favoriteOnly ? colors.primaryForeground : colors.foreground,
                  fontSize: 12,
                  fontWeight: filters.favoriteOnly ? '600' : '400',
                },
              ]}
            >
              ★ Favorites
            </Text>
          </Pressable>

          {/* Quick Filter: Quick (< 30 min) */}
          <Pressable
            onPress={() =>
              setFilters((prev) => ({
                ...prev,
                maxCookTime: prev.maxCookTime === 30 ? null : 30,
              }))
            }
            style={[
              styles.pill,
              {
                backgroundColor: filters.maxCookTime === 30 ? colors.primary : colors.card,
                borderColor: filters.maxCookTime === 30 ? colors.primary : colors.border,
                borderRadius: radii.pill,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Filter under 30 minutes cook time"
          >
            <Text
              style={[
                typography.caption,
                {
                  color: filters.maxCookTime === 30 ? colors.primaryForeground : colors.foreground,
                  fontSize: 12,
                  fontWeight: filters.maxCookTime === 30 ? '600' : '400',
                },
              ]}
            >
              &lt; 30 min
            </Text>
          </Pressable>

          {/* Active difficulty pill if selected */}
          {filters.difficulty && filters.difficulty !== 'all' && (
            <Pressable
              onPress={() => setFilters((prev) => ({ ...prev, difficulty: 'all' }))}
              style={[
                styles.pill,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: radii.pill,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.primaryForeground, fontSize: 12, fontWeight: '600' }]}>
                {filters.difficulty.toUpperCase()} ✕
              </Text>
            </Pressable>
          )}

          {/* Active cuisine pill if selected */}
          {filters.cuisine && filters.cuisine !== 'all' && (
            <Pressable
              onPress={() => setFilters((prev) => ({ ...prev, cuisine: undefined }))}
              style={[
                styles.pill,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                  borderRadius: radii.pill,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.primaryForeground, fontSize: 12, fontWeight: '600' }]}>
                {filters.cuisine} ✕
              </Text>
            </Pressable>
          )}

          {/* Clear all pill if multiple filters active */}
          {activeFilterCount > 1 && (
            <Pressable
              onPress={handleClearAllFilters}
              style={[
                styles.pill,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderRadius: radii.pill,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                Clear All
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>

      {/* Bulk Selection Bar */}
      {isSelectionMode && recipes && recipes.length > 0 && (
        <View
          style={[
            styles.selectionBar,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
            },
          ]}
        >
          <View style={styles.selectionBarLeft}>
            <Pressable
              onPress={handleToggleSelectAll}
              style={[
                styles.selectAllControl,
                {
                  backgroundColor: allSelected ? colors.primary : colors.secondary,
                  borderColor: allSelected ? colors.primary : colors.border,
                  borderRadius: radii.small,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: allSelected }}
            >
              {allSelected ? (
                <Check size={14} color={colors.primaryForeground} strokeWidth={3} />
              ) : someSelected ? (
                <Minus size={14} color={colors.foreground} strokeWidth={3} />
              ) : null}
              <Text
                style={{
                  color: allSelected ? colors.primaryForeground : colors.foreground,
                  fontSize: 12,
                  fontWeight: '600',
                  marginLeft: 5,
                }}
              >
                {allSelected ? 'Deselect All' : `Select All (${recipes.length})`}
              </Text>
            </Pressable>

            <Text
              style={[
                typography.caption,
                { color: colors.mutedForeground, marginLeft: 10, fontSize: 12 },
              ]}
            >
              {selectedIds.size} {selectedIds.size === 1 ? 'recipe' : 'recipes'} selected
            </Text>
          </View>

          <View style={styles.selectionBarRight}>
            <Pressable
              onPress={handleBulkDelete}
              disabled={selectedIds.size === 0 || (bulkDeleteMutation?.isPending ?? false)}
              style={({ pressed }) => [
                styles.deleteSelectedButton,
                {
                  backgroundColor: selectedIds.size > 0 ? colors.destructive : colors.muted,
                  borderRadius: radii.small,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${selectedIds.size} selected recipes`}
            >
              {bulkDeleteMutation?.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Trash2
                    size={14}
                    color={selectedIds.size > 0 ? '#FFFFFF' : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      color: selectedIds.size > 0 ? '#FFFFFF' : colors.mutedForeground,
                      fontSize: 12,
                      fontWeight: '600',
                      marginLeft: 5,
                    }}
                  >
                    Delete ({selectedIds.size})
                  </Text>
                </>
              )}
            </Pressable>

            <Pressable
              onPress={handleExitSelectionMode}
              style={({ pressed }) => [
                styles.cancelSelectionButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Cancel selection mode"
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 12, fontWeight: '500' }}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 4. Recipe Catalog List */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent}>
          <SkeletonRecipeCard />
          <SkeletonRecipeCard />
        </ScrollView>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon={BookOpen}
            title="Failed to load recipes"
            description="We were unable to retrieve your culinary collection. Please check your network."
            actionLabel="Retry"
            onAction={() => refetch()}
          />
        </View>
      ) : recipes && recipes.length > 0 ? (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              recipe={item}
              onToggleFavorite={handleFavoriteToggle}
              isFavoriteLoading={toggleFavorite.isPending}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id)}
              onToggleSelect={handleToggleRecipe}
            />
          )}
          contentContainerStyle={styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      ) : debouncedSearch.length > 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon={Search}
            title="No recipes found"
            description={`No dishes match "${debouncedSearch}". Try another search term or clear the filter.`}
            actionLabel="Clear Search"
            onAction={handleClearSearch}
          />
        </View>
      ) : activeFilterCount > 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon={SlidersHorizontal}
            title="No matching dishes"
            description="No recipes in your vault match the currently active filter parameters."
            actionLabel="Reset Filters"
            onAction={handleClearAllFilters}
          />
        </View>
      ) : (
        <View style={styles.centerContainer}>
          <EmptyState
            icon={BookOpen}
            title="Your vault is empty"
            description="Build your personal cookbook by creating signature dishes or importing recipes from the web."
            actionLabel="Create Recipe"
            onAction={() => router.push('/(app)/recipe/new')}
            secondaryActionLabel="Import Recipe"
            onSecondaryAction={() => router.push('/(app)/recipe/import')}
          />
        </View>
      )}

      {/* 5. Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={isFilterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters)
          setFilterSheetVisible(false)
        }}
        availableCuisines={filterOptions?.cuisines ?? []}
        availableCategories={filterOptions?.categories ?? []}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionBar: {
    marginHorizontal: 20,
    marginBottom: 8,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllControl: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  selectionBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  cancelSelectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterTrigger: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsStrip: {
    paddingVertical: 6,
  },
  pillsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 32,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 48,
  },
  centerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
})
