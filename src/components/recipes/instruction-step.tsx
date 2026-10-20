import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Timer } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import type { RecipeInstruction } from '@/features/recipes/types'

interface InstructionStepProps {
  instruction: RecipeInstruction
  isLast?: boolean
}

export function InstructionStep({ instruction, isLast = false }: InstructionStepProps) {
  const { colors, typography, spacing, radii } = useAureliaTheme()

  const formattedStepNumber = String(instruction.step_number).padStart(2, '0')

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          borderBottomWidth: isLast ? 0 : 1,
          paddingVertical: spacing.base,
        },
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Step ${instruction.step_number}: ${instruction.instruction}${instruction.timer_duration ? `, Timer: ${instruction.timer_duration} minutes` : ''}`}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.stepBadge,
            {
              backgroundColor: colors.primary + '18',
              borderColor: colors.primary + '40',
              borderRadius: radii.pill,
            },
          ]}
        >
          <Text
            style={[
              typography.caption,
              { color: colors.primary, fontWeight: '700', fontSize: 12 },
            ]}
          >
            {formattedStepNumber}
          </Text>
        </View>

        {instruction.timer_duration ? (
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderRadius: radii.pill,
              },
            ]}
          >
            <Timer size={13} color={colors.primary} style={{ marginRight: 4 }} />
            <Text
              style={[
                typography.caption,
                { color: colors.secondaryForeground, fontWeight: '600', fontSize: 11 },
              ]}
            >
              {instruction.timer_duration} min timer
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        style={[
          typography.body,
          styles.instructionText,
          { color: colors.foreground, marginTop: spacing.sm },
        ]}
      >
        {instruction.instruction}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 24,
  },
})
