import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Clock, Calendar, Users } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { AureliaImage } from '@/components/common/aurelia-image'
import type { UpcomingMealItem } from '@/features/recipes/types'

interface UpcomingMealCardProps {
  item: UpcomingMealItem
}

function formatMealDate(dateString: string): string {
  try {
    const today = new Date()
    const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    if (dateString === todayISO) return 'TODAY'
    if (dateString === tomorrowISO) return 'TOMORROW'

    const [year, month, day] = dateString.split('-').map(Number)
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
  } catch {
    return dateString
  }
}

export function UpcomingMealCard({ item }: UpcomingMealCardProps) {
  const router = useRouter()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const handlePress = () => {
    if (item.recipe_id) {
      router.push(`/(app)/recipe/${item.recipe_id}`)
    } else {
      router.push('/(app)/(tabs)/planner')
    }
  }

  const dateLabel = formatMealDate(item.date)
  const mealTypeFormatted =
    item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1)
  const displayTitle = item.recipe?.title || item.title
  const imageUrl = item.recipe?.image_url || item.recipe_image_url_snapshot

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${dateLabel} ${mealTypeFormatted}: ${displayTitle}`}
    >
      <View style={[styles.imageContainer, { borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }]}>
        <AureliaImage
          source={imageUrl}
          style={styles.image}
          aspectRatio={16 / 9}
          accessibilityLabel={displayTitle}
        />

        {/* Date Badge */}
        <View
          style={[
            styles.dateBadge,
            {
              backgroundColor: colors.card + 'F0',
              borderColor: colors.border,
              borderRadius: radii.small,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.primary, fontSize: 10, fontWeight: '700' }]}>
            {dateLabel}
          </Text>
        </View>

        {/* Meal Type Pill */}
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.small,
            },
          ]}
        >
          <Text style={[typography.caption, { color: colors.secondaryForeground, fontSize: 10, fontWeight: '600' }]}>
            {mealTypeFormatted}
          </Text>
        </View>
      </View>

      <View style={[styles.content, { padding: spacing.sm + 2 }]}>
        <Text
          style={[
            typography.sectionTitle,
            {
              color: colors.foreground,
              fontSize: 14,
              lineHeight: 19,
              marginBottom: 4,
            },
          ]}
          numberOfLines={2}
        >
          {displayTitle}
        </Text>

        <View style={styles.metaRow}>
          {item.recipe?.cook_time ? (
            <View style={styles.metaItem}>
              <Clock size={11} color={colors.mutedForeground} style={{ marginRight: 3 }} />
              <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                {item.recipe.cook_time}m
              </Text>
            </View>
          ) : null}

          <View style={[styles.metaItem, { marginLeft: item.recipe?.cook_time ? 8 : 0 }]}>
            <Users size={11} color={colors.mutedForeground} style={{ marginRight: 3 }} />
            <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
              {item.servings} serving{item.servings > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    borderWidth: 1,
    overflow: 'hidden',
    marginRight: 14,
    marginBottom: 4,
  },
  imageContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  dateBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  typeBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  content: {},
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
