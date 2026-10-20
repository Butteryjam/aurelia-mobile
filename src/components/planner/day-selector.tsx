/**
 * Aurelia Mobile — Meal Planner Horizontal Day Selector
 */

import React from 'react'
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import type { DayMeals } from '@/features/meal-planner/types'

interface DaySelectorProps {
  days: DayMeals[]
  selectedDate: string
  onSelectDate: (date: string) => void
}

export function DaySelector({ days, selectedDate, onSelectDate }: DaySelectorProps) {
  const { colors, typography, radii, spacing } = useAureliaTheme()

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((day) => {
          const isSelected = day.date === selectedDate
          const totalMeals =
            day.slots.breakfast.length +
            day.slots.lunch.length +
            day.slots.dinner.length +
            day.slots.snack.length

          return (
            <Pressable
              key={day.date}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
                onSelectDate(day.date)
              }}
              style={({ pressed }) => [
                styles.dayPill,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : day.isToday
                    ? colors.secondary
                    : colors.card,
                  borderColor: isSelected
                    ? colors.primary
                    : day.isToday
                    ? colors.primary + '80'
                    : colors.border,
                  borderRadius: radii.card,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${day.dayName}, ${day.monthShort} ${day.dayNumber}${day.isToday ? ', Today' : ''}${totalMeals > 0 ? `, ${totalMeals} meals planned` : ''}`}
              accessibilityState={{ selected: isSelected }}
            >
              {day.isToday && (
                <View
                  style={[
                    styles.todayDot,
                    {
                      backgroundColor: isSelected ? colors.primaryForeground : colors.primary,
                    },
                  ]}
                />
              )}

              <Text
                style={[
                  typography.caption,
                  styles.dayShort,
                  {
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.mutedForeground,
                    fontWeight: isSelected ? '700' : '600',
                  },
                ]}
              >
                {day.dayShort.toUpperCase()}
              </Text>

              <Text
                style={[
                  typography.cardTitle,
                  styles.dayNumber,
                  {
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                    fontSize: 18,
                  },
                ]}
              >
                {day.dayNumber}
              </Text>

              {totalMeals > 0 && (
                <View
                  style={[
                    styles.mealBadge,
                    {
                      backgroundColor: isSelected
                        ? colors.primaryForeground + '30'
                        : colors.muted,
                      borderRadius: radii.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        fontSize: 10,
                        color: isSelected ? colors.primaryForeground : colors.mutedForeground,
                        fontWeight: '700',
                      },
                    ]}
                  >
                    {totalMeals}
                  </Text>
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayPill: {
    minWidth: 54,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    position: 'relative',
  },
  todayDot: {
    position: 'absolute',
    top: 6,
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  dayShort: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  dayNumber: {
    marginTop: 2,
    marginBottom: 2,
  },
  mealBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
})
