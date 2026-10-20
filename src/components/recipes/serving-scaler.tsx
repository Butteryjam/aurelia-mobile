import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { Minus, Plus, Users } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'

interface ServingScalerProps {
  baseServings: number
  currentServings: number
  onChangeServings: (newServings: number) => void
}

export function ServingScaler({
  baseServings,
  currentServings,
  onChangeServings,
}: ServingScalerProps) {
  const { colors, typography, spacing, radii } = useAureliaTheme()

  const handleDecrement = () => {
    if (currentServings <= 1) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onChangeServings(currentServings - 1)
  }

  const handleIncrement = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onChangeServings(currentServings + 1)
  }

  const handleReset = () => {
    if (currentServings === baseServings) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onChangeServings(baseServings)
  }

  const isScaled = currentServings !== baseServings

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          padding: spacing.base,
        },
      ]}
    >
      <View style={styles.leftInfo}>
        <View style={styles.titleRow}>
          <Users size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
            Yield / Servings
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
          {isScaled ? `Adjusted from base (${baseServings})` : `Original recipe yields ${baseServings}`}
        </Text>
      </View>

      <View style={styles.controlsRow}>
        {isScaled && (
          <Pressable
            onPress={handleReset}
            style={[styles.resetBadge, { borderColor: colors.border, borderRadius: radii.pill }]}
            accessibilityRole="button"
            accessibilityLabel="Reset servings to original"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[typography.caption, { color: colors.primary, fontSize: 11, fontWeight: '600' }]}>
              Reset
            </Text>
          </Pressable>
        )}

        <View style={[styles.stepperBox, { borderColor: colors.border, borderRadius: radii.pill, backgroundColor: colors.background }]}>
          <Pressable
            onPress={handleDecrement}
            disabled={currentServings <= 1}
            style={({ pressed }) => [
              styles.stepButton,
              { opacity: currentServings <= 1 ? 0.3 : pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Decrease servings"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Minus size={16} color={colors.foreground} />
          </Pressable>

          <View style={styles.countContainer}>
            <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700' }]}>
              {currentServings}
            </Text>
          </View>

          <Pressable
            onPress={handleIncrement}
            style={({ pressed }) => [
              styles.stepButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Increase servings"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={16} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  leftInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countContainer: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
