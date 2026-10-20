/**
 * Aurelia Mobile — Shopping List Screen
 *
 * Full mobile shopping experience:
 * - List title & progress indicator
 * - Grouped aisle/category sections
 * - Instant optimistic check & uncheck
 * - Natural-language manual item entry ("2 lbs apples", "6 eggs")
 * - Recipe attribution tags
 * - Clear completed items with confirmation
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  RefreshControl,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ChevronLeft,
  ShoppingCart,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import {
  useActiveShoppingList,
  useShoppingList,
  useToggleShoppingItem,
  useAddManualShoppingItem,
  useDeleteShoppingItem,
  useClearCompletedShoppingItems,
} from '@/features/shopping/hooks'
import { ShoppingItemRow } from '@/components/shopping/shopping-item-row'
import { AISLE_CATEGORIES, type AisleCategory } from '@/lib/shopping-consolidator'
import type { ShoppingListItem, ShoppingListWithItems } from '@/features/shopping/types'

export default function ShoppingListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const [newItemText, setNewItemText] = useState('')
  const [addingItem, setAddingItem] = useState(false)

  const isSpecialActive = !id || id === 'active'

  // Query: active list or list by ID
  const activeQuery = useActiveShoppingList()
  const specificQuery = useShoppingList(isSpecialActive ? '' : id)

  const currentQuery = isSpecialActive ? activeQuery : specificQuery
  const { data: list, isLoading, isError, error, refetch, isRefetching } = currentQuery

  const activeListId = list?.id || ''

  // Mutations
  const toggleItemMutation = useToggleShoppingItem(activeListId)
  const addManualMutation = useAddManualShoppingItem(activeListId)
  const deleteItemMutation = useDeleteShoppingItem(activeListId)
  const clearCompletedMutation = useClearCompletedShoppingItems(activeListId)

  // Items stats
  const items: ShoppingListItem[] = list?.items || []
  const totalCount = items.length
  const completedCount = items.filter((it) => it.is_checked).length
  const progressRatio = totalCount > 0 ? completedCount / totalCount : 0
  const progressPercent = Math.round(progressRatio * 100)

  // Group items by aisle category
  const groupedSections = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>()

    // Initialize all standard categories in order
    AISLE_CATEGORIES.forEach((cat) => map.set(cat, []))

    items.forEach((item) => {
      const cat = item.category || 'Other'
      if (!map.has(cat)) {
        map.set(cat, [])
      }
      map.get(cat)!.push(item)
    })

    // Filter to only sections that contain items
    const sections: { category: string; items: ShoppingListItem[] }[] = []
    map.forEach((catItems, cat) => {
      if (catItems.length > 0) {
        sections.push({ category: cat, items: catItems })
      }
    })

    return sections
  }, [items])

  // Handle toggle with optimistic update
  const handleToggle = useCallback(
    (itemId: string, currentChecked: boolean) => {
      toggleItemMutation.mutate({ itemId, isChecked: !currentChecked })
    },
    [toggleItemMutation]
  )

  // Handle delete item
  const handleDelete = useCallback(
    (itemId: string) => {
      deleteItemMutation.mutate(itemId)
    },
    [deleteItemMutation]
  )

  // Handle add manual item
  const handleAddManualItem = async () => {
    const trimmed = newItemText.trim()
    if (!trimmed || !activeListId) return

    setAddingItem(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

    try {
      await addManualMutation.mutateAsync(trimmed)
      setNewItemText('')
    } catch (err) {
      // Handled by react query
    } finally {
      setAddingItem(false)
    }
  }

  // Handle clear completed items
  const handleClearCompleted = () => {
    if (completedCount === 0) return

    Alert.alert(
      'Clear Completed Items',
      `Remove ${completedCount} completed ${completedCount === 1 ? 'item' : 'items'} from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Completed',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
            clearCompletedMutation.mutate()
          },
        },
      ]
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.navBackButton,
              { opacity: pressed ? 0.6 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 19 }]} numberOfLines={1}>
              {list?.name || 'Shopping List'}
            </Text>
            {totalCount > 0 && (
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                {completedCount} of {totalCount} items checked ({progressPercent}%)
              </Text>
            )}
          </View>

          {completedCount > 0 && (
            <Pressable
              onPress={handleClearCompleted}
              style={({ pressed }) => [
                styles.clearButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Clear completed items"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={colors.destructive} />
            </Pressable>
          )}
        </View>

        {/* Progress Bar (if items exist) */}
        {totalCount > 0 && (
          <View style={[styles.progressTrack, { backgroundColor: colors.border + '50' }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        )}

        {/* Content Area */}
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {isLoading && !list ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.body, { color: colors.mutedForeground, marginTop: 12 }]}>
                Loading shopping list...
              </Text>
            </View>
          ) : isError ? (
            <View style={styles.centeredContainer}>
              <Text style={[typography.cardTitle, { color: colors.destructive }]}>
                Could not load shopping list
              </Text>
              <Text style={[typography.body, { color: colors.mutedForeground, textAlign: 'center', marginTop: 6 }]}>
                {error?.message || 'Please check your connection and try again.'}
              </Text>
              <Pressable
                onPress={() => refetch()}
                style={[
                  styles.retryButton,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.control,
                    marginTop: 16,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Retry loading shopping list"
              >
                <RefreshCw size={16} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : items.length === 0 ? (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: colors.secondary, borderRadius: radii.pill },
                ]}
              >
                <ShoppingCart size={36} color={colors.primary} />
              </View>

              <Text style={[typography.pageTitle, { color: colors.foreground, textAlign: 'center', marginTop: 16 }]}>
                List is Empty
              </Text>

              <Text style={[typography.body, { color: colors.mutedForeground, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 }]}>
                Add grocery items using natural language below, or generate items directly from your planned meals.
              </Text>

              <Pressable
                onPress={() => router.push('/(app)/(tabs)/planner')}
                style={({ pressed }) => [
                  styles.goToPlannerButton,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.control,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go to Meal Planner"
              >
                <Calendar size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
                  Open Meal Planner
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Grouped Aisle Sections */
            <View style={styles.sectionsContainer}>
              {groupedSections.map(({ category, items: catItems }) => (
                <View key={category} style={styles.aisleSection}>
                  <View style={styles.aisleHeader}>
                    <Text
                      style={[
                        typography.caption,
                        { color: colors.mutedForeground, fontWeight: '700', letterSpacing: 0.8 },
                      ]}
                    >
                      {category.toUpperCase()}
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 6 }]}>
                      ({catItems.length})
                    </Text>
                  </View>

                  {catItems.map((item) => (
                    <ShoppingItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Natural Language Sticky Add Bar */}
        <View
          style={[
            styles.entryBar,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            value={newItemText}
            onChangeText={setNewItemText}
            placeholder="Add item (e.g. '2 lbs apples', '6 eggs')..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              typography.body,
              styles.entryInput,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                borderRadius: radii.control,
                color: colors.foreground,
              },
            ]}
            returnKeyType="done"
            onSubmitEditing={handleAddManualItem}
            accessibilityLabel="Add shopping item"
          />

          <Pressable
            onPress={handleAddManualItem}
            disabled={!newItemText.trim() || addingItem}
            style={({ pressed }) => [
              styles.entryAddButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.control,
                opacity: !newItemText.trim() || addingItem ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Add item to list"
          >
            {addingItem ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Plus size={20} color={colors.primaryForeground} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBackButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitleContainer: {
    flex: 1,
  },
  clearButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressFill: {
    height: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  sectionsContainer: {
    paddingBottom: 20,
  },
  aisleSection: {
    marginBottom: 20,
  },
  aisleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: 2,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 44,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goToPlannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    marginTop: 24,
  },
  entryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    gap: 10,
  },
  entryInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 15,
  },
  entryAddButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
