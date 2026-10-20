/**
 * Aurelia Mobile — Meal Planner Tab Screen
 *
 * Full-featured mobile culinary week organizer:
 * - Horizontal week navigation & day selector
 * - Meal slots: Breakfast, Lunch, Dinner, Snacks
 * - Cooked status tracking
 * - Servings adjustments
 * - Day nutrition summary
 * - Export to Shopping List
 */

import React, { useState, useMemo, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShoppingCart,
  Plus,
  RefreshCw,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import {
  useMealPlanWeek,
  useAddMealPlanItem,
  useUpdateMealPlanItem,
  useToggleMealCooked,
  useDeleteMealPlanItem,
} from '@/features/meal-planner/hooks'
import {
  formatDateToISO,
  getWeekRange,
  calculateDayNutrition,
} from '@/features/meal-planner/utils'
import { DaySelector } from '@/components/planner/day-selector'
import { MealSlotSection } from '@/components/planner/meal-slot'
import { NutritionSummaryCard } from '@/components/planner/nutrition-summary-card'
import { AddMealSheet } from '@/components/planner/add-meal-sheet'
import { EditMealSheet } from '@/components/planner/edit-meal-sheet'
import { ExportShoppingModal } from '@/components/planner/export-shopping-modal'
import type {
  MealType,
  MealPlanItemWithRecipe,
  AddMealPlanItemInput,
  UpdateMealPlanItemInput,
} from '@/features/meal-planner/types'

export default function PlannerTabScreen() {
  const router = useRouter()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  // Week navigation state (reference date ISO)
  const [currentReferenceDate, setCurrentReferenceDate] = useState<string>(() =>
    formatDateToISO(new Date())
  )

  const weekRange = useMemo(() => getWeekRange(currentReferenceDate), [currentReferenceDate])

  // Selected day state (defaults to today if in current week, else Monday)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayISO = formatDateToISO(new Date())
    const initialRange = getWeekRange(todayISO)
    return todayISO >= initialRange.startDate && todayISO <= initialRange.endDate
      ? todayISO
      : initialRange.startDate
  })

  // Sheet / Modal visibility
  const [addSheetVisible, setAddSheetVisible] = useState(false)
  const [targetMealType, setTargetMealType] = useState<MealType>('dinner')

  const [editSheetVisible, setEditSheetVisible] = useState(false)
  const [selectedMealToEdit, setSelectedMealToEdit] = useState<MealPlanItemWithRecipe | null>(null)

  const [exportModalVisible, setExportModalVisible] = useState(false)

  // React Query hooks for active week
  const {
    data: days,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useMealPlanWeek(weekRange.startDate, weekRange.endDate)

  const addMealMutation = useAddMealPlanItem(weekRange.startDate, weekRange.endDate)
  const updateMealMutation = useUpdateMealPlanItem(weekRange.startDate, weekRange.endDate)
  const toggleCookedMutation = useToggleMealCooked(weekRange.startDate, weekRange.endDate)
  const deleteMealMutation = useDeleteMealPlanItem(weekRange.startDate, weekRange.endDate)

  // Navigate weeks
  const handlePrevWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const newRef = weekRange.prevWeekDate
    setCurrentReferenceDate(newRef)
    const newRange = getWeekRange(newRef)
    setSelectedDate(newRange.startDate)
  }

  const handleNextWeek = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    const newRef = weekRange.nextWeekDate
    setCurrentReferenceDate(newRef)
    const newRange = getWeekRange(newRef)
    setSelectedDate(newRange.startDate)
  }

  const handleJumpToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    const todayISO = formatDateToISO(new Date())
    setCurrentReferenceDate(todayISO)
    setSelectedDate(todayISO)
  }

  // Selected day object
  const currentDayMeals = useMemo(() => {
    if (!days || days.length === 0) return null
    return days.find((d) => d.date === selectedDate) ?? days[0]
  }, [days, selectedDate])

  // All meals for selected day (for nutrition calculation)
  const allMealsForSelectedDay = useMemo(() => {
    if (!currentDayMeals) return []
    return [
      ...currentDayMeals.slots.breakfast,
      ...currentDayMeals.slots.lunch,
      ...currentDayMeals.slots.dinner,
      ...currentDayMeals.slots.snack,
    ]
  }, [currentDayMeals])

  // Nutrition summary
  const nutritionSummary = useMemo(() => {
    return calculateDayNutrition(allMealsForSelectedDay)
  }, [allMealsForSelectedDay])

  // Open add sheet
  const handleOpenAddMeal = useCallback((mealType: MealType) => {
    setTargetMealType(mealType)
    setAddSheetVisible(true)
  }, [])

  // Open edit sheet
  const handleOpenEditMeal = useCallback((meal: MealPlanItemWithRecipe) => {
    setSelectedMealToEdit(meal)
    setEditSheetVisible(true)
  }, [])

  // Toggle cooked
  const handleToggleCooked = useCallback(
    (mealId: string, currentCooked: boolean) => {
      toggleCookedMutation.mutate({ id: mealId, isCooked: !currentCooked })
    },
    [toggleCookedMutation]
  )

  const handleAddMealSubmit = async (input: AddMealPlanItemInput) => {
    await addMealMutation.mutateAsync(input)
  }

  const handleUpdateMealSubmit = async (input: UpdateMealPlanItemInput) => {
    await updateMealMutation.mutateAsync(input)
  }

  const handleDeleteMealSubmit = async (id: string) => {
    await deleteMealMutation.mutateAsync(id)
  }

  const handleViewRecipe = (recipeId: string) => {
    router.push(`/(app)/recipe/${recipeId}`)
  }

  const isCurrentRealWeek =
    weekRange.currentWeekDate === weekRange.startDate

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
        <View style={styles.headerLeft}>
          <Text style={[typography.eyebrow, { color: colors.primary }]}>
            Culinary Rhythm
          </Text>
          <Text style={[typography.pageTitle, { color: colors.foreground, marginTop: 2 }]}>
            Meal Planner
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Today Button */}
          {!isCurrentRealWeek && (
            <Pressable
              onPress={handleJumpToToday}
              style={({ pressed }) => [
                styles.todayButton,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary + '60',
                  borderRadius: radii.pill,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Jump to current week"
            >
              <Calendar size={13} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                Today
              </Text>
            </Pressable>
          )}

          {/* Export to Shopping Button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              setExportModalVisible(true)
            }}
            style={({ pressed }) => [
              styles.exportButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Export to Shopping List"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ShoppingCart size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {/* Week Navigator Bar */}
      <View style={[styles.weekBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handlePrevWeek}
          style={({ pressed }) => [
            styles.weekNavBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Previous week"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>

        <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
          {weekRange.formattedRange}
        </Text>

        <Pressable
          onPress={handleNextWeek}
          style={({ pressed }) => [
            styles.weekNavBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next week"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Loading State */}
        {isLoading && !days ? (
          <View style={styles.centeredContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[typography.body, { color: colors.mutedForeground, marginTop: 12 }]}>
              Loading meal plan...
            </Text>
          </View>
        ) : isError ? (
          /* Error State */
          <View style={styles.centeredContainer}>
            <Text style={[typography.cardTitle, { color: colors.destructive }]}>
              Could not load meal plan
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
              accessibilityLabel="Retry loading meal plan"
            >
              <RefreshCw size={16} color={colors.primaryForeground} style={{ marginRight: 6 }} />
              <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : days && currentDayMeals ? (
          /* Content State */
          <>
            {/* Day Selector */}
            <DaySelector
              days={days}
              selectedDate={selectedDate}
              onSelectDate={(date) => setSelectedDate(date)}
            />

            {/* Selected Day Header */}
            <View style={styles.dayTitleRow}>
              <View>
                <Text style={[typography.cardTitle, { color: colors.foreground, fontSize: 18 }]}>
                  {currentDayMeals.dayName}
                </Text>
                <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                  {currentDayMeals.monthShort} {currentDayMeals.dayNumber}
                  {currentDayMeals.isToday ? ' • Today' : ''}
                </Text>
              </View>

              <Pressable
                onPress={() => handleOpenAddMeal('dinner')}
                style={({ pressed }) => [
                  styles.quickAddPill,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.pill,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Quick add meal"
              >
                <Plus size={14} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                  Add Meal
                </Text>
              </Pressable>
            </View>

            {/* Nutrition Summary (if data exists) */}
            <NutritionSummaryCard summary={nutritionSummary} />

            {/* Meal Slots */}
            <MealSlotSection
              mealType="breakfast"
              meals={currentDayMeals.slots.breakfast}
              onAddMeal={handleOpenAddMeal}
              onEditMeal={handleOpenEditMeal}
              onToggleCooked={handleToggleCooked}
            />

            <MealSlotSection
              mealType="lunch"
              meals={currentDayMeals.slots.lunch}
              onAddMeal={handleOpenAddMeal}
              onEditMeal={handleOpenEditMeal}
              onToggleCooked={handleToggleCooked}
            />

            <MealSlotSection
              mealType="dinner"
              meals={currentDayMeals.slots.dinner}
              onAddMeal={handleOpenAddMeal}
              onEditMeal={handleOpenEditMeal}
              onToggleCooked={handleToggleCooked}
            />

            <MealSlotSection
              mealType="snack"
              meals={currentDayMeals.slots.snack}
              onAddMeal={handleOpenAddMeal}
              onEditMeal={handleOpenEditMeal}
              onToggleCooked={handleToggleCooked}
            />
          </>
        ) : null}
      </ScrollView>

      {/* Add Meal Sheet */}
      <AddMealSheet
        visible={addSheetVisible}
        onClose={() => setAddSheetVisible(false)}
        date={selectedDate}
        mealType={targetMealType}
        onAddMeal={handleAddMealSubmit}
      />

      {/* Edit Meal Sheet */}
      <EditMealSheet
        visible={editSheetVisible}
        onClose={() => {
          setEditSheetVisible(false)
          setSelectedMealToEdit(null)
        }}
        meal={selectedMealToEdit}
        onUpdateMeal={handleUpdateMealSubmit}
        onDeleteMeal={handleDeleteMealSubmit}
        onViewRecipe={handleViewRecipe}
        onStartCookMode={(recipeId, servings) => {
          setEditSheetVisible(false)
          setSelectedMealToEdit(null)
          router.push({
            pathname: '/(app)/cook/[id]',
            params: { id: recipeId, servings: servings ? String(servings) : undefined },
          })
        }}
      />

      {/* Export to Shopping Modal */}
      {currentDayMeals && days && (
        <ExportShoppingModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          selectedDay={currentDayMeals}
          allWeekDays={days}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
  },
  exportButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  weekNavBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  dayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minHeight: 44,
  },
})
