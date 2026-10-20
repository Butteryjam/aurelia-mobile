import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useAureliaTheme } from '@/theme'
import type { DashboardStats } from '@/features/recipes/types'

interface DashboardSummaryProps {
  stats: DashboardStats
}

export function DashboardSummary({ stats }: DashboardSummaryProps) {
  const router = useRouter()
  const { colors, typography, radii, spacing, shadows } = useAureliaTheme()

  return (
    <View
      style={[
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          paddingVertical: spacing.sm + 2,
          paddingHorizontal: spacing.base,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Sanctuary summary: ${stats.recipeCount} recipes, ${stats.favoriteCount} favorites, ${stats.upcomingMealCount} planned meals`}
    >
      {/* 1. Total Recipes */}
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/recipes')}
        style={styles.statColumn}
        accessibilityRole="button"
        accessibilityLabel={`View all ${stats.recipeCount} recipes`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.statNumber, { color: colors.foreground }]}>
          {stats.recipeCount}
        </Text>
        <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
          Recipes
        </Text>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 2. Favorites */}
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/recipes')}
        style={styles.statColumn}
        accessibilityRole="button"
        accessibilityLabel={`View ${stats.favoriteCount} favorites`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.statNumber, { color: colors.primary }]}>
          {stats.favoriteCount}
        </Text>
        <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
          Favorites
        </Text>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 3. Upcoming Planned Meals */}
      <Pressable
        onPress={() => router.push('/(app)/(tabs)/planner')}
        style={styles.statColumn}
        accessibilityRole="button"
        accessibilityLabel={`View ${stats.upcomingMealCount} planned meals`}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.statNumber, { color: colors.foreground }]}>
          {stats.upcomingMealCount}
        </Text>
        <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
          Planned
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  statColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    height: 28,
  },
})
