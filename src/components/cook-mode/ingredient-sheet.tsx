/**
 * Aurelia Mobile — Cook Mode Ingredient Drawer / Bottom Sheet
 *
 * Allows checking off ingredients and scaling servings on-the-fly without
 * resetting cooking step progress or modifying database recipes.
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X, Minus, Plus, Check, RotateCcw } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme, fontFamilies } from '@/theme'
import { scaleQuantity } from '@/lib/quantity-scaler'
import type { RecipeIngredient } from '@/features/recipes/types'

interface IngredientSheetProps {
  visible: boolean
  onClose: () => void
  ingredients: RecipeIngredient[]
  baseServings: number | null
  currentServings: number
  onServingsChange: (servings: number) => void
  checkedIds: Set<string>
  onToggleIngredient: (id: string) => void
  onClearChecks?: () => void
}

export function IngredientSheet({
  visible,
  onClose,
  ingredients,
  baseServings,
  currentServings,
  onServingsChange,
  checkedIds,
  onToggleIngredient,
  onClearChecks,
}: IngredientSheetProps) {
  const insets = useSafeAreaInsets()
  const { colors, radii, shadows } = useAureliaTheme()

  if (!visible) return null

  const handleDecreaseServings = () => {
    if (currentServings <= 1) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onServingsChange(currentServings - 1)
  }

  const handleIncreaseServings = () => {
    if (currentServings >= 99) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onServingsChange(currentServings + 1)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Close ingredient drawer"
          accessibilityRole="button"
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              paddingBottom: Math.max(insets.bottom, 24),
              borderTopLeftRadius: radii.card,
              borderTopRightRadius: radii.card,
            },
            shadows.card,
          ]}
        >
          {/* Top handle indicator */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.title,
                  { color: colors.textPrimary, fontFamily: fontFamilies.serifBold },
                ]}
              >
                Ingredients
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: colors.textSecondary, fontFamily: fontFamilies.sansRegular },
                ]}
              >
                {checkedIds.size} of {ingredients.length} checked
              </Text>
            </View>

            <Pressable
              testID="close-ingredients-btn"
              onPress={onClose}
              hitSlop={12}
              accessibilityLabel="Close"
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.surfaceSubtle, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <X size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Serving Scaler Bar */}
          <View style={[styles.servingsBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.servingsLabel, { color: colors.textSecondary, fontFamily: fontFamilies.sansMedium }]}>
              Servings:
            </Text>

            <View style={styles.stepperContainer}>
              <Pressable
                testID="decrease-servings-btn"
                onPress={handleDecreaseServings}
                disabled={currentServings <= 1}
                hitSlop={8}
                accessibilityLabel="Decrease servings"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    opacity: currentServings <= 1 ? 0.4 : pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Minus size={16} color={colors.textPrimary} />
              </Pressable>

              <Text
                testID="cook-servings-display"
                style={[
                  styles.servingsValue,
                  { color: colors.textPrimary, fontFamily: fontFamilies.sansBold },
                ]}
              >
                {currentServings}
              </Text>

              <Pressable
                testID="increase-servings-btn"
                onPress={handleIncreaseServings}
                hitSlop={8}
                accessibilityLabel="Increase servings"
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.stepperBtn,
                  {
                    backgroundColor: colors.surfaceSubtle,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Plus size={16} color={colors.textPrimary} />
              </Pressable>
            </View>

            {onClearChecks && checkedIds.size > 0 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                  onClearChecks()
                }}
                hitSlop={8}
                accessibilityLabel="Uncheck all ingredients"
                accessibilityRole="button"
                style={styles.resetChecksBtn}
              >
                <RotateCcw size={13} color={colors.primary} />
                <Text
                  style={[
                    styles.resetChecksText,
                    { color: colors.primary, fontFamily: fontFamilies.sansMedium },
                  ]}
                >
                  Uncheck
                </Text>
              </Pressable>
            )}
          </View>

          {/* Ingredient List */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {ingredients.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No ingredients listed for this recipe.
              </Text>
            ) : (
              ingredients.map((ing) => {
                const isChecked = checkedIds.has(ing.id)
                const scaledQty = scaleQuantity(ing.quantity, baseServings, currentServings)
                const quantityUnitText = [scaledQty, ing.unit].filter(Boolean).join(' ')

                return (
                  <Pressable
                    key={ing.id}
                    testID={`cook-ingredient-${ing.id}`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                      onToggleIngredient(ing.id)
                    }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isChecked }}
                    accessibilityLabel={`${quantityUnitText} ${ing.name}${isChecked ? ', checked' : ', unchecked'}`}
                    style={({ pressed }) => [
                      styles.ingredientRow,
                      {
                        backgroundColor: isChecked ? colors.surfaceSubtle : 'transparent',
                        borderColor: isChecked ? 'transparent' : colors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isChecked ? colors.primary : colors.border,
                          backgroundColor: isChecked ? colors.primary : 'transparent',
                          borderRadius: radii.small,
                        },
                      ]}
                    >
                      {isChecked && <Check size={14} color="#FFF" strokeWidth={3} />}
                    </View>

                    <View style={styles.ingredientTextContainer}>
                      <Text
                        style={[
                          styles.ingredientName,
                          {
                            color: isChecked ? colors.textSecondary : colors.textPrimary,
                            fontFamily: fontFamilies.sansRegular,
                            textDecorationLine: isChecked ? 'line-through' : 'none',
                          },
                        ]}
                      >
                        {ing.name}
                        {ing.is_optional && (
                          <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>
                            {' '}
                            (optional)
                          </Text>
                        )}
                      </Text>

                      {ing.preparation_note && (
                        <Text
                          style={[
                            styles.prepNote,
                            { color: colors.textSecondary, fontFamily: fontFamilies.sansRegular },
                          ]}
                        >
                          {ing.preparation_note}
                        </Text>
                      )}
                    </View>

                    {quantityUnitText ? (
                      <Text
                        style={[
                          styles.quantityText,
                          {
                            color: isChecked ? colors.textSecondary : colors.primary,
                            fontFamily: fontFamilies.sansBold,
                          },
                        ]}
                      >
                        {quantityUnitText}
                      </Text>
                    ) : null}
                  </Pressable>
                )
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '80%',
    width: '100%',
    paddingTop: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  servingsLabel: {
    fontSize: 14,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    gap: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingsValue: {
    fontSize: 16,
    minWidth: 26,
    textAlign: 'center',
  },
  resetChecksBtn: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetChecksText: {
    fontSize: 12,
  },
  list: {
    flexGrow: 0,
    paddingHorizontal: 16,
  },
  listContent: {
    paddingVertical: 8,
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ingredientTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  ingredientName: {
    fontSize: 15,
  },
  prepNote: {
    fontSize: 12,
    marginTop: 2,
  },
  quantityText: {
    fontSize: 15,
    textAlign: 'right',
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 24,
    fontSize: 14,
  },
})
