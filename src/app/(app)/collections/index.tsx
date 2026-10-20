import React, { useState } from 'react'
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
import { ChevronLeft, Plus, FolderHeart, AlertCircle } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useCollections, useCreateCollection } from '@/features/collections/hooks'
import { CollectionCard } from '@/components/collections/collection-card'
import { CreateCollectionModal } from '@/components/collections/create-collection-modal'
import { EmptyState } from '@/components/common/empty-state'

export default function CollectionsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, radii, fontFamilies } = useAureliaTheme()
  const { data: collections, isLoading, isError, refetch, isRefetching } = useCollections()
  const createMutation = useCreateCollection()

  const [createModalVisible, setCreateModalVisible] = useState(false)

  const handleCreateCollection = async (name: string, description: string) => {
    const res = await createMutation.mutateAsync({ name, description })
    if (res?.id) {
      router.push(`/collections/${res.id}`)
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.topNav,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={[styles.navBackButton, { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.pill }]}
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
            Collections
          </Text>
          <Text style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            Thematic binders & menu lists
          </Text>
        </View>

        <Pressable
          style={[styles.navAddButton, { borderRadius: radii.pill, backgroundColor: colors.primary }]}
          onPress={() => setCreateModalVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Create collection"
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            Curating your binders...
          </Text>
        </View>
      ) : isError ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <AlertCircle size={40} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
            Could not load collections
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading collections"
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : collections && collections.length > 0 ? (
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
          <Text style={[styles.collectionCountNote, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
            {collections.length} {collections.length === 1 ? 'Curated Binder' : 'Curated Binders'}
          </Text>

          {collections.map((col) => (
            <CollectionCard
              key={col.id}
              collection={col}
              onPress={() => router.push(`/collections/${col.id}`)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={FolderHeart}
            title="No collections yet"
            description="Organize your recipes into custom binders by cuisine, occasion, or seasonal menus."
            actionLabel="Create Collection"
            onAction={() => setCreateModalVisible(true)}
          />
        </View>
      )}

      {/* Create Collection Dialog Modal */}
      <CreateCollectionModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateCollection}
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
  navAddButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
  },
  collectionCountNote: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
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
