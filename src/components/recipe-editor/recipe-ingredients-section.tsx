import React from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import {
  createEmptyIngredientRow,
  type IngredientRow,
} from '@/features/recipes/recipe-form-schema'

interface Props {
  ingredients: IngredientRow[]
  onChange: (ingredients: IngredientRow[]) => void
  error?: string
}

export function RecipeIngredientsSection({ ingredients, onChange, error }: Props) {
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()

  const inputStyle = {
    backgroundColor: colors.muted,
    borderColor: colors.border,
    color: colors.foreground,
    borderWidth: 1,
    borderRadius: radii.small,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: fontFamilies.sans,
  }

  const handleUpdateRow = (id: string, field: keyof IngredientRow, value: any) => {
    const updated = ingredients.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    onChange(updated)
  }

  const handleAddRow = () => {
    onChange([...ingredients, createEmptyIngredientRow()])
  }

  const handleDeleteRow = (id: string) => {
    if (ingredients.length <= 1) {
      onChange([createEmptyIngredientRow()])
    } else {
      onChange(ingredients.filter((row) => row.id !== id))
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...ingredients]
    const temp = next[index - 1]
    next[index - 1] = next[index]
    next[index] = temp
    onChange(next)
  }

  const handleMoveDown = (index: number) => {
    if (index === ingredients.length - 1) return
    const next = [...ingredients]
    const temp = next[index + 1]
    next[index + 1] = next[index]
    next[index] = temp
    onChange(next)
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          padding: spacing.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[typography.sectionTitle, { color: colors.foreground }]}>Ingredients</Text>
          <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
            List components, quantities and notes
          </Text>
        </View>
        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: colors.primary, borderRadius: radii.pill },
          ]}
          onPress={handleAddRow}
          accessibilityRole="button"
          accessibilityLabel="Add ingredient row"
        >
          <Plus size={16} color={colors.primaryForeground} />
          <Text style={[styles.addButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
            Add
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive, fontFamily: fontFamilies.sans }]}>
          {error}
        </Text>
      ) : null}

      <View style={styles.rowsList}>
        {ingredients.map((row, index) => (
          <View
            key={row.id}
            style={[
              styles.rowCard,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderRadius: radii.control,
              },
            ]}
          >
            <View style={styles.rowCardHeader}>
              <Text
                style={[
                  typography.eyebrow,
                  { color: colors.mutedForeground, fontSize: 10 },
                ]}
              >
                Item {index + 1}
              </Text>
              <View style={styles.reorderControls}>
                <Pressable
                  disabled={index === 0}
                  onPress={() => handleMoveUp(index)}
                  style={[
                    styles.reorderButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.small,
                    },
                    index === 0 && styles.reorderButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ingredient ${index + 1} up`}
                >
                  <ArrowUp size={14} color={index === 0 ? colors.border : colors.foreground} />
                </Pressable>

                <Pressable
                  disabled={index === ingredients.length - 1}
                  onPress={() => handleMoveDown(index)}
                  style={[
                    styles.reorderButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.small,
                    },
                    index === ingredients.length - 1 && styles.reorderButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Move ingredient ${index + 1} down`}
                >
                  <ArrowDown
                    size={14}
                    color={index === ingredients.length - 1 ? colors.border : colors.foreground}
                  />
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteRow(row.id)}
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor: colors.destructive + '15',
                      borderRadius: radii.small,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ingredient ${index + 1}`}
                >
                  <Trash2 size={14} color={colors.destructive} />
                </Pressable>
              </View>
            </View>

            {/* Quantity, Unit & Name inputs */}
            <View style={styles.inputRow}>
              <View style={styles.quantityBox}>
                <TextInput
                  style={inputStyle}
                  value={row.quantity}
                  onChangeText={(val) => handleUpdateRow(row.id, 'quantity', val)}
                  placeholder="Qty"
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel={`Quantity for item ${index + 1}`}
                />
              </View>

              <View style={styles.unitBox}>
                <TextInput
                  style={inputStyle}
                  value={row.unit}
                  onChangeText={(val) => handleUpdateRow(row.id, 'unit', val)}
                  placeholder="Unit"
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel={`Unit for item ${index + 1}`}
                />
              </View>

              <View style={styles.nameBox}>
                <TextInput
                  style={inputStyle}
                  value={row.name}
                  onChangeText={(val) => handleUpdateRow(row.id, 'name', val)}
                  placeholder="Ingredient name *"
                  placeholderTextColor={colors.mutedForeground}
                  accessibilityLabel={`Ingredient name for item ${index + 1}`}
                />
              </View>
            </View>

            {/* Preparation Note & Optional Flag */}
            <View style={styles.noteRow}>
              <TextInput
                style={[inputStyle, styles.noteInput]}
                value={row.preparationNote}
                onChangeText={(val) => handleUpdateRow(row.id, 'preparationNote', val)}
                placeholder="Prep note (e.g. freshly grated, room temp)"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel={`Preparation note for item ${index + 1}`}
              />

              <Pressable
                style={[
                  styles.optionalChip,
                  {
                    backgroundColor: row.isOptional ? colors.primary + '15' : colors.card,
                    borderColor: row.isOptional ? colors.primary : colors.border,
                    borderRadius: radii.pill,
                  },
                ]}
                onPress={() => handleUpdateRow(row.id, 'isOptional', !row.isOptional)}
                accessibilityRole="button"
                accessibilityLabel="Toggle optional ingredient"
              >
                <Text
                  style={[
                    {
                      fontFamily: fontFamilies.sansMedium,
                      fontSize: 11,
                      color: row.isOptional ? colors.primary : colors.mutedForeground,
                      fontWeight: row.isOptional ? '700' : '500',
                    },
                  ]}
                >
                  {row.isOptional ? 'Optional' : 'Required'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          styles.bottomAddAffordance,
          {
            borderColor: colors.primary + '50',
            borderRadius: radii.control,
          },
        ]}
        onPress={handleAddRow}
        accessibilityRole="button"
        accessibilityLabel="Add another ingredient"
      >
        <Plus size={16} color={colors.primary} />
        <Text
          style={[
            {
              fontFamily: fontFamilies.sansMedium,
              fontSize: 13,
              color: colors.primary,
            },
          ]}
        >
          Add Ingredient
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
  },
  addButtonText: {
    fontSize: 12,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 8,
  },
  rowsList: {
    gap: 8,
  },
  rowCard: {
    padding: 12,
    borderWidth: 1,
  },
  rowCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reorderButton: {
    padding: 6,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.4,
  },
  deleteButton: {
    padding: 6,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  quantityBox: {
    width: 65,
  },
  unitBox: {
    width: 75,
  },
  nameBox: {
    flex: 1,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
  },
  optionalChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  bottomAddAffordance: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    minHeight: 44,
  },
})
