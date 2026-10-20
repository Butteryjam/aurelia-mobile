import React from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Heart, AlertCircle } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useFavoriteRecipes } from '@/features/recipes/hooks'
import { RecipeCard } from '@/components/recipes/recipe-card'
import { EmptyState } from '@/components/common/empty-state'

export default function FavoritesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()
  const { data: favorites, isLoading, isError, refetch, isRefetching } = useFavoriteRecipes()

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.topNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.navBackButton, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace('/(app)/(tabs)/home')
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.navTitleBox}>
          <Text style={[styles.navTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
            Favorites
          </Text>
          <Text style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            Starred heirloom dishes
          </Text>
        </View>

        <View
          style={[
            styles.navIconBox,
            { backgroundColor: colors.primary + '18', borderColor: colors.primary + '30' },
          ]}
        >
          <Heart size={18} color={colors.primary} fill={colors.primary} />
        </View>
      </View>

      {/* Body Content */}
      {isLoading ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            Fetching your favorite dishes...
          </Text>
        </View>
      ) : isError ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <AlertCircle size={40} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
            Could not load favorites
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading favorites"
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : favorites && favorites.length > 0 ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.countBadgeRow}>
            <Text style={[styles.countBadgeText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
              {favorites.length} {favorites.length === 1 ? 'Starred Recipe' : 'Starred Recipes'}
            </Text>
          </View>

          {favorites.map((recipe) => (
            <View key={recipe.id} style={styles.cardWrapper}>
              <RecipeCard recipe={recipe} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={Heart}
            title="No favorite recipes yet"
            description="Tap the heart icon on any recipe to save it to your curated favorites for instant access."
            actionLabel="Explore Recipes"
            onAction={() => router.push('/(app)/(tabs)/recipes')}
          />
        </View>
      )}
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
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitleBox: {
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  navIconBox: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  countBadgeRow: {
    marginBottom: 10,
  },
  countBadgeText: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardWrapper: {
    marginBottom: 8,
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
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
})
