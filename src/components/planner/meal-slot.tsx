/**
 * Aurelia Mobile — Meal Planner Slot Section & Planned Meal Card
 */

import React from 'react'
import { StyleSheet, View, Text, Pressable, Image } from 'react-native'
import {
  Coffee,
  Sun,
  UtensilsCrossed,
  Apple,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Users,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import type { MealType, MealPlanItemWithRecipe } from '@/features/meal-planner/types'

interface MealSlotSectionProps {
  mealType: MealType
  meals: MealPlanItemWithRecipe[]
  onAddMeal: (mealType: MealType) => void
  onEditMeal: (meal: MealPlanItemWithRecipe) => void
  onToggleCooked: (mealId: string, currentCooked: boolean) => void
}

const SLOT_CONFIG: Record<
  MealType,
  { title: string; icon: React.ComponentType<{ size: number; color: string }> }
> = {
  breakfast: { title: 'Breakfast', icon: Coffee },
  lunch: { title: 'Lunch', icon: Sun },
  dinner: { title: 'Dinner', icon: UtensilsCrossed },
  snack: { title: 'Snacks', icon: Apple },
}

export function MealSlotSection({
  mealType,
  meals,
  onAddMeal,
  onEditMeal,
  onToggleCooked,
}: MealSlotSectionProps) {
  const { colors, typography, radii, spacing, shadows } = useAureliaTheme()
  const config = SLOT_CONFIG[mealType]
  const IconComp = config.icon

  return (
    <View style={styles.sectionContainer}>
      {/* Slot Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: colors.secondary, borderRadius: radii.pill },
            ]}
          >
            <IconComp size={16} color={colors.primary} />
          </View>
          <Text style={[typography.cardTitle, { color: colors.foreground, marginLeft: 8, fontSize: 16 }]}>
            {config.title}
          </Text>
          {meals.length > 0 && (
            <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 6 }]}>
              ({meals.length})
            </Text>
          )}
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            onAddMeal(mealType)
          }}
          style={({ pressed }) => [
            styles.addSlotButton,
            { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${config.title} meal`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={16} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Planned Meals List */}
      {meals.length > 0 ? (
        <View style={styles.cardsList}>
          {meals.map((meal) => {
            const isCooked = meal.is_cooked
            const imageUrl = meal.recipe?.image_url || meal.recipe_image_url_snapshot

            return (
              <Pressable
                key={meal.id}
                onPress={() => onEditMeal(meal)}
                style={({ pressed }) => [
                  styles.mealCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: isCooked ? colors.border + '80' : colors.border,
                    borderRadius: radii.card,
                    opacity: isCooked ? 0.82 : pressed ? 0.9 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${meal.title}, ${meal.servings} servings${isCooked ? ', cooked' : ''}. Tap to edit.`}
              >
                {/* Thumbnail */}
                <View
                  style={[
                    styles.thumbnailContainer,
                    { backgroundColor: colors.secondary, borderRadius: radii.small },
                  ]}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.thumbnail} />
                  ) : (
                    <UtensilsCrossed size={18} color={colors.primary} />
                  )}
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: isCooked ? colors.mutedForeground : colors.foreground,
                        textDecorationLine: isCooked ? 'line-through' : 'none',
                        fontWeight: '600',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {meal.title}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Users size={12} color={colors.mutedForeground} />
                      <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 4 }]}>
                        {meal.servings} {meal.servings === 1 ? 'serv' : 'servs'}
                      </Text>
                    </View>

                    {meal.recipe?.cook_time ? (
                      <View style={[styles.metaItem, { marginLeft: 10 }]}>
                        <Clock size={12} color={colors.mutedForeground} />
                        <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 4 }]}>
                          {meal.recipe.cook_time}m
                        </Text>
                      </View>
                    ) : null}

                    {meal.notes ? (
                      <Text
                        style={[typography.caption, { color: colors.primary, marginLeft: 10 }]}
                        numberOfLines={1}
                      >
                        • Note
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Cooked Toggle Button */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation()
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                    onToggleCooked(meal.id, isCooked)
                  }}
                  style={({ pressed }) => [
                    styles.cookedToggle,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Mark ${meal.title} as ${isCooked ? 'uncooked' : 'cooked'}`}
                  accessibilityState={{ checked: isCooked }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {isCooked ? (
                    <CheckCircle2 size={22} color={colors.primary} />
                  ) : (
                    <Circle size={22} color={colors.border} />
                  )}
                </Pressable>
              </Pressable>
            )
          })}
        </View>
      ) : (
        /* Empty Slot Action */
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            onAddMeal(mealType)
          }}
          style={({ pressed }) => [
            styles.emptySlot,
            {
              borderColor: colors.border,
              borderRadius: radii.card,
              backgroundColor: pressed ? colors.muted + '40' : 'transparent',
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${config.title}`}
        >
          <Plus size={16} color={colors.mutedForeground} style={{ marginRight: 6 }} />
          <Text style={[typography.body, { color: colors.mutedForeground, fontSize: 14 }]}>
            Add {config.title}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSlotButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardsList: {
    gap: 8,
  },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    minHeight: 64,
  },
  thumbnailContainer: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cookedToggle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
