import React from 'react'
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native'
import { Plus, Trash2, ArrowUp, ArrowDown, Timer } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import {
  createEmptyInstructionRow,
  type InstructionRow,
} from '@/features/recipes/recipe-form-schema'

interface Props {
  instructions: InstructionRow[]
  onChange: (instructions: InstructionRow[]) => void
  error?: string
}

export function RecipeInstructionsSection({ instructions, onChange, error }: Props) {
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

  const handleUpdateRow = (id: string, field: keyof InstructionRow, value: any) => {
    const updated = instructions.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    onChange(updated)
  }

  const handleAddStep = () => {
    onChange([...instructions, createEmptyInstructionRow()])
  }

  const handleDeleteStep = (id: string) => {
    if (instructions.length <= 1) {
      onChange([createEmptyInstructionRow()])
    } else {
      onChange(instructions.filter((row) => row.id !== id))
    }
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const next = [...instructions]
    const temp = next[index - 1]
    next[index - 1] = next[index]
    next[index] = temp
    onChange(next)
  }

  const handleMoveDown = (index: number) => {
    if (index === instructions.length - 1) return
    const next = [...instructions]
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
          <Text style={[typography.sectionTitle, { color: colors.foreground }]}>Instructions</Text>
          <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
            Step-by-step culinary preparation
          </Text>
        </View>
        <Pressable
          style={[
            styles.addButton,
            { backgroundColor: colors.primary, borderRadius: radii.pill },
          ]}
          onPress={handleAddStep}
          accessibilityRole="button"
          accessibilityLabel="Add instruction step"
        >
          <Plus size={16} color={colors.primaryForeground} />
          <Text
            style={[
              styles.addButtonText,
              { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium },
            ]}
          >
            Add Step
          </Text>
        </Pressable>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      ) : null}

      <View style={styles.stepList}>
        {instructions.map((step, index) => (
          <View
            key={step.id}
            style={[
              styles.stepCard,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderRadius: radii.control,
              },
            ]}
          >
            <View style={styles.stepCardHeader}>
              <View
                style={[
                  styles.stepBadge,
                  { backgroundColor: colors.primary, borderRadius: radii.pill },
                ]}
              >
                <Text
                  style={[
                    styles.stepBadgeText,
                    { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium },
                  ]}
                >
                  Step {index + 1}
                </Text>
              </View>

              <View style={styles.controlsRow}>
                <Pressable
                  disabled={index === 0}
                  onPress={() => handleMoveUp(index)}
                  style={[
                    styles.controlButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.small,
                    },
                    index === 0 && styles.controlButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Move step ${index + 1} up`}
                >
                  <ArrowUp size={14} color={index === 0 ? colors.border : colors.foreground} />
                </Pressable>

                <Pressable
                  disabled={index === instructions.length - 1}
                  onPress={() => handleMoveDown(index)}
                  style={[
                    styles.controlButton,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.small,
                    },
                    index === instructions.length - 1 && styles.controlButtonDisabled,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Move step ${index + 1} down`}
                >
                  <ArrowDown
                    size={14}
                    color={
                      index === instructions.length - 1 ? colors.border : colors.foreground
                    }
                  />
                </Pressable>

                <Pressable
                  onPress={() => handleDeleteStep(step.id)}
                  style={[
                    styles.deleteButton,
                    {
                      backgroundColor: colors.destructive + '15',
                      borderRadius: radii.small,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete step ${index + 1}`}
                >
                  <Trash2 size={14} color={colors.destructive} />
                </Pressable>
              </View>
            </View>

            {/* Instruction text */}
            <TextInput
              style={[inputStyle, styles.textArea]}
              value={step.instruction}
              onChangeText={(val) => handleUpdateRow(step.id, 'instruction', val)}
              placeholder={`Describe what the chef should do in Step ${index + 1}...`}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel={`Instruction text for step ${index + 1}`}
            />

            {/* Optional timer duration */}
            <View style={styles.timerRow}>
              <View style={styles.timerIconBox}>
                <Timer size={15} color={colors.primary} />
                <Text
                  style={[
                    typography.caption,
                    { color: colors.mutedForeground, fontSize: 12 },
                  ]}
                >
                  Timer:
                </Text>
              </View>
              <TextInput
                style={[inputStyle, styles.timerInput]}
                value={step.timerDuration}
                onChangeText={(val) => handleUpdateRow(step.id, 'timerDuration', val)}
                placeholder="Minutes (optional)"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                accessibilityLabel={`Timer duration in minutes for step ${index + 1}`}
              />
            </View>
          </View>
        ))}
      </View>

      <Pressable
        style={[
          styles.bottomAddAffordance,
          { borderColor: colors.primary + '50', borderRadius: radii.control },
        ]}
        onPress={handleAddStep}
        accessibilityRole="button"
        accessibilityLabel="Add next instruction step"
      >
        <Plus size={16} color={colors.primary} />
        <Text
          style={{ fontFamily: fontFamilies.sansMedium, fontSize: 13, color: colors.primary }}
        >
          Add Another Step
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
  stepList: {
    gap: 12,
  },
  stepCard: {
    padding: 12,
    borderWidth: 1,
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  controlButton: {
    padding: 6,
    borderWidth: 1,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  deleteButton: {
    padding: 6,
    minHeight: 32,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 75,
    paddingTop: 10,
    marginBottom: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timerIconBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerInput: {
    flex: 1,
    fontSize: 13,
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
