/**
 * Aurelia Mobile — Export Meal Plan to Shopping List Modal
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  X,
  ShoppingCart,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useActiveShoppingList, useGenerateShoppingFromMealPlan } from '@/features/shopping/hooks'
import type { DayMeals } from '@/features/meal-planner/types'

interface ExportShoppingModalProps {
  visible: boolean
  onClose: () => void
  selectedDay: DayMeals
  allWeekDays: DayMeals[]
}

export function ExportShoppingModal({
  visible,
  onClose,
  selectedDay,
  allWeekDays,
}: ExportShoppingModalProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { colors, typography, radii, spacing } = useAureliaTheme()

  const [scope, setScope] = useState<'day' | 'week'>('week')
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: activeList, isLoading: listLoading } = useActiveShoppingList()
  const generateMutation = useGenerateShoppingFromMealPlan()

  // Collect recipe meal IDs for current selection
  const dayRecipeMealIds = [
    ...selectedDay.slots.breakfast,
    ...selectedDay.slots.lunch,
    ...selectedDay.slots.dinner,
    ...selectedDay.slots.snack,
  ]
    .filter((m) => Boolean(m.recipe_id))
    .map((m) => m.id)

  const weekRecipeMealIds = allWeekDays
    .flatMap((d) => [
      ...d.slots.breakfast,
      ...d.slots.lunch,
      ...d.slots.dinner,
      ...d.slots.snack,
    ])
    .filter((m) => Boolean(m.recipe_id))
    .map((m) => m.id)

  const activeMealIds = scope === 'day' ? dayRecipeMealIds : weekRecipeMealIds

  const handleExport = async () => {
    if (!activeList) {
      setErrorMessage('No active shopping list found.')
      return
    }

    if (activeMealIds.length === 0) {
      setErrorMessage('None of the chosen planned meals have recipe ingredients to export.')
      return
    }

    setErrorMessage(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    try {
      const res = await generateMutation.mutateAsync({
        shoppingListId: activeList.id,
        plannedItemIds: activeMealIds,
      })
      setSuccessCount(res.addedCount)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to export ingredients.')
    }
  }

  const handleGoToShopping = () => {
    onClose()
    if (activeList) {
      router.push(`/(app)/shopping/${activeList.id}`)
    } else {
      router.push('/(app)/shopping' as any)
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />
          <View style={styles.headerRow}>
            <View>
              <Text style={[typography.cardTitle, { color: colors.foreground }]}>
                Export to Shopping
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                Target: {activeList?.name || 'Weekly Groceries'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close export modal"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {successCount !== null ? (
            /* Success State */
            <View style={styles.successContainer}>
              <View
                style={[
                  styles.successIconWrapper,
                  { backgroundColor: colors.secondary, borderRadius: radii.pill },
                ]}
              >
                <CheckCircle2 size={40} color={colors.primary} />
              </View>

              <Text style={[typography.pageTitle, { color: colors.foreground, textAlign: 'center', marginTop: 16 }]}>
                Ingredients Exported!
              </Text>

              <Text style={[typography.body, { color: colors.mutedForeground, textAlign: 'center', marginTop: 8 }]}>
                {successCount} ingredients have been safely scaled and consolidated into your "{activeList?.name || 'Weekly Groceries'}" list.
              </Text>

              <Pressable
                onPress={handleGoToShopping}
                style={({ pressed }) => [
                  styles.viewListButton,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.control,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="View Shopping List"
              >
                <ShoppingCart size={18} color={colors.primaryForeground} style={{ marginRight: 8 }} />
                <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                  Open Shopping List
                </Text>
                <ArrowRight size={16} color={colors.primaryForeground} style={{ marginLeft: 8 }} />
              </Pressable>
            </View>
          ) : (
            /* Form / Scope Selection */
            <>
              <Text style={[typography.body, { color: colors.mutedForeground, lineHeight: 22, marginBottom: 20 }]}>
                Automatically scale and aggregate ingredients from your planned meals. Compatible units will be consolidated while preserving recipe attributions.
              </Text>

              <Text style={[typography.caption, { color: colors.mutedForeground, fontWeight: '700', marginBottom: 10, letterSpacing: 0.5 }]}>
                SELECT RANGE
              </Text>

              {/* Scope Options */}
              <View style={styles.scopeOptions}>
                {/* Entire Week */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                    setScope('week')
                  }}
                  style={({ pressed }) => [
                    styles.scopeCard,
                    {
                      backgroundColor: scope === 'week' ? colors.secondary : colors.card,
                      borderColor: scope === 'week' ? colors.primary : colors.border,
                      borderRadius: radii.card,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: scope === 'week' }}
                  accessibilityLabel="Entire Week"
                >
                  <CalendarDays size={20} color={scope === 'week' ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
                      Entire Week
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                      {weekRecipeMealIds.length} recipe {weekRecipeMealIds.length === 1 ? 'meal' : 'meals'} with ingredients
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: scope === 'week' ? colors.primary : colors.border,
                        backgroundColor: scope === 'week' ? colors.primary : 'transparent',
                      },
                    ]}
                  />
                </Pressable>

                {/* Selected Day */}
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                    setScope('day')
                  }}
                  style={({ pressed }) => [
                    styles.scopeCard,
                    {
                      backgroundColor: scope === 'day' ? colors.secondary : colors.card,
                      borderColor: scope === 'day' ? colors.primary : colors.border,
                      borderRadius: radii.card,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: scope === 'day' }}
                  accessibilityLabel={`Selected Day: ${selectedDay.dayName}`}
                >
                  <Calendar size={20} color={scope === 'day' ? colors.primary : colors.mutedForeground} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
                      {selectedDay.dayName} Only
                    </Text>
                    <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                      {dayRecipeMealIds.length} recipe {dayRecipeMealIds.length === 1 ? 'meal' : 'meals'} with ingredients
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: scope === 'day' ? colors.primary : colors.border,
                        backgroundColor: scope === 'day' ? colors.primary : 'transparent',
                      },
                    ]}
                  />
                </Pressable>
              </View>

              {errorMessage && (
                <Text style={[typography.caption, { color: colors.destructive, marginTop: 16 }]}>
                  {errorMessage}
                </Text>
              )}
            </>
          )}
        </ScrollView>

        {/* Action Button */}
        {successCount === null && (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <Pressable
              onPress={handleExport}
              disabled={generateMutation.isPending || activeMealIds.length === 0}
              style={({ pressed }) => [
                styles.exportButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.control,
                  opacity:
                    generateMutation.isPending || activeMealIds.length === 0
                      ? 0.5
                      : pressed
                      ? 0.88
                      : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Generate grocery items"
            >
              {generateMutation.isPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <ShoppingCart size={18} color={colors.primaryForeground} style={{ marginRight: 8 }} />
                  <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                    Generate Grocery Items ({activeMealIds.length} meals)
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  scopeOptions: {
    gap: 12,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIconWrapper: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    width: '100%',
    marginTop: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
})
