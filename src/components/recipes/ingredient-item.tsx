import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Check, Square } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { scaleQuantity } from '@/lib/quantity-scaler'
import type { RecipeIngredient } from '@/features/recipes/types'

interface IngredientItemProps {
  ingredient: RecipeIngredient
  baseServings: number | null
  currentServings: number
  isChecked: boolean
  onToggle: () => void
}

export function IngredientItem({
  ingredient,
  baseServings,
  currentServings,
  isChecked,
  onToggle,
}: IngredientItemProps) {
  const { colors, typography, radii } = useAureliaTheme()

  const scaledQty = scaleQuantity(ingredient.quantity, baseServings, currentServings)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onToggle()
  }

  const quantityUnitText = [scaledQty, ingredient.unit].filter(Boolean).join(' ')

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: isChecked ? colors.muted + '40' : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isChecked }}
      accessibilityLabel={`${quantityUnitText} ${ingredient.name}${ingredient.is_optional ? ', optional' : ''}${isChecked ? ', checked' : ', unchecked'}`}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: isChecked ? colors.primary : colors.border,
            backgroundColor: isChecked ? colors.primary : colors.background,
            borderRadius: radii.small,
          },
        ]}
      >
        {isChecked && <Check size={14} color={colors.primaryForeground} strokeWidth={3} />}
      </View>

      <View style={styles.textContainer}>
        <Text
          style={[
            typography.bodyMedium,
            styles.mainText,
            {
              color: isChecked ? colors.mutedForeground : colors.foreground,
              textDecorationLine: isChecked ? 'line-through' : 'none',
            },
          ]}
        >
          {quantityUnitText ? (
            <Text style={{ fontWeight: '700', color: isChecked ? colors.mutedForeground : colors.foreground }}>
              {quantityUnitText}{' '}
            </Text>
          ) : null}
          <Text style={{ fontWeight: '400' }}>{ingredient.name}</Text>
          {ingredient.is_optional && (
            <Text style={{ fontStyle: 'italic', color: colors.mutedForeground, fontSize: 13 }}>
              {' '}(optional)
            </Text>
          )}
        </Text>

        {ingredient.preparation_note && (
          <Text
            style={[
              typography.caption,
              {
                color: colors.mutedForeground,
                marginTop: 2,
                fontStyle: 'italic',
                textDecorationLine: isChecked ? 'line-through' : 'none',
              },
            ]}
          >
            {ingredient.preparation_note}
          </Text>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  mainText: {
    fontSize: 15,
    lineHeight: 22,
  },
})
