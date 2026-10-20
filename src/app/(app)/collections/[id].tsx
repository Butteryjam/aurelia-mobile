import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft,
  Plus,
  Trash2,
  BookOpen,
  FolderHeart,
  AlertCircle,
  FolderMinus,
} from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import {
  useCollectionDetail,
  useAddRecipeToCollection,
  useRemoveRecipeFromCollection,
  useDeleteCollection,
} from '@/features/collections/hooks'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { AddRecipeModal } from '@/components/collections/add-recipe-modal'
import { EmptyState } from '@/components/common/empty-state'
import type { RecipeListItem } from '@/features/recipes/types'

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const collectionId = (id as string) || ''
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, radii, fontFamilies, shadows } = useAureliaTheme()

  const { data, isLoading, isError, refetch, isRefetching } = useCollectionDetail(collectionId)
  const addRecipeMutation = useAddRecipeToCollection()
  const removeRecipeMutation = useRemoveRecipeFromCollection()
  const deleteCollectionMutation = useDeleteCollection()

  const [addModalVisible, setAddModalVisible] = useState(false)

  const handleAddRecipe = async (recipe: RecipeListItem) => {
    await addRecipeMutation.mutateAsync({ collectionId, recipeId: recipe.id })
    setAddModalVisible(false)
  }

  const handleRemoveRecipe = (recipe: RecipeListItem) => {
    Alert.alert(
      'Remove Recipe?',
      `Remove "${recipe.title}" from this collection? (The recipe will remain in your vault).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            removeRecipeMutation.mutate({ collectionId, recipeId: recipe.id }),
        },
      ]
    )
  }

  const handleDeleteCollection = () => {
    Alert.alert(
      'Delete Collection?',
      'Are you sure you want to delete this collection? Recipes inside will not be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteCollectionMutation.mutateAsync(collectionId)
            router.replace('/collections')
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
          Opening binder...
        </Text>
      </View>
    )
  }

  if (isError || !data?.collection) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <AlertCircle size={40} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
          Collection Not Found
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
          onPress={() => router.replace('/collections')}
          accessibilityRole="button"
          accessibilityLabel="Back to collections"
        >
          <Text style={[styles.backButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
            Return to Collections
          </Text>
        </Pressable>
      </View>
    )
  }

  const { collection, recipes } = data

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Nav Bar */}
      <View style={[styles.topNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.navBackButton, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.pill }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.navTitleBox}>
          <Text
            style={[styles.navTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}
            numberOfLines={1}
          >
            {collection.name}
          </Text>
          <Text
            style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}
          >
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </Text>
        </View>

        <View style={styles.navActions}>
          <Pressable
            style={[styles.navAddButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
            onPress={() => setAddModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add recipe to collection"
          >
            <Plus size={18} color={colors.primaryForeground} />
          </Pressable>

          <Pressable
            style={[
              styles.navDeleteButton,
              {
                backgroundColor: colors.destructive + '14',
                borderColor: colors.destructive + '30',
                borderRadius: radii.pill,
              },
            ]}
            onPress={handleDeleteCollection}
            accessibilityRole="button"
            accessibilityLabel="Delete collection"
          >
            <Trash2 size={16} color={colors.destructive} />
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 60 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      >
        {/* Collection Header Banner */}
        <View
          style={[
            styles.bannerCard,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
            },
          ]}
        >
          <View style={styles.bannerHeader}>
            <View
              style={[
                styles.bannerIconWrapper,
                { backgroundColor: colors.primary + '18', borderRadius: radii.pill },
              ]}
            >
              <FolderHeart size={18} color={colors.primary} />
            </View>
            <Text
              style={[styles.bannerTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}
            >
              {collection.name}
            </Text>
          </View>
          {collection.description ? (
            <Text
              style={[
                styles.bannerDescription,
                { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular },
              ]}
            >
              {collection.description}
            </Text>
          ) : null}
        </View>

        {recipes.length > 0 ? (
          <View style={styles.recipesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text
                style={[
                  styles.sectionHeading,
                  { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium },
                ]}
              >
                Recipes in Binder ({recipes.length})
              </Text>
              <Pressable
                style={styles.addInlineButton}
                onPress={() => setAddModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Add recipe"
              >
                <Plus size={14} color={colors.primary} />
                <Text
                  style={[
                    styles.addInlineText,
                    { color: colors.primary, fontFamily: fontFamilies.sansMedium },
                  ]}
                >
                  Add Recipe
                </Text>
              </Pressable>
            </View>

            {recipes.map((recipe) => (
              <View key={recipe.id} style={styles.recipeCardWrapper}>
                <RecipeCard recipe={recipe} />
                <Pressable
                  style={[
                    styles.removeRecipeAffordance,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.pill,
                    },
                  ]}
                  onPress={() => handleRemoveRecipe(recipe)}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${recipe.title} from collection`}
                >
                  <FolderMinus size={13} color={colors.destructive} />
                  <Text
                    style={[
                      styles.removeRecipeText,
                      { color: colors.destructive, fontFamily: fontFamilies.sansRegular },
                    ]}
                  >
                    Remove from binder
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={BookOpen}
              title="No recipes in this binder"
              description="Add favorite creations, menu ideas, or weeknight staples to this collection."
              actionLabel="Add Recipe"
              onAction={() => setAddModalVisible(true)}
            />
          </View>
        )}
      </ScrollView>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        visible={addModalVisible}
        collectionId={collectionId}
        onClose={() => setAddModalVisible(false)}
        onSelectRecipe={handleAddRecipe}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  navBackButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navAddButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDeleteButton: {
    width: 38,
    height: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  bannerCard: {
    padding: 18,
    borderWidth: 1,
    marginBottom: 20,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  bannerDescription: {
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  recipesSection: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addInlineText: {
    fontSize: 12,
    fontWeight: '600',
  },
  recipeCardWrapper: {
    marginBottom: 16,
  },
  removeRecipeAffordance: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 6,
    gap: 5,
  },
  removeRecipeText: {
    fontSize: 11,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
  },
})
