/**
 * Aurelia Mobile — Shopping Item Row Component
 */

import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { CheckCircle2, Circle, Trash2, Utensils } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import type { ShoppingListItem } from '@/features/shopping/types'

interface ShoppingItemRowProps {
  item: ShoppingListItem
  onToggle: (itemId: string, isChecked: boolean) => void
  onDelete: (itemId: string) => void
}

export function ShoppingItemRow({ item, onToggle, onDelete }: ShoppingItemRowProps) {
  const { colors, typography, radii, spacing } = useAureliaTheme()
  const isChecked = item.is_checked

  return (
    <View
      style={[
        styles.rowContainer,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          opacity: isChecked ? 0.65 : 1,
        },
      ]}
    >
      {/* Checkbox */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          onToggle(item.id, isChecked)
        }}
        style={styles.checkboxButton}
        accessibilityRole="checkbox"
        accessibilityLabel={`${item.name}, ${item.quantity || ''} ${item.unit || ''}, ${isChecked ? 'completed' : 'uncompleted'}`}
        accessibilityState={{ checked: isChecked }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isChecked ? (
          <CheckCircle2 size={22} color={colors.primary} />
        ) : (
          <Circle size={22} color={colors.border} />
        )}
      </Pressable>

      {/* Item Details */}
      <View style={styles.textContainer}>
        <Text
          style={[
            typography.bodyMedium,
            {
              color: isChecked ? colors.mutedForeground : colors.foreground,
              textDecorationLine: isChecked ? 'line-through' : 'none',
              fontWeight: isChecked ? '400' : '600',
            },
          ]}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        <View style={styles.metaRow}>
          {(item.quantity || item.unit) && (
            <Text
              style={[
                typography.caption,
                { color: isChecked ? colors.mutedForeground : colors.primary, fontWeight: '700' },
              ]}
            >
              {[item.quantity, item.unit].filter(Boolean).join(' ')}
            </Text>
          )}

          {item.recipe_title && (
            <View
              style={[
                styles.recipeBadge,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.pill,
                  marginLeft: item.quantity || item.unit ? 8 : 0,
                },
              ]}
            >
              <Utensils size={10} color={colors.primary} style={{ marginRight: 3 }} />
              <Text
                style={[typography.caption, { fontSize: 11, color: colors.primary, fontWeight: '600' }]}
                numberOfLines={1}
              >
                {item.recipe_title}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Delete Button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
          onDelete(item.id)
        }}
        style={({ pressed }) => [
          styles.deleteButton,
          { opacity: pressed ? 0.6 : 0.4 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Delete ${item.name}`}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Trash2 size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    minHeight: 52,
    marginBottom: 6,
  },
  checkboxButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  recipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    maxWidth: '80%',
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
