/**
 * Aurelia Mobile — Compact Day Nutrition Summary
 */

import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import { Activity } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import type { DayNutritionSummary } from '@/features/meal-planner/types'

interface NutritionSummaryProps {
  summary: DayNutritionSummary
}

export function NutritionSummaryCard({ summary }: NutritionSummaryProps) {
  const { colors, typography, radii, spacing } = useAureliaTheme()

  if (!summary.hasData) return null

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Activity size={14} color={colors.primary} />
        <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 6, fontWeight: '700', letterSpacing: 0.5 }]}>
          DAILY NUTRITION ESTIMATE
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={[typography.cardTitle, { color: colors.foreground, fontSize: 16 }]}>
            {summary.calories}
          </Text>
          <Text style={[typography.caption, { color: colors.mutedForeground }]}>
            Calories
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <Text style={[typography.cardTitle, { color: colors.foreground, fontSize: 16 }]}>
            {summary.protein_g}g
          </Text>
          <Text style={[typography.caption, { color: colors.mutedForeground }]}>
            Protein
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <Text style={[typography.cardTitle, { color: colors.foreground, fontSize: 16 }]}>
            {summary.carbs_g}g
          </Text>
          <Text style={[typography.caption, { color: colors.mutedForeground }]}>
            Carbs
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statCol}>
          <Text style={[typography.cardTitle, { color: colors.foreground, fontSize: 16 }]}>
            {summary.fat_g}g
          </Text>
          <Text style={[typography.caption, { color: colors.mutedForeground }]}>
            Fat
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: 1,
    height: 24,
  },
})
