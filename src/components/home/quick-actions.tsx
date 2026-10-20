/**
 * Aurelia Mobile — Quick Actions Component (Redesigned)
 *
 * Compact horizontal-row layout inspired by the web dashboard.
 * 4 actions in a 2×2 grid with icon-first compact cards.
 * No fixed heights, no dead space. Content-driven sizing.
 */

import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Download, Sparkles, CalendarDays } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'

interface ActionItem {
  id: string
  label: string
  subtitle: string
  icon: React.ComponentType<{ size: number; color: string }>
  route: string
}

const ACTIONS: ActionItem[] = [
  {
    id: 'add',
    label: 'Add Recipe',
    subtitle: 'Craft from scratch',
    icon: Plus,
    route: '/(app)/recipe/new',
  },
  {
    id: 'import',
    label: 'Import Recipe',
    subtitle: 'Extract via AI',
    icon: Download,
    route: '/(app)/recipe/import',
  },
  {
    id: 'chef',
    label: 'Ask AI Chef',
    subtitle: 'Culinary advisor',
    icon: Sparkles,
    route: '/(app)/(tabs)/chef',
  },
  {
    id: 'planner',
    label: 'Plan Meals',
    subtitle: 'Weekly calendar',
    icon: CalendarDays,
    route: '/(app)/(tabs)/planner',
  },
]

export function QuickActions() {
  const router = useRouter()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const handleActionPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    router.push(route as any)
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {ACTIONS.map((action) => {
          const IconComp = action.icon
          return (
            <Pressable
              key={action.id}
              onPress={() => handleActionPress(action.route)}
              style={({ pressed }) => [
                styles.actionCard,
                shadows.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.card,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${action.label}, ${action.subtitle}`}
            >
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.small,
                  },
                ]}
              >
                <IconComp size={16} color={colors.primary} />
              </View>

              <Text
                style={[
                  typography.bodyMedium,
                  {
                    color: colors.foreground,
                    fontWeight: '600',
                    fontSize: 13,
                    marginTop: 8,
                    lineHeight: 17,
                  },
                ]}
                numberOfLines={1}
              >
                {action.label}
              </Text>

              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.mutedForeground,
                    fontSize: 11,
                    marginTop: 2,
                    lineHeight: 14,
                  },
                ]}
                numberOfLines={1}
              >
                {action.subtitle}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    flexShrink: 1,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  iconContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
