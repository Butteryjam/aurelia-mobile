import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Save, AlertCircle, Sparkles } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useAuth } from '@/features/auth/auth-context'
import { useRecipeDetail } from '@/features/recipes/hooks'
import {
  fromRecipeDetailToFormData,
  validateRecipeForm,
  type RecipeFormData,
} from '@/features/recipes/recipe-form-schema'
import {
  saveRecipeDraft,
  loadRecipeDraft,
  clearRecipeDraft,
} from '@/features/recipes/draft-storage'
import { useUpdateRecipe } from '@/features/recipes/recipe-mutations'
import { RecipeBasicInfoSection } from '@/components/recipe-editor/recipe-basic-info-section'
import { RecipeImageSection } from '@/components/recipe-editor/recipe-image-section'
import { RecipeIngredientsSection } from '@/components/recipe-editor/recipe-ingredients-section'
import { RecipeInstructionsSection } from '@/components/recipe-editor/recipe-instructions-section'
import { RecipeTagsSection } from '@/components/recipe-editor/recipe-tags-section'

export default function EditRecipeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()
  const { user } = useAuth()
  const userId = user?.id || ''

  const { id } = useLocalSearchParams<{ id: string }>()
  const recipeId = (id as string) || ''

  const { data: recipeDetail, isLoading: isLoadingRecipe, error: fetchError } =
    useRecipeDetail(recipeId)

  const [formData, setFormData] = useState<RecipeFormData | null>(() =>
    recipeDetail ? fromRecipeDetailToFormData(recipeDetail) : null
  )
  const [initialDataSnapshot, setInitialDataSnapshot] = useState<RecipeFormData | null>(() =>
    recipeDetail ? fromRecipeDetailToFormData(recipeDetail) : null
  )
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [hasCheckedDraft, setHasCheckedDraft] = useState(false)
  const [draftBannerVisible, setDraftBannerVisible] = useState(false)

  const updateMutation = useUpdateRecipe()
  const scrollViewRef = useRef<ScrollView>(null)

  // 1. Initialize form from recipe detail or edit draft
  useEffect(() => {
    let isMounted = true
    async function initData() {
      if (!recipeDetail || hasCheckedDraft) return

      const mapped = fromRecipeDetailToFormData(recipeDetail)
      setInitialDataSnapshot(mapped)

      if (userId && recipeId) {
        try {
          const draft = await loadRecipeDraft(userId, 'edit', recipeId)
          if (draft && draft.formData && isMounted) {
            setFormData(draft.formData)
            setDraftBannerVisible(true)
            setHasCheckedDraft(true)
            return
          }
        } catch (err) {
          console.warn('[EditRecipeScreen] Failed to load edit draft:', err)
        }
      }

      if (isMounted) {
        setFormData(mapped)
        setHasCheckedDraft(true)
      }
    }

    initData()
    return () => {
      isMounted = false
    }
  }, [recipeDetail, userId, recipeId, hasCheckedDraft])

  // 2. Debounced draft autosave while editing
  useEffect(() => {
    if (!userId || !recipeId || !hasCheckedDraft || !formData) return

    const timer = setTimeout(() => {
      saveRecipeDraft(userId, 'edit', formData, recipeId)
    }, 1200)

    return () => clearTimeout(timer)
  }, [formData, userId, recipeId, hasCheckedDraft])

  const handleFieldChange = <K extends keyof RecipeFormData>(
    field: K,
    value: RecipeFormData[K]
  ) => {
    if (!formData) return
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev))
    if (formErrors[field as string]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
    if (serverError) setServerError(null)
  }

  const handleResetToSaved = async () => {
    if (!initialDataSnapshot) return
    await clearRecipeDraft(userId, 'edit', recipeId)
    setFormData(initialDataSnapshot)
    setDraftBannerVisible(false)
    setFormErrors({})
  }

  const hasUnsavedChanges = (): boolean => {
    if (!formData || !initialDataSnapshot) return false
    return JSON.stringify(formData) !== JSON.stringify(initialDataSnapshot)
  }

  const handleDiscardPrompt = () => {
    if (!hasUnsavedChanges()) {
      router.back()
      return
    }

    Alert.alert(
      'Discard Recipe Changes?',
      'You have unsaved edits. Would you like to keep editing, keep this draft for later, or discard your unsaved changes?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Save Draft & Exit',
          onPress: () => router.back(),
        },
        {
          text: 'Discard Changes',
          style: 'destructive',
          onPress: async () => {
            await clearRecipeDraft(userId, 'edit', recipeId)
            router.back()
          },
        },
      ]
    )
  }

  const handleSave = async () => {
    if (!formData) return
    setServerError(null)
    const validation = validateRecipeForm(formData)

    if (!validation.isValid) {
      setFormErrors(validation.errors)
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      return
    }

    try {
      await updateMutation.mutateAsync({
        recipeId,
        formData,
        userId,
      })

      // Go back to updated recipe detail
      router.back()
    } catch (err: any) {
      console.error('[EditRecipeScreen] Update failed:', err)
      setServerError(
        err.message || 'Could not update recipe. Please check your connection and retry.'
      )
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }
  }

  if (isLoadingRecipe || !formData) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
          Loading recipe details...
        </Text>
      </View>
    )
  }

  if (fetchError || !recipeDetail) {
    return (
      <View style={[styles.centerContainer, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <AlertCircle size={40} color={colors.destructive} />
        <Text style={[styles.errorTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
          Recipe Not Found
        </Text>
        <Text style={[styles.errorSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
          We couldn't load the recipe you're trying to edit. It may have been deleted.
        </Text>
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansMedium }]}>
            Return
          </Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardAvoid, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        {/* Navigation Bar */}
        <View style={[styles.topNav, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable
            style={[styles.navBackButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={handleDiscardPrompt}
            accessibilityRole="button"
            accessibilityLabel="Go back or discard recipe changes"
          >
            <ChevronLeft size={22} color={colors.foreground} />
          </Pressable>

          <View style={styles.navTitleBox}>
            <Text
              style={[styles.navTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}
              numberOfLines={1}
            >
              Edit Recipe
            </Text>
            <Text
              style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}
              numberOfLines={1}
            >
              {recipeDetail.title}
            </Text>
          </View>

          <Pressable
            style={[styles.navSaveButton, { backgroundColor: colors.primary }, updateMutation.isPending && styles.navSaveButtonDisabled]}
            disabled={updateMutation.isPending}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save recipe edits"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Save size={18} color={colors.primaryForeground} />
            )}
          </Pressable>
        </View>

        {/* Form Body */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Draft Restored Banner */}
          {draftBannerVisible ? (
            <View
              style={[
                styles.draftBanner,
                {
                  backgroundColor: colors.primary + '14',
                  borderColor: colors.primary + '30',
                  borderRadius: radii.control,
                },
              ]}
            >
              <View style={styles.draftBannerContent}>
                <Sparkles size={16} color={colors.primary} />
                <Text style={[styles.draftBannerText, { color: colors.primary, fontFamily: fontFamilies.sansMedium }]}>
                  Unsaved draft loaded from your previous session
                </Text>
              </View>
              <Pressable
                onPress={handleResetToSaved}
                style={styles.clearDraftButton}
                accessibilityRole="button"
                accessibilityLabel="Reset to saved recipe version"
              >
                <Text style={[styles.clearDraftText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
                  Reset
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Server Error Banner */}
          {serverError ? (
            <View
              style={[
                styles.serverErrorBanner,
                {
                  backgroundColor: colors.destructive + '14',
                  borderColor: colors.destructive + '40',
                  borderRadius: radii.control,
                },
              ]}
            >
              <AlertCircle size={18} color={colors.destructive} />
              <View style={styles.serverErrorTextWrap}>
                <Text style={[styles.serverErrorTitle, { color: colors.destructive, fontFamily: fontFamilies.sansBold }]}>
                  Unable to Save Changes
                </Text>
                <Text style={[styles.serverErrorMessage, { color: colors.destructive, fontFamily: fontFamilies.sansRegular }]}>
                  {serverError}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Validation Summary if errors exist */}
          {Object.keys(formErrors).length > 0 ? (
            <View
              style={[
                styles.validationErrorBanner,
                {
                  backgroundColor: colors.destructive + '10',
                  borderColor: colors.destructive + '30',
                  borderRadius: radii.control,
                },
              ]}
            >
              <AlertCircle size={18} color={colors.destructive} />
              <View style={styles.serverErrorTextWrap}>
                <Text style={[styles.serverErrorTitle, { color: colors.destructive, fontFamily: fontFamilies.sansBold }]}>
                  Please Complete Required Fields
                </Text>
                <Text style={[styles.serverErrorMessage, { color: colors.destructive, fontFamily: fontFamilies.sansRegular }]}>
                  {Object.values(formErrors)[0]}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Section 1: Basic Information */}
          <RecipeBasicInfoSection
            formData={formData}
            onChange={handleFieldChange}
            errors={formErrors}
          />

          {/* Section 2: Recipe Image Photography */}
          <RecipeImageSection
            imageUrl={formData.imageUrl}
            onChange={(url) => handleFieldChange('imageUrl', url)}
          />

          {/* Section 3: Ingredients Dynamic Rows */}
          <RecipeIngredientsSection
            ingredients={formData.ingredients}
            onChange={(ings) => handleFieldChange('ingredients', ings)}
            error={formErrors.ingredients}
          />

          {/* Section 4: Instructions Dynamic Steps */}
          <RecipeInstructionsSection
            instructions={formData.instructions}
            onChange={(insts) => handleFieldChange('instructions', insts)}
            error={formErrors.instructions}
          />

          {/* Section 5: Tags */}
          <RecipeTagsSection
            tags={formData.tags}
            onChange={(newTags) => handleFieldChange('tags', newTags)}
          />
        </ScrollView>

        {/* Sticky Action Footer */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom || 14,
            },
          ]}
        >
          <Pressable
            style={[
              styles.cancelFooterButton,
              { backgroundColor: colors.background, borderColor: colors.border, borderRadius: radii.pill },
            ]}
            onPress={handleDiscardPrompt}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing recipe"
          >
            <Text style={[styles.cancelFooterButtonText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.saveFooterButton,
              { backgroundColor: colors.primary, borderRadius: radii.pill },
              updateMutation.isPending && styles.saveFooterButtonDisabled,
            ]}
            disabled={updateMutation.isPending}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save Recipe Edits"
          >
            {updateMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Save size={16} color={colors.primaryForeground} />
                <Text style={[styles.saveFooterButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansBold }]}>
                  Save Changes
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
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
    fontSize: 20,
    fontWeight: '700',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  backButtonText: {
    fontSize: 14,
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
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  navSubtitle: {
    fontSize: 11,
    marginTop: 1,
    maxWidth: 200,
  },
  navSaveButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navSaveButtonDisabled: {
    opacity: 0.6,
  },
  scrollContent: {
    padding: 16,
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderWidth: 1,
  },
  draftBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  draftBannerText: {
    fontSize: 13,
  },
  clearDraftButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  clearDraftText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  serverErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  validationErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  serverErrorTextWrap: {
    flex: 1,
  },
  serverErrorTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  serverErrorMessage: {
    fontSize: 12,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 6,
  },
  cancelFooterButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    minHeight: 46,
  },
  cancelFooterButtonText: {
    fontSize: 14,
  },
  saveFooterButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
  },
  saveFooterButtonDisabled: {
    opacity: 0.6,
  },
  saveFooterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
