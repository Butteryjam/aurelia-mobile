import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { FolderHeart, ChevronRight } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import type { CollectionItem } from '@/features/collections/types'

interface Props {
  collection: CollectionItem
  onPress: () => void
}

export function CollectionCard({ collection, onPress }: Props) {
  const { colors, typography, spacing, radii, shadows, fontFamilies } = useAureliaTheme()
  const hasCover = Boolean(collection.cover_image_url)
  const hasPreviews =
    collection.preview_image_urls && collection.preview_image_urls.length > 0

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          marginBottom: spacing.sm,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Collection ${collection.name}, ${collection.recipe_count} recipes`}
    >
      {/* Cover Media */}
      <View
        style={[
          styles.coverContainer,
          { backgroundColor: colors.muted },
        ]}
      >
        {hasCover ? (
          <Image
            source={{ uri: collection.cover_image_url! }}
            style={styles.coverImage}
            contentFit="cover"
          />
        ) : hasPreviews ? (
          <View style={styles.mosaicGrid}>
            {collection.preview_image_urls!.slice(0, 3).map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri }}
                style={[
                  styles.mosaicItem,
                  collection.preview_image_urls!.length === 1 && styles.mosaicSingle,
                  collection.preview_image_urls!.length === 2 && styles.mosaicDouble,
                  idx === 0 && collection.preview_image_urls!.length === 3 && styles.mosaicFirstOfThree,
                ]}
                contentFit="cover"
              />
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyCover,
              { backgroundColor: colors.secondary },
            ]}
          >
            <FolderHeart size={32} color={colors.primary} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={[styles.content, { padding: spacing.base }]}>
        <View style={styles.titleRow}>
          <Text
            style={[
              typography.sectionTitle,
              styles.title,
              { color: colors.foreground },
            ]}
            numberOfLines={1}
          >
            {collection.name}
          </Text>
          <ChevronRight size={18} color={colors.mutedForeground} />
        </View>

        {collection.description ? (
          <Text
            style={[
              typography.body,
              { color: colors.mutedForeground, marginBottom: spacing.sm, fontSize: 13, lineHeight: 18 },
            ]}
            numberOfLines={2}
          >
            {collection.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: colors.secondary,
                borderColor: colors.border,
                borderRadius: radii.pill,
              },
            ]}
          >
            <Text
              style={[
                typography.eyebrow,
                { color: colors.primary, fontSize: 10 },
              ]}
            >
              {collection.recipe_count} {collection.recipe_count === 1 ? 'recipe' : 'recipes'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  coverContainer: {
    height: 130,
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  mosaicGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  mosaicItem: {
    flex: 1,
    height: '100%',
  },
  mosaicSingle: {
    width: '100%',
  },
  mosaicDouble: {
    width: '50%',
  },
  mosaicFirstOfThree: {
    flex: 1.2,
  },
  emptyCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 17,
    marginRight: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
})
