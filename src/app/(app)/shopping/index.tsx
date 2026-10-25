/**
 * Aurelia Mobile — Shopping Lists Overview Screen
 *
 * Full overview of all shopping lists for the authenticated user:
 * - Lists overview with item count and completion progress
 * - Create new named shopping lists (Weekly Groceries, Biryani Ingredients, etc.)
 * - Open specific list by stable database ID
 * - Delete list with confirmation
 * - Pull-to-refresh and polished empty states
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft,
  Plus,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import {
  useUserShoppingLists,
  useCreateShoppingList,
  useDeleteShoppingList,
} from '@/features/shopping/hooks'
import { EmptyState } from '@/components/common/empty-state'
import type { ShoppingListSummary } from '@/features/shopping/types'

export default function ShoppingListsOverviewScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, radii, fontFamilies } = useAureliaTheme()

  const { data: lists, isLoading, isError, error, refetch, isRefetching } = useUserShoppingLists()
  const createMutation = useCreateShoppingList()
  const deleteMutation = useDeleteShoppingList()

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const handleOpenCreateModal = () => {
    setNewListName('')
    setCreateError(null)
    setCreateModalVisible(true)
  }

  const handleCreateList = async () => {
    const trimmed = newListName.trim()
    if (!trimmed) {
      setCreateError('Please enter a name for your shopping list.')
      return
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
      const newList = await createMutation.mutateAsync(trimmed)
      setCreateModalVisible(false)
      setNewListName('')
      if (newList?.id) {
        router.push(`/(app)/shopping/${newList.id}`)
      }
    } catch (err: any) {
      setCreateError(err.message || 'Could not create shopping list.')
    }
  }

  const handleDeleteList = (list: ShoppingListSummary) => {
    Alert.alert(
      'Delete Shopping List?',
      `Are you sure you want to delete "${list.name}" and all its ${list.itemCount} items? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
              await deleteMutation.mutateAsync(list.id)
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Could not delete shopping list.')
            }
          },
        },
      ]
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      {/* Top Header */}
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
              router.replace('/(app)/(tabs)/more')
            }
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={22} color={colors.foreground} />
        </Pressable>

        <View style={styles.navTitleBox}>
          <Text style={[styles.navTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
            Shopping Lists
          </Text>
          <Text style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            {lists ? `${lists.length} ${lists.length === 1 ? 'grocery list' : 'grocery lists'}` : 'Manage your groceries'}
          </Text>
        </View>

        <Pressable
          style={[styles.navAddButton, { borderRadius: radii.pill, backgroundColor: colors.primary }]}
          onPress={handleOpenCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Create shopping list"
        >
          <Plus size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            Loading your shopping lists...
          </Text>
        </View>
      ) : isError ? (
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <AlertCircle size={40} color={colors.destructive} />
          <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
            Could not load shopping lists
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
            {error?.message || 'Please check your connection and retry.'}
          </Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
            onPress={() => refetch()}
            accessibilityRole="button"
            accessibilityLabel="Retry loading shopping lists"
          >
            <Text style={[styles.retryButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
              Retry
            </Text>
          </Pressable>
        </View>
      ) : lists && lists.length > 0 ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {lists.map((list) => {
            const total = list.itemCount || 0
            const completed = list.completedCount || 0
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0

            return (
              <Pressable
                key={list.id}
                style={({ pressed }) => [
                  styles.listCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.card,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
                onPress={() => router.push(`/(app)/shopping/${list.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Shopping list ${list.name}, ${total} items`}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardTitleBox}>
                    <Text
                      style={[styles.listCardTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}
                      numberOfLines={1}
                    >
                      {list.name}
                    </Text>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: list.status === 'active' ? colors.primary + '16' : colors.muted,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: list.status === 'active' ? colors.primary : colors.mutedForeground,
                              fontFamily: fontFamilies.sansMedium,
                            },
                          ]}
                        >
                          {list.status === 'active' ? 'Active' : 'Archived'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.deleteListButton,
                      { opacity: pressed ? 0.6 : 1 },
                    ]}
                    onPress={() => handleDeleteList(list)}
                    accessibilityRole="button"
                    accessibilityLabel={`Delete ${list.name}`}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {/* Progress & Item Count */}
                <View style={styles.progressInfoRow}>
                  <Text style={[styles.progressInfoText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
                    {total === 0
                      ? 'No items'
                      : completed === total
                      ? `All ${total} items completed`
                      : `${completed} of ${total} items checked (${percent}%)`}
                  </Text>
                </View>

                {/* Visual Progress Bar */}
                {total > 0 && (
                  <View style={[styles.progressTrack, { backgroundColor: colors.border + '60' }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          backgroundColor: completed === total ? '#10B981' : colors.primary,
                          width: `${percent}%`,
                        },
                      ]}
                    />
                  </View>
                )}
              </Pressable>
            )
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon={ShoppingCart}
            title="No shopping lists yet"
            description="Create custom grocery lists for your weekly runs, party prep, or specific recipes."
            actionLabel="Create Shopping List"
            onAction={handleOpenCreateModal}
          />
        </View>
      )}

      {/* Create Shopping List Modal */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBox}>
                <Sparkles size={18} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
                  New Shopping List
                </Text>
              </View>
              <Pressable
                onPress={() => setCreateModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close dialog"
              >
                <X size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
              Give your shopping list a clear name (e.g. Weekly Groceries, Biryani Ingredients, Party Shopping).
            </Text>

            {createError ? (
              <View style={styles.createErrorBox}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={styles.createErrorText}>{createError}</Text>
              </View>
            ) : null}

            {/* Input field */}
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: radii.control,
                },
              ]}
              placeholder="e.g. Weekly Groceries"
              placeholderTextColor={colors.mutedForeground}
              value={newListName}
              onChangeText={(text) => {
                setNewListName(text)
                if (createError) setCreateError(null)
              }}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateList}
            />

            {/* Action Buttons */}
            <View style={styles.modalActionsRow}>
              <Pressable
                style={[styles.modalCancelButton, { borderColor: colors.border, borderRadius: radii.pill }]}
                onPress={() => setCreateModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancel"
              >
                <Text style={[styles.modalCancelText, { color: colors.foreground, fontFamily: fontFamilies.sansMedium }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalSubmitButton,
                  { backgroundColor: colors.primary, borderRadius: radii.pill },
                  createMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleCreateList}
                disabled={createMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Create list"
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
                    Create List
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBackButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  navTitleBox: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 12,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  navAddButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  listCard: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitleBox: {
    flex: 1,
    marginRight: 12,
  },
  listCardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteListButton: {
    padding: 4,
  },
  progressInfoRow: {
    marginTop: 12,
  },
  progressInfoText: {
    fontSize: 13,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  createErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  createErrorText: {
    color: '#DC2626',
    fontSize: 12,
    flex: 1,
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 14,
  },
  modalSubmitButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
