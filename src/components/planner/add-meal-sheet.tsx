/**
 * Aurelia Mobile — Add Meal Bottom Sheet Modal
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
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  X,
  Search,
  Check,
  Plus,
  Minus,
  UtensilsCrossed,
  Clock,
  Users,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useRecipesForMealPicker } from '@/features/meal-planner/hooks'
import type { MealType, AddMealPlanItemInput, MealPlanRecipeSummary } from '@/features/meal-planner/types'

interface AddMealSheetProps {
  visible: boolean
  onClose: () => void
  date: string
  mealType: MealType
  onAddMeal: (input: AddMealPlanItemInput) => Promise<void>
}

const MEAL_TYPE_NAMES: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

export function AddMealSheet({
  visible,
  onClose,
  date,
  mealType,
  onAddMeal,
}: AddMealSheetProps) {
  const insets = useSafeAreaInsets()
  const { colors, typography, radii, spacing, shadows } = useAureliaTheme()

  const [search, setSearch] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState<MealPlanRecipeSummary | null>(null)
  const [customTitle, setCustomTitle] = useState('')
  const [servings, setServings] = useState(2)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: recipes, isLoading } = useRecipesForMealPicker(search)

  // Reset when opened or closed
  useEffect(() => {
    if (visible) {
      setSearch('')
      setSelectedRecipe(null)
      setCustomTitle('')
      setServings(2)
      setNotes('')
      setSubmitting(false)
      setErrorMessage(null)
    }
  }, [visible])

  const handleSelectRecipe = (recipe: MealPlanRecipeSummary) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setSelectedRecipe(recipe)
    setCustomTitle('')
    if (recipe.servings && recipe.servings > 0) {
      setServings(recipe.servings)
    }
  }

  const handleConfirm = async () => {
    if (!selectedRecipe && !customTitle.trim()) {
      setErrorMessage('Please select a recipe or enter a meal title.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    try {
      await onAddMeal({
        date,
        mealType,
        recipeId: selectedRecipe?.id ?? null,
        customTitle: selectedRecipe ? null : customTitle.trim(),
        servings,
        notes: notes.trim() || null,
      })
      onClose()
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add meal to plan.')
      setSubmitting(false)
    }
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
            <View>
              <Text style={[typography.cardTitle, { color: colors.foreground }]}>
                Add to {MEAL_TYPE_NAMES[mealType]}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                {date}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close add meal"
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
          {/* Recipe Search Input */}
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.control,
              },
            ]}
          >
            <Search size={18} color={colors.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search your recipe collection..."
              placeholderTextColor={colors.mutedForeground}
              style={[typography.body, styles.searchInput, { color: colors.foreground }]}
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="Search recipes"
            />
            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear search"
              >
                <X size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Selected Recipe Chip if chosen */}
          {selectedRecipe ? (
            <View
              style={[
                styles.selectedBanner,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.primary,
                  borderRadius: radii.card,
                },
              ]}
            >
              <View style={styles.selectedLeft}>
                <Check size={18} color={colors.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]} numberOfLines={1}>
                    {selectedRecipe.title}
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    Selected Recipe
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setSelectedRecipe(null)}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                accessibilityLabel="Remove selected recipe"
              >
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Change
                </Text>
              </Pressable>
            </View>
          ) : (
            /* Custom Title Option if no recipe selected */
            <View style={{ marginTop: 8, marginBottom: 12 }}>
              <TextInput
                value={customTitle}
                onChangeText={(val) => {
                  setCustomTitle(val)
                  if (val.trim()) setSelectedRecipe(null)
                }}
                placeholder="Or type custom meal title (e.g. Avocado Toast)..."
                placeholderTextColor={colors.mutedForeground}
                style={[
                  typography.body,
                  styles.customInput,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.control,
                    color: colors.foreground,
                  },
                ]}
                accessibilityLabel="Custom meal title"
              />
            </View>
          )}

          {/* Recipe List */}
          {!selectedRecipe && (
            <View style={styles.recipesSection}>
              <Text style={[typography.caption, { color: colors.mutedForeground, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 }]}>
                CHOOSE FROM YOUR RECIPES
              </Text>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : recipes && recipes.length > 0 ? (
                <View style={styles.recipeGrid}>
                  {recipes.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => handleSelectRecipe(item)}
                      style={({ pressed }) => [
                        styles.recipePickerCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderRadius: radii.card,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.title}`}
                    >
                      <View
                        style={[
                          styles.recipeThumb,
                          { backgroundColor: colors.secondary, borderRadius: radii.small },
                        ]}
                      >
                        {item.image_url ? (
                          <Image source={{ uri: item.image_url }} style={styles.thumbImage} />
                        ) : (
                          <UtensilsCrossed size={18} color={colors.primary} />
                        )}
                      </View>

                      <View style={styles.recipeCardInfo}>
                        <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.pickerMeta}>
                          {item.cook_time ? (
                            <View style={styles.metaRow}>
                              <Clock size={11} color={colors.mutedForeground} />
                              <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 3 }]}>
                                {item.cook_time}m
                              </Text>
                            </View>
                          ) : null}
                          {item.servings ? (
                            <View style={[styles.metaRow, { marginLeft: 8 }]}>
                              <Users size={11} color={colors.mutedForeground} />
                              <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 3 }]}>
                                {item.servings} serv
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={[typography.body, { color: colors.mutedForeground, fontStyle: 'italic', marginVertical: 12 }]}>
                  {search ? 'No matching recipes found.' : 'No recipes in vault yet. Enter a custom meal above.'}
                </Text>
              )}
            </View>
          )}

          {/* Servings Stepper */}
          <View style={styles.formRow}>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
                Servings
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                Scale ingredients &amp; nutrition
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

          {/* Notes Input */}
          <View style={{ marginTop: 16 }}>
            <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginBottom: 6 }]}>
              Notes (Optional)
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Prep chicken night before, use leftovers..."
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

          {/* Error Message */}
          {errorMessage && (
            <Text style={[typography.caption, { color: colors.destructive, marginTop: 12 }]}>
              {errorMessage}
            </Text>
          )}
        </ScrollView>

        {/* Footer Action */}
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
            onPress={handleConfirm}
            disabled={submitting}
            style={({ pressed }) => [
              styles.confirmButton,
              {
                backgroundColor: colors.primary,
                borderRadius: radii.control,
                opacity: submitting ? 0.7 : pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Confirm add meal"
          >
            {submitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Plus size={18} color={colors.primaryForeground} style={{ marginRight: 6 }} />
                <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                  Add to Meal Plan
                </Text>
              </>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 46,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 44,
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  selectedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  customInput: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 46,
  },
  recipesSection: {
    marginTop: 8,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  recipeGrid: {
    gap: 8,
  },
  recipePickerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    minHeight: 56,
  },
  recipeThumb: {
    width: 40,
    height: 40,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  recipeCardInfo: {
    flex: 1,
    marginLeft: 10,
  },
  pickerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#00000010',
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
  notesInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 60,
    textAlignVertical: 'top',
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
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
})
