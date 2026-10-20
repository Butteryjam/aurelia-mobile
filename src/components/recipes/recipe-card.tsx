import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { Clock, ChefHat, Heart } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { AureliaImage } from '@/components/common/aurelia-image'
import type { RecipeListItem } from '@/features/recipes/types'

interface RecipeCardProps {
  recipe: RecipeListItem
  onToggleFavorite?: (recipeId: string, currentStatus: boolean) => void
  isFavoriteLoading?: boolean
}

export function RecipeCard({
  recipe,
  onToggleFavorite,
  isFavoriteLoading = false,
}: RecipeCardProps) {
  const router = useRouter()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const handleCardPress = () => {
    router.push(`/(app)/recipe/${recipe.id}`)
  }

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    onToggleFavorite?.(recipe.id, recipe.isFavorite)
  }

  const difficultyLabel = recipe.difficulty
    ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
    : null

  return (
    <View
      style={[
        styles.cardContainer,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          position: 'relative',
        },
      ]}
    >
      <Pressable
        onPress={handleCardPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={`${recipe.title}, recipe card. Cook time: ${recipe.cook_time || 'unspecified'} minutes.`}
      >
        {/* Recipe Hero Media */}
        <View style={[styles.imageWrapper, { borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }]}>
          <AureliaImage
            source={recipe.image_url}
            style={styles.image}
            aspectRatio={16 / 9}
            accessibilityLabel={recipe.title}
          />

          {/* Category / Cuisine Pill */}
          {recipe.cuisine && (
            <View
              style={[
                styles.cuisineBadge,
                {
                  backgroundColor: colors.card + 'E6',
                  borderColor: colors.border,
                  borderRadius: radii.small,
                },
              ]}
            >
              <Text style={[typography.caption, { color: colors.foreground, fontSize: 11, fontWeight: '600' }]}>
                {recipe.cuisine}
              </Text>
            </View>
          )}
        </View>

        {/* Card Text Content */}
        <View style={[styles.content, { padding: spacing.base }]}>
          <Text
            style={[
              typography.sectionTitle,
              {
                color: colors.foreground,
                fontSize: 17,
                lineHeight: 23,
                marginBottom: spacing.xs,
              },
            ]}
            numberOfLines={2}
          >
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text
              style={[
                typography.body,
                {
                  color: colors.mutedForeground,
                  fontSize: 13,
                  lineHeight: 18,
                  marginBottom: spacing.sm,
                },
              ]}
              numberOfLines={2}
            >
              {recipe.description}
            </Text>
          )}

          {/* Metadata Strip */}
          <View style={styles.metadataRow}>
            {recipe.cook_time ? (
              <View style={styles.metaItem}>
                <Clock size={13} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 12 }]}>
                  {recipe.cook_time} min
                </Text>
              </View>
            ) : null}

            {difficultyLabel && (
              <View style={[styles.metaItem, { marginLeft: recipe.cook_time ? 12 : 0 }]}>
                <ChefHat size={13} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 12 }]}>
                  {difficultyLabel}
                </Text>
              </View>
            )}

            {recipe.category && (
              <View
                style={[
                  styles.categoryTag,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.small,
                    marginLeft: 'auto',
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.secondaryForeground, fontSize: 11 }]}>
                  {recipe.category}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>

      {/* Favorite Heart Button (Sibling to Pressable, not child) */}
      {onToggleFavorite && (
        <Pressable
          onPress={handleFavoritePress}
          disabled={isFavoriteLoading}
          style={({ pressed }) => [
            styles.favoriteButton,
            {
              backgroundColor: colors.card + 'F0',
              borderRadius: radii.pill,
              borderColor: colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={recipe.isFavorite ? `Remove ${recipe.title} from favorites` : `Add ${recipe.title} to favorites`}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Heart
            size={18}
            color={recipe.isFavorite ? colors.primary : colors.mutedForeground}
            fill={recipe.isFavorite ? colors.primary : 'transparent'}
          />
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cardContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    marginVertical: 8,
  },
  imageWrapper: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cuisineBadge: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  content: {},
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
})
