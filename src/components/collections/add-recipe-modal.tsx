import React from 'react'
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { X, Plus, BookOpen, Clock } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useEligibleRecipesForCollection } from '@/features/collections/hooks'
import type { RecipeListItem } from '@/features/recipes/types'

interface Props {
  visible: boolean
  collectionId: string
  onClose: () => void
  onSelectRecipe: (recipe: RecipeListItem) => Promise<void>
}

export function AddRecipeModal({ visible, collectionId, onClose, onSelectRecipe }: Props) {
  const { colors, radii, fontFamilies } = useAureliaTheme()
  const { data: eligibleRecipes, isLoading } = useEligibleRecipesForCollection(
    collectionId,
    visible
  )

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, borderTopLeftRadius: radii.card, borderTopRightRadius: radii.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
                Add Recipe to Binder
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                Select from your personal recipes
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close add recipe sheet"
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                Fetching your recipes...
              </Text>
            </View>
          ) : eligibleRecipes && eligibleRecipes.length > 0 ? (
            <ScrollView
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            >
              {eligibleRecipes.map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={({ pressed }) => [
                    styles.recipeRow,
                    { borderBottomColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => onSelectRecipe(recipe)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${recipe.title} to collection`}
                >
                  <View style={[styles.thumbWrapper, { backgroundColor: colors.secondary, borderRadius: radii.control }]}>
                    {recipe.image_url ? (
                      <Image source={{ uri: recipe.image_url }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <View style={styles.placeholderThumb}>
                        <BookOpen size={16} color={colors.primary} />
                      </View>
                    )}
                  </View>

                  <View style={styles.recipeInfo}>
                    <Text style={[styles.recipeTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]} numberOfLines={1}>
                      {recipe.title}
                    </Text>
                    <View style={styles.metaRow}>
                      {recipe.cook_time ? (
                        <View style={styles.metaItem}>
                          <Clock size={12} color={colors.mutedForeground} />
                          <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                            {recipe.cook_time}m
                          </Text>
                        </View>
                      ) : null}
                      {recipe.cuisine ? (
                        <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                          {recipe.cuisine}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={[styles.addCircle, { backgroundColor: colors.primary }]}>
                    <Plus size={16} color={colors.primaryForeground} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <BookOpen size={36} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
                All recipes already added
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                Every dish in your collection is already in this binder.
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '75%',
    borderTopWidth: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  thumbWrapper: {
    width: 48,
    height: 48,
    overflow: 'hidden',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  placeholderThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeTitle: {
    fontSize: 15,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
  },
  addCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
})
