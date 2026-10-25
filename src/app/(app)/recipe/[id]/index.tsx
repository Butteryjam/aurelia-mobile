import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  Heart,
  Share2,
  Clock,
  ChefHat,
  Sparkles,
  BookOpen,
  Info,
  Play,
  Pencil,
  Wand2,
  ShoppingCart,
  Trash2,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useRecipeDetail, useToggleFavorite, useDeleteRecipe } from '@/features/recipes/hooks'
import { useActiveShoppingList, useAddRecipeToShoppingList } from '@/features/shopping/hooks'
import { AureliaImage } from '@/components/common/aurelia-image'
import { ServingScaler } from '@/components/recipes/serving-scaler'
import { IngredientItem } from '@/components/recipes/ingredient-item'
import { InstructionStep } from '@/components/recipes/instruction-step'
import { EmptyState } from '@/components/common/empty-state'
import { Skeleton } from '@/components/common/skeleton'
import { RecipeModificationModal } from '@/components/ai/recipe-modification-modal'

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const { data: recipe, isLoading, isError, refetch } = useRecipeDetail(id as string)
  const toggleFavorite = useToggleFavorite()
  const deleteRecipeMutation = useDeleteRecipe()
  const { data: activeShoppingList } = useActiveShoppingList()
  const addRecipeToShopping = useAddRecipeToShoppingList()
  const [shoppingNotice, setShoppingNotice] = useState<string | null>(null)

  // Serving scaling state
  const [servings, setServings] = useState<number>(4)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(new Set())
  const [modificationVisible, setModificationVisible] = useState(false)

  const handleDeleteRecipe = () => {
    if (deleteRecipeMutation?.isPending) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    Alert.alert(
      'Delete this recipe?',
      'This recipe will be permanently deleted. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Recipe',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipeMutation.mutateAsync(id as string)
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
              if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/(app)/(tabs)/recipes')
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete recipe.')
            }
          },
        },
      ]
    )
  }

  const handleAddToShopping = async () => {
    if (!recipe || !activeShoppingList) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    try {
      const res = (await addRecipeToShopping.mutateAsync({
        shoppingListId: activeShoppingList.id,
        recipeId: recipe.id,
        targetServings: servings,
      })) as { addedCount: number }
      setShoppingNotice(`Added ${res.addedCount} ingredients to shopping list!`)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setTimeout(() => setShoppingNotice(null), 3500)
    } catch (err: any) {
      setShoppingNotice(err.message || 'Could not add to shopping list.')
      setTimeout(() => setShoppingNotice(null), 3500)
    }
  }

  // Initialize servings from recipe when loaded
  useEffect(() => {
    if (recipe?.servings) {
      setServings(recipe.servings)
    }
  }, [recipe?.servings])

  const handleFavoriteToggle = () => {
    if (!recipe) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    toggleFavorite.mutate({
      recipeId: recipe.id,
      isCurrentlyFavorite: recipe.isFavorite,
    })
  }

  const handleShare = async () => {
    if (!recipe) return
    try {
      await Share.share({
        title: recipe.title,
        message: `Check out this heirloom recipe for ${recipe.title} on Aurelia: ${recipe.description || ''}`,
      })
    } catch {
      // User cancelled share
    }
  }

  const toggleIngredientCheck = (ingredientId: string) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev)
      if (next.has(ingredientId)) {
        next.delete(ingredientId)
      } else {
        next.add(ingredientId)
      }
      return next
    })
  }

  const handleStartCookMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    router.push({
      pathname: '/(app)/cook/[id]',
      params: { id, servings: String(servings) },
    })
  }

  const handleAskAiChef = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    router.push('/(app)/(tabs)/chef')
  }

  const handleOpenModification = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setModificationVisible(true)
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topNav}>
          <Pressable
            onPress={() => router.back()}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <Skeleton height={240} borderRadius={0} />
          <View style={{ padding: spacing.base }}>
            <Skeleton width="40%" height={14} style={{ marginBottom: 10 }} />
            <Skeleton width="90%" height={32} style={{ marginBottom: 12 }} />
            <Skeleton width="70%" height={18} style={{ marginBottom: 20 }} />
            <Skeleton height={50} borderRadius={radii.card} style={{ marginBottom: 24 }} />
            <Skeleton width="50%" height={24} style={{ marginBottom: 12 }} />
            <Skeleton height={120} borderRadius={radii.card} />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (isError || !recipe) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.topNav}>
          <Pressable
            onPress={() => router.back()}
            style={styles.navButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ArrowLeft size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.errorWrapper}>
          <EmptyState
            icon={BookOpen}
            title="Recipe not found"
            description="We could not locate this dish in your culinary vault. It may have been relocated or deleted."
            actionLabel="Try Again"
            onAction={() => refetch()}
            secondaryActionLabel="All Recipes"
            onSecondaryAction={() => router.replace('/(app)/(tabs)/recipes')}
          />
        </View>
      </SafeAreaView>
    )
  }

  const baseServings = recipe.servings || 4
  const difficultyDisplay = recipe.difficulty
    ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1)
    : null

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Floating Top Navigation Bar */}
      <View style={[styles.topNav, { borderBottomColor: colors.border + '60' }]}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace('/(app)/(tabs)/recipes')
            }
          }}
          style={({ pressed }) => [
            styles.navButton,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.pill,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back to recipe list"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={colors.foreground} />
        </Pressable>

        <View style={styles.topRightActions}>
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
                marginRight: 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share recipe"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 size={18} color={colors.foreground} />
          </Pressable>

          <Pressable
            onPress={() => router.push(`/(app)/recipe/${id}/edit`)}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
                marginRight: 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit recipe"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Pencil size={18} color={colors.foreground} />
          </Pressable>

          <Pressable
            onPress={handleFavoriteToggle}
            disabled={toggleFavorite.isPending}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={18}
              color={recipe.isFavorite ? colors.primary : colors.mutedForeground}
              fill={recipe.isFavorite ? colors.primary : 'transparent'}
            />
          </Pressable>

          <Pressable
            onPress={handleDeleteRecipe}
            disabled={deleteRecipeMutation?.isPending ?? false}
            style={({ pressed }) => [
              styles.navButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.destructive + '40',
                borderRadius: radii.pill,
                opacity: pressed ? 0.7 : 1,
                marginLeft: 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Delete recipe"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {deleteRecipeMutation?.isPending ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <Trash2 size={18} color={colors.destructive} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. Hero Image */}
        <View style={styles.heroMediaContainer}>
          <AureliaImage
            source={recipe.image_url}
            style={styles.heroImage}
            aspectRatio={16 / 10}
            accessibilityLabel={recipe.title}
          />
        </View>

        {/* 3. Title, Eyebrow & Description */}
        <View style={styles.bodySection}>
          <View style={styles.eyebrowRow}>
            {recipe.cuisine && (
              <View
                style={[
                  styles.tagBadge,
                  {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    borderRadius: radii.small,
                  },
                ]}
              >
                <Text style={[typography.caption, { color: colors.secondaryForeground, fontWeight: '700', fontSize: 11 }]}>
                  {recipe.cuisine.toUpperCase()}
                </Text>
              </View>
            )}

            {recipe.category && (
              <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 8 }]}>
                {recipe.category}
              </Text>
            )}
          </View>

          <Text
            style={[
              typography.pageTitle,
              { color: colors.foreground, fontSize: 28, lineHeight: 34, marginTop: spacing.xs },
            ]}
          >
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text
              style={[
                typography.body,
                { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: spacing.sm },
              ]}
            >
              {recipe.description}
            </Text>
          )}

          {/* 4. Metadata Strip (Prep, Cook, Total, Difficulty) */}
          <View
            style={[
              styles.metadataGrid,
              shadows.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
                marginTop: spacing.base,
              },
            ]}
          >
            {recipe.prep_time ? (
              <View style={styles.metaCell}>
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                  PREP
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginTop: 2 }]}>
                  {recipe.prep_time}m
                </Text>
              </View>
            ) : null}

            {recipe.cook_time ? (
              <View style={styles.metaCell}>
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                  COOK
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginTop: 2 }]}>
                  {recipe.cook_time}m
                </Text>
              </View>
            ) : null}

            {recipe.total_time ? (
              <View style={styles.metaCell}>
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                  TOTAL
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginTop: 2 }]}>
                  {recipe.total_time}m
                </Text>
              </View>
            ) : null}

            {difficultyDisplay && (
              <View style={styles.metaCell}>
                <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11 }]}>
                  LEVEL
                </Text>
                <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700', marginTop: 2 }]}>
                  {difficultyDisplay}
                </Text>
              </View>
            )}
          </View>

          {/* 5. Serving Scaler */}
          <View style={{ marginTop: spacing.lg }}>
            <ServingScaler
              baseServings={baseServings}
              currentServings={servings}
              onChangeServings={setServings}
            />
          </View>

          {/* 6. Ingredients Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 20 }]}>
                Ingredients
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                {checkedIngredients.size} of {recipe.ingredients.length} checked
              </Text>
            </View>

            {recipe.ingredients.length === 0 ? (
              <Text style={[typography.body, { color: colors.mutedForeground, fontStyle: 'italic', marginVertical: 8 }]}>
                No specific ingredients registered for this dish.
              </Text>
            ) : (
              <>
                <View
                  style={[
                    styles.ingredientsCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: radii.card,
                    },
                  ]}
                >
                  {recipe.ingredients.map((ing) => (
                    <IngredientItem
                      key={ing.id}
                      ingredient={ing}
                      baseServings={baseServings}
                      currentServings={servings}
                      isChecked={checkedIngredients.has(ing.id)}
                      onToggle={() => toggleIngredientCheck(ing.id)}
                    />
                  ))}
                </View>

                {/* Add to Shopping List Button */}
                <Pressable
                  onPress={handleAddToShopping}
                  disabled={addRecipeToShopping.isPending}
                  style={({ pressed }) => [
                    styles.addToShoppingButton,
                    {
                      backgroundColor: colors.secondary,
                      borderColor: colors.border,
                      borderRadius: radii.control,
                      marginTop: spacing.sm,
                      opacity: pressed || addRecipeToShopping.isPending ? 0.7 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Add ingredients to shopping list"
                >
                  <ShoppingCart size={16} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontSize: 13, fontWeight: '600' }]}>
                    {addRecipeToShopping.isPending ? 'Adding to Shopping List...' : 'Add Ingredients to Shopping List'}
                  </Text>
                </Pressable>

                {shoppingNotice && (
                  <View
                    style={{
                      marginTop: spacing.xs,
                      padding: spacing.xs,
                      backgroundColor: colors.primary + '15',
                      borderRadius: radii.small,
                      borderWidth: 1,
                      borderColor: colors.primary + '30',
                    }}
                  >
                    <Text style={[typography.caption, { color: colors.primary, fontWeight: '600', textAlign: 'center' }]}>
                      {shoppingNotice}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* 7. Instructions Section */}
          <View style={styles.section}>
            <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 20, marginBottom: spacing.sm }]}>
              Instructions
            </Text>

            {recipe.instructions.length === 0 ? (
              <Text style={[typography.body, { color: colors.mutedForeground, fontStyle: 'italic', marginVertical: 8 }]}>
                No detailed preparation instructions registered.
              </Text>
            ) : (
              <View
                style={[
                  styles.instructionsCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.card,
                    paddingHorizontal: spacing.base,
                  },
                ]}
              >
                {recipe.instructions.map((inst, index) => (
                  <InstructionStep
                    key={inst.id}
                    instruction={inst}
                    isLast={index === recipe.instructions.length - 1}
                  />
                ))}
              </View>
            )}
          </View>

          {/* 8. Chef Notes (Conditional) */}
          {recipe.notes && (
            <View style={styles.section}>
              <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 18, marginBottom: spacing.xs }]}>
                Chef's Notes &amp; Advice
              </Text>
              <View
                style={[
                  styles.notesCard,
                  {
                    backgroundColor: colors.secondary + '60',
                    borderColor: colors.border,
                    borderRadius: radii.card,
                    padding: spacing.base,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Info size={16} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
                    Heirloom Guidance
                  </Text>
                </View>
                <Text style={[typography.body, { color: colors.foreground, fontSize: 14, lineHeight: 21 }]}>
                  {recipe.notes}
                </Text>
              </View>
            </View>
          )}

          {/* 9. AI Assistance Affordance Buttons */}
          <View style={{ marginTop: spacing.xl, marginBottom: 8, gap: 10 }}>
            <Pressable
              onPress={handleOpenModification}
              style={({ pressed }) => [
                styles.aiAdvisorButton,
                {
                  backgroundColor: colors.primary + '12',
                  borderColor: colors.primary + '40',
                  borderRadius: radii.control,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="AI Modify this recipe"
            >
              <Wand2 size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[typography.bodyMedium, { color: colors.primary, fontSize: 13, fontWeight: '700' }]}>
                AI Modify Recipe
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAskAiChef}
              style={({ pressed }) => [
                styles.aiAdvisorButton,
                {
                  backgroundColor: colors.secondary,
                  borderColor: colors.border,
                  borderRadius: radii.control,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Consult AI Chef about substitutions or wine pairings"
            >
              <Sparkles size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontSize: 13, fontWeight: '600' }]}>
                Ask AI Chef
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* 10. Sticky Primary Action Bar (Cook Mode) */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable
          onPress={handleStartCookMode}
          style={({ pressed }) => [
            styles.cookModeButton,
            {
              backgroundColor: colors.primary,
              borderRadius: radii.control,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Start Cook Mode for this recipe"
        >
          <Play size={18} color={colors.primaryForeground} fill={colors.primaryForeground} style={{ marginRight: 8 }} />
          <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontSize: 15, fontWeight: '700' }]}>
            Start Cook Mode
          </Text>
        </Pressable>
      </View>

      {/* AI Modification Modal */}
      <RecipeModificationModal
        visible={modificationVisible}
        onClose={() => setModificationVisible(false)}
        recipeId={id as string}
        recipeTitle={recipe?.title || 'Recipe'}
      />
    </SafeAreaView>
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
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 90,
  },
  heroMediaContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
  },
  bodySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  metadataGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  metaCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ingredientsCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  instructionsCard: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  notesCard: {
    borderWidth: 1,
  },
  aiAdvisorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderWidth: 1,
  },
  addToShoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    borderWidth: 1,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  cookModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  errorWrapper: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
})
