/**
 * Aurelia Mobile — Edit Planned Meal Bottom Sheet Modal
 */

import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  X,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Circle,
  UtensilsCrossed,
  Flame,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import type {
  MealType,
  MealPlanItemWithRecipe,
  UpdateMealPlanItemInput,
} from '@/features/meal-planner/types'

interface EditMealSheetProps {
  visible: boolean
  onClose: () => void
  meal: MealPlanItemWithRecipe | null
  onUpdateMeal: (input: UpdateMealPlanItemInput) => Promise<void>
  onDeleteMeal: (id: string) => Promise<void>
  onViewRecipe: (recipeId: string) => void
  onStartCookMode?: (recipeId: string, servings?: number) => void
}

const MEAL_TYPES: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: 'Breakfast' },
  { type: 'lunch', label: 'Lunch' },
  { type: 'dinner', label: 'Dinner' },
  { type: 'snack', label: 'Snack' },
]

export function EditMealSheet({
  visible,
  onClose,
  meal,
  onUpdateMeal,
  onDeleteMeal,
  onViewRecipe,
  onStartCookMode,
}: EditMealSheetProps) {
  const insets = useSafeAreaInsets()
  const { colors, typography, radii, spacing, shadows } = useAureliaTheme()

  const [servings, setServings] = useState(2)
  const [mealType, setMealType] = useState<MealType>('dinner')
  const [isCooked, setIsCooked] = useState(false)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (meal) {
      setServings(meal.servings || 2)
      setMealType(meal.meal_type)
      setIsCooked(meal.is_cooked)
      setNotes(meal.notes || '')
      setSubmitting(false)
      setErrorMessage(null)
    }
  }, [meal, visible])

  if (!meal) return null

  const imageUrl = meal.recipe?.image_url || meal.recipe_image_url_snapshot

  const handleSave = async () => {
    setSubmitting(true)
    setErrorMessage(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    try {
      await onUpdateMeal({
        id: meal.id,
        servings,
        mealType,
        isCooked,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update meal.')
      setSubmitting(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      'Remove Planned Meal',
      `Are you sure you want to remove "${meal.title}" from your meal plan?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
            try {
              await onDeleteMeal(meal.id)
              onClose()
            } catch (err: any) {
              setErrorMessage(err.message || 'Failed to remove meal.')
            }
          },
        },
      ]
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />
          <View style={styles.headerRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[typography.cardTitle, { color: colors.foreground }]} numberOfLines={1}>
                {meal.title}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                {meal.date}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close edit meal"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recipe Card Preview if recipe-based */}
          <View
            style={[
              styles.recipeBanner,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
              },
            ]}
          >
            <View
              style={[
                styles.bannerThumb,
                { backgroundColor: colors.secondary, borderRadius: radii.small },
              ]}
            >
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.thumbImage} />
              ) : (
                <UtensilsCrossed size={20} color={colors.primary} />
              )}
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]} numberOfLines={1}>
                {meal.title}
              </Text>
              {meal.recipe_id && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 14 }}>
                  <Pressable
                    onPress={() => {
                      onClose()
                      onViewRecipe(meal.recipe_id!)
                    }}
                    style={styles.viewRecipeLink}
                    accessibilityRole="button"
                    accessibilityLabel="View full recipe detail"
                  >
                    <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                      View Recipe
                    </Text>
                    <ExternalLink size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                  </Pressable>

                  {onStartCookMode && (
                    <Pressable
                      testID="start-cook-mode-from-planner"
                      onPress={() => {
                        onClose()
                        onStartCookMode(meal.recipe_id!, servings)
                      }}
                      style={styles.viewRecipeLink}
                      accessibilityRole="button"
                      accessibilityLabel="Start Cook Mode for this planned meal"
                    >
                      <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                        Cook Mode
                      </Text>
                      <Flame size={12} color={colors.primary} style={{ marginLeft: 4 }} />
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Meal Slot Selector */}
          <View style={{ marginTop: 16 }}>
            <Text style={[typography.caption, { color: colors.mutedForeground, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }]}>
              MEAL SLOT
            </Text>
            <View style={styles.mealTypeRow}>
              {MEAL_TYPES.map((t) => {
                const isSelected = mealType === t.type
                return (
                  <Pressable
                    key={t.type}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                      setMealType(t.type)
                    }}
                    style={({ pressed }) => [
                      styles.typeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.card,
                        borderColor: isSelected ? colors.primary : colors.border,
                        borderRadius: radii.control,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={t.label}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <Text
                      style={[
                        typography.bodyMedium,
                        {
                          color: isSelected ? colors.primaryForeground : colors.foreground,
                          fontSize: 13,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Servings Stepper */}
          <View style={styles.formRow}>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
                Planned Servings
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                Adjust portion count
              </Text>
            </View>

            <View style={styles.stepperContainer}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                  setServings((s) => Math.max(1, s - 1))
                }}
                disabled={servings <= 1}
                style={({ pressed }) => [
                  styles.stepperButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.pill,
                    opacity: servings <= 1 ? 0.4 : pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Decrease servings"
              >
                <Minus size={16} color={colors.foreground} />
              </Pressable>

              <Text style={[typography.cardTitle, styles.stepperValue, { color: colors.foreground }]}>
                {servings}
              </Text>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                  setServings((s) => s + 1)
                }}
                style={({ pressed }) => [
                  styles.stepperButton,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.pill,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Increase servings"
              >
                <Plus size={16} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          {/* Cooked Status Toggle */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
              setIsCooked((c) => !c)
            }}
            style={[
              styles.cookedRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
              },
            ]}
            accessibilityRole="checkbox"
            accessibilityLabel="Mark as cooked"
            accessibilityState={{ checked: isCooked }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
                Mark as Cooked
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                Track completed meals for this week
              </Text>
            </View>

            {isCooked ? (
              <CheckCircle2 size={24} color={colors.primary} />
            ) : (
              <Circle size={24} color={colors.border} />
            )}
          </Pressable>

          {/* Notes Input */}
          <View style={{ marginTop: 16 }}>
            <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginBottom: 6 }]}>
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add specific notes, leftover tags..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                typography.body,
                styles.notesInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.control,
                  color: colors.foreground,
                },
              ]}
              multiline
              maxLength={200}
              accessibilityLabel="Meal notes"
            />
          </View>

          {/* Remove from plan action */}
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              {
                borderColor: colors.destructive + '60',
                borderRadius: radii.control,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Remove meal from plan"
          >
            <Trash2 size={16} color={colors.destructive} style={{ marginRight: 6 }} />
            <Text style={[typography.bodyMedium, { color: colors.destructive, fontWeight: '600' }]}>
              Remove from Plan
            </Text>
          </Pressable>

          {errorMessage && (
            <Text style={[typography.caption, { color: colors.destructive, marginTop: 12 }]}>
              {errorMessage}
            </Text>
          )}
        </ScrollView>

        {/* Footer */}
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
            onPress={handleSave}
            disabled={submitting}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.control,
                opacity: submitting ? 0.7 : pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save meal changes"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                Save Changes
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  recipeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
  },
  bannerThumb: {
    width: 44,
    height: 44,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  viewRecipeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepperButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 18,
  },
  cookedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  notesInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 46,
    marginTop: 24,
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
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
})
