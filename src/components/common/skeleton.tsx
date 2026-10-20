import React, { useEffect, useRef } from 'react'
import { StyleSheet, View, Animated, type ViewStyle } from 'react-native'
import { useAureliaTheme } from '@/theme'

interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: ViewStyle | ViewStyle[]
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors } = useAureliaTheme()
  const hasAnimated = typeof Animated !== 'undefined' && typeof Animated.Value === 'function'
  const opacityAnim = useRef(hasAnimated ? new Animated.Value(0.4) : null).current

  useEffect(() => {
    if (!hasAnimated || !opacityAnim) return
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    )
    pulse.start()

    return () => pulse.stop()
  }, [hasAnimated, opacityAnim])

  if (!hasAnimated || !opacityAnim) {
    return (
      <View
        style={[
          {
            width: width as any,
            height: height as any,
            borderRadius,
            backgroundColor: colors.muted,
            opacity: 0.6,
          },
          style,
        ]}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading content"
      />
    )
  }

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.muted,
          opacity: opacityAnim,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    />
  )
}

export function SkeletonRecipeCard() {
  const { colors, radii, spacing } = useAureliaTheme()

  return (
    <View
      style={[
        styles.cardSkeleton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          marginBottom: spacing.base,
        },
      ]}
    >
      <Skeleton height={180} borderRadius={0} />
      <View style={{ padding: spacing.base }}>
        <Skeleton width="40%" height={14} style={{ marginBottom: 8 }} />
        <Skeleton width="85%" height={22} style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height={16} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={70} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  )
}

export function SkeletonUpcomingMeal() {
  const { colors, radii, spacing } = useAureliaTheme()

  return (
    <View
      style={[
        styles.upcomingMealSkeleton,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          marginRight: spacing.md,
        },
      ]}
    >
      <Skeleton width="50%" height={12} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={18} style={{ marginBottom: 12 }} />
      <Skeleton height={100} borderRadius={radii.small} />
    </View>
  )
}

const styles = StyleSheet.create({
  cardSkeleton: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  upcomingMealSkeleton: {
    width: 220,
    borderWidth: 1,
    padding: 14,
  },
})
