/**
 * Aurelia Mobile — Home Screen (Design System Aligned)
 *
 * Adapted from the Aurelia web dashboard visual language:
 * - Personalized greeting (serif heading)
 * - Recipe search bar (navigates to Recipes with query)
 * - Compact stats strip (links to Recipes / Planner)
 * - Compact Quick Actions (2×2)
 * - Upcoming Planned Meals (horizontal scroll or compact empty)
 * - Recent Recipes (vertical list)
 * - Recent Cooking Activity
 *
 * No hardcoded colors. Full Light/Dark/System theme support.
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
  TextInput,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  BookOpen,
  Calendar,
  ArrowRight,
  Search,
  Clock,
  Star,
} from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useHomeDashboard, useToggleFavorite } from '@/features/recipes/hooks'
import { QuickActions } from '@/components/home/quick-actions'
import { UpcomingMealCard } from '@/components/home/upcoming-meal-card'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { EmptyState } from '@/components/common/empty-state'
import { Skeleton, SkeletonRecipeCard, SkeletonUpcomingMeal } from '@/components/common/skeleton'
import { AureliaImage } from '@/components/common/aurelia-image'

function getTimeAwareGreeting(): { greeting: string; context: string } {
  const hour = new Date().getHours()
  if (hour < 12) {
    return { greeting: 'Good Morning', context: 'Morning culinary inspirations' }
  }
  if (hour < 17) {
    return { greeting: 'Good Afternoon', context: 'Midday kitchen sanctuary' }
  }
  return { greeting: 'Good Evening', context: 'Evening dining & heirloom dishes' }
}

function formatDateHeader(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
}

export default function HomeScreen() {
  const router = useRouter()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()
  const { data, isLoading, isError, refetch, isRefetching } = useHomeDashboard()
  const toggleFavorite = useToggleFavorite()

  const [searchQuery, setSearchQuery] = useState('')

  const { greeting, context } = getTimeAwareGreeting()

  const handleFavoriteToggle = (recipeId: string, currentStatus: boolean) => {
    toggleFavorite.mutate({ recipeId, isCurrentlyFavorite: currentStatus })
  }

  const handleSearchSubmit = () => {
    const q = searchQuery.trim()
    if (q.length > 0) {
      router.push({ pathname: '/(app)/(tabs)/recipes', params: { query: q } } as any)
    } else {
      router.push('/(app)/(tabs)/recipes')
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header Skeleton */}
          <View style={styles.header}>
            <Skeleton width={100} height={11} style={{ marginBottom: 6 }} />
            <Skeleton width="75%" height={28} style={{ marginBottom: 4 }} />
            <Skeleton width="45%" height={13} />
          </View>

          {/* Search Skeleton */}
          <Skeleton height={46} borderRadius={radii.control} style={{ marginVertical: 14 }} />

          {/* Stats Skeleton */}
          <Skeleton height={60} borderRadius={radii.card} style={{ marginBottom: 18 }} />

          {/* Quick Actions Skeleton */}
          <View style={{ marginBottom: 20 }}>
            <Skeleton width={90} height={11} style={{ marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Skeleton width="48%" height={72} borderRadius={radii.card} />
              <Skeleton width="48%" height={72} borderRadius={radii.card} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <Skeleton width="48%" height={72} borderRadius={radii.card} />
              <Skeleton width="48%" height={72} borderRadius={radii.card} />
            </View>
          </View>

          {/* Upcoming Meals Skeleton */}
          <View style={{ marginBottom: 20 }}>
            <Skeleton width={120} height={18} style={{ marginBottom: 10 }} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <SkeletonUpcomingMeal />
              <SkeletonUpcomingMeal />
            </View>
          </View>

          {/* Recent Recipes Skeleton */}
          <View>
            <Skeleton width={130} height={18} style={{ marginBottom: 12 }} />
            <SkeletonRecipeCard />
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  if (isError || !data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <EmptyState
            icon={BookOpen}
            title="Unable to load sanctuary"
            description="We could not connect to your culinary vault. Please check your connection and try again."
            actionLabel="Try Again"
            onAction={() => refetch()}
          />
        </View>
      </SafeAreaView>
    )
  }

  const { displayName, stats, upcomingMeals, recentRecipes, recentCookingSessions } = data

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Header ── */}
        <View style={styles.header}>
          <Text style={[typography.eyebrow, { color: colors.primary }]}>
            {context}
          </Text>
          <Text style={[typography.pageTitle, { color: colors.foreground, marginTop: spacing.xs }]}>
            {greeting},{' '}
            <Text style={{ color: colors.primary }}>{displayName}</Text>
          </Text>
          <Text style={[typography.body, { color: colors.mutedForeground, marginTop: 2, fontSize: 13 }]}>
            {formatDateHeader()} · Your culinary vault
          </Text>
        </View>

        {/* ── 2. Search Bar ── */}
        <Pressable
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.control,
            },
          ]}
          onPress={() => {}}
          accessibilityLabel="Search your recipes"
        >
          <Search size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search your recipes..."
            placeholderTextColor={colors.mutedForeground}
            style={[typography.body, styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            accessibilityLabel="Search recipes"
          />
        </Pressable>

        {/* ── 3. Compact Dashboard Stats ── */}
        <View
          style={[
            styles.statsStrip,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
            },
          ]}
          accessibilityRole="summary"
        >
          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/(app)/(tabs)/recipes')}
            accessibilityRole="button"
            accessibilityLabel={`${stats.recipeCount} recipes`}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {stats.recipeCount}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
              Recipes
            </Text>
          </Pressable>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/(app)/(tabs)/recipes')}
            accessibilityRole="button"
            accessibilityLabel={`${stats.favoriteCount} favorites`}
          >
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {stats.favoriteCount}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
              Favorites
            </Text>
          </Pressable>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/(app)/(tabs)/planner')}
            accessibilityRole="button"
            accessibilityLabel={`${stats.upcomingMealCount} planned meals`}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {stats.upcomingMealCount}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
              Planned
            </Text>
          </Pressable>

          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

          <Pressable
            style={styles.statItem}
            onPress={() => router.push('/(app)/(tabs)/planner')}
            accessibilityRole="button"
            accessibilityLabel={`${stats.cookingSessionCount ?? 0} cook sessions`}
          >
            <Text style={[styles.statNumber, { color: colors.foreground }]}>
              {stats.cookingSessionCount ?? 0}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, fontSize: 11, marginTop: 2 }]}>
              Cooked
            </Text>
          </Pressable>
        </View>

        {/* ── 4. Quick Actions ── */}
        <View style={styles.section}>
          <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: 10 }]}>
            Quick Actions
          </Text>
          <QuickActions />
        </View>

        {/* ── 5. Upcoming Planned Meals ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.sectionTitle, { color: colors.foreground }]}>
                Upcoming Meals
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 1, fontSize: 12 }]}>
                Your schedule for today and the days ahead
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(app)/(tabs)/planner')}
              style={styles.viewAllButton}
              accessibilityRole="button"
              accessibilityLabel="Open meal planner"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '600', marginRight: 3, fontSize: 12 }]}>
                Open Planner
              </Text>
              <ArrowRight size={12} color={colors.primary} />
            </Pressable>
          </View>

          {upcomingMeals.length === 0 ? (
            <Pressable
              onPress={() => router.push('/(app)/(tabs)/planner')}
              style={[
                styles.emptyMealsCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.card,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Schedule a meal"
            >
              <Calendar size={20} color={colors.mutedForeground} />
              <Text style={[typography.bodyMedium, { color: colors.foreground, marginTop: 8, fontWeight: '600' }]}>
                No planned meals
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 4, textAlign: 'center', lineHeight: 18 }]}>
                Schedule dishes for this week to keep groceries and prep effortlessly organized.
              </Text>
              <View
                style={[
                  styles.scheduleButton,
                  { backgroundColor: colors.secondary, borderRadius: radii.control },
                ]}
              >
                <Calendar size={13} color={colors.primary} />
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600', marginLeft: 6, fontSize: 12 }]}>
                  Plan a Meal
                </Text>
              </View>
            </Pressable>
          ) : (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={upcomingMeals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <UpcomingMealCard item={item} />}
              contentContainerStyle={styles.horizontalScrollContent}
            />
          )}
        </View>

        {/* ── 6. Recent Recipes ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[typography.sectionTitle, { color: colors.foreground }]}>
                Recent Recipes
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 1, fontSize: 12 }]}>
                Dishes recently added or crafted in your kitchen
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/(app)/(tabs)/recipes')}
              style={styles.viewAllButton}
              accessibilityRole="button"
              accessibilityLabel={`View all ${stats.recipeCount} recipes`}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '600', marginRight: 3, fontSize: 12 }]}>
                View all ({stats.recipeCount})
              </Text>
              <ArrowRight size={12} color={colors.primary} />
            </Pressable>
          </View>

          {recentRecipes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Your cookbook is empty"
              description="Begin your collection by adding a cherished heirloom dish or importing from a web recipe."
              actionLabel="Add First Recipe"
              onAction={() => router.push('/(app)/recipe/new')}
              secondaryActionLabel="Import Recipe"
              onSecondaryAction={() => router.push('/(app)/recipe/import')}
            />
          ) : (
            <View style={styles.recipesList}>
              {recentRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onToggleFavorite={handleFavoriteToggle}
                  isFavoriteLoading={toggleFavorite.isPending}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── 7. Recent Cooking Activity ── */}
        {recentCookingSessions && recentCookingSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[typography.sectionTitle, { color: colors.foreground, marginBottom: 4 }]}>
              Recent Cooking Activity
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, marginBottom: 12, fontSize: 12 }]}>
              Your kitchen history, ratings, and culinary notes
            </Text>

            {recentCookingSessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => session.recipe_id && router.push(`/(app)/recipe/${session.recipe_id}`)}
                style={[
                  styles.cookSessionCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.card,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Cooked ${session.recipe?.title || 'recipe'}`}
              >
                {/* Recipe Image Thumbnail */}
                <View
                  style={[
                    styles.cookSessionThumb,
                    { backgroundColor: colors.secondary, borderRadius: radii.small },
                  ]}
                >
                  {session.recipe?.image_url ? (
                    <AureliaImage
                      source={session.recipe.image_url}
                      style={{ width: 52, height: 52, borderRadius: radii.small }}
                      aspectRatio={1}
                      accessibilityLabel={session.recipe?.title || 'Recipe'}
                    />
                  ) : (
                    <BookOpen size={20} color={colors.primary} />
                  )}
                </View>

                <View style={{ flex: 1, paddingLeft: 12 }}>
                  <Text
                    style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600', fontSize: 14 }]}
                    numberOfLines={1}
                  >
                    {session.recipe?.title || 'Unnamed Recipe'}
                  </Text>

                  <View style={styles.cookSessionMeta}>
                    <Clock size={11} color={colors.mutedForeground} />
                    <Text style={[typography.caption, { color: colors.mutedForeground, marginLeft: 4, fontSize: 11 }]}>
                      {session.cooked_at
                        ? (() => {
                            const diff = Math.round(
                              (Date.now() - new Date(session.cooked_at).getTime()) / (1000 * 60 * 60 * 24)
                            )
                            return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : `${diff} days ago`
                          })()
                        : 'Recently'}
                    </Text>
                  </View>
                </View>

                {session.rating != null && (
                  <View
                    style={[
                      styles.ratingBadge,
                      { backgroundColor: colors.warning + '20', borderRadius: radii.small },
                    ]}
                  >
                    <Star size={11} color={colors.warning} fill={colors.warning} />
                    <Text style={[typography.caption, { color: colors.warning, fontWeight: '700', marginLeft: 3, fontSize: 11 }]}>
                      {session.rating}/5
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 52,
  },
  header: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    padding: 0,
    fontSize: 14,
  },
  statsStrip: {
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: 26,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
  },
  emptyMealsCard: {
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 14,
  },
  horizontalScrollContent: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  recipesList: {
    gap: 0,
  },
  cookSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  cookSessionThumb: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cookSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  errorContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
})
