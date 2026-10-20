/**
 * Aurelia Mobile — Cook Mode Step Progress Bar
 *
 * Provides a high-contrast standing-distance progress indicator and
 * quick-jump step selector.
 */

import React from 'react'
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme, fontFamilies } from '@/theme'

interface StepProgressBarProps {
  currentStepIndex: number
  totalSteps: number
  onSelectStep?: (index: number) => void
}

export function StepProgressBar({
  currentStepIndex,
  totalSteps,
  onSelectStep,
}: StepProgressBarProps) {
  const { colors, radii } = useAureliaTheme()

  if (totalSteps <= 0) return null

  const progressPercent = Math.min(
    100,
    Math.max(0, ((currentStepIndex + 1) / totalSteps) * 100)
  )

  const handleStepPress = (index: number) => {
    if (index === currentStepIndex) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onSelectStep?.(index)
  }

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStepIndex + 1} of ${totalSteps}`}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStepIndex + 1 }}
    >
      {/* Top row info */}
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.primary, fontFamily: fontFamilies.sansBold }]}>
            STEP {currentStepIndex + 1} OF {totalSteps}
          </Text>
        </View>

        <Text style={[styles.percentText, { color: colors.textSecondary, fontFamily: fontFamilies.sansMedium }]}>
          {Math.round(progressPercent)}% done
        </Text>
      </View>

      {/* Progress track */}
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${progressPercent}%`,
              backgroundColor: colors.primary,
              borderRadius: radii.pill,
            },
          ]}
        />
      </View>

      {/* Quick step bubbles if not too many */}
      {totalSteps <= 12 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {Array.from({ length: totalSteps }).map((_, idx) => {
            const isCurrent = idx === currentStepIndex
            const isCompleted = idx < currentStepIndex

            return (
              <Pressable
                key={idx}
                testID={`step-pill-${idx}`}
                accessibilityLabel={`Go to Step ${idx + 1}`}
                accessibilityRole="button"
                onPress={() => handleStepPress(idx)}
                style={({ pressed }) => [
                  styles.pill,
                  {
                    backgroundColor: isCurrent
                      ? colors.primary
                      : isCompleted
                      ? colors.surfaceSubtle
                      : 'transparent',
                    borderColor: isCurrent
                      ? colors.primary
                      : isCompleted
                      ? colors.border
                      : colors.borderLight,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillText,
                    {
                      color: isCurrent
                        ? colors.primaryForeground
                        : isCompleted
                        ? colors.textPrimary
                        : colors.textSecondary,
                      fontFamily: fontFamilies.sansBold,
                    },
                  ]}
                >
                  {idx + 1}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(186, 74, 46, 0.12)',
  },
  badgeText: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
  percentText: {
    fontSize: 12,
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
  pillsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    gap: 8,
  },
  pill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 13,
  },
})
