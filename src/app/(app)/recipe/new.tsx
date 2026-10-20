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
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Save, AlertCircle, Sparkles } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useAuth } from '@/features/auth/auth-context'
import {
  initialRecipeFormData,
  validateRecipeForm,
  hasMeaningfulContent,
  type RecipeFormData,
} from '@/features/recipes/recipe-form-schema'
import {
  saveRecipeDraft,
  loadRecipeDraft,
  clearRecipeDraft,
} from '@/features/recipes/draft-storage'
import { useCreateRecipe } from '@/features/recipes/recipe-mutations'
import { RecipeBasicInfoSection } from '@/components/recipe-editor/recipe-basic-info-section'
import { RecipeImageSection } from '@/components/recipe-editor/recipe-image-section'
import { RecipeIngredientsSection } from '@/components/recipe-editor/recipe-ingredients-section'
import { RecipeInstructionsSection } from '@/components/recipe-editor/recipe-instructions-section'
import { RecipeTagsSection } from '@/components/recipe-editor/recipe-tags-section'

export default function NewRecipeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, typography, spacing, radii, fontFamilies } = useAureliaTheme()
  const { user } = useAuth()
  const userId = user?.id || ''

  const [formData, setFormData] = useState<RecipeFormData>(initialRecipeFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false)
  const [draftBannerVisible, setDraftBannerVisible] = useState(false)

  const createMutation = useCreateRecipe()
  const scrollViewRef = useRef<ScrollView>(null)

  // 1. Restore draft on initial mount
  useEffect(() => {
    let isMounted = true
    async function checkDraft() {
      if (!userId) return
      try {
        const draft = await loadRecipeDraft(userId, 'new')
        if (draft && draft.formData && isMounted) {
          if (hasMeaningfulContent(draft.formData)) {
            setFormData(draft.formData)
            setDraftBannerVisible(true)
          }
        }
      } catch (err) {
        console.warn('[NewRecipeScreen] Failed to load draft:', err)
      } finally {
        if (isMounted) setHasRestoredDraft(true)
      }
    }
    checkDraft()
    return () => {
      isMounted = false
    }
  }, [userId])

  // 2. Debounced draft autosave while editing
  useEffect(() => {
    if (!userId || !hasRestoredDraft) return

    const timer = setTimeout(() => {
      if (hasMeaningfulContent(formData)) {
        saveRecipeDraft(userId, 'new', formData)
      }
    }, 1200)

    return () => clearTimeout(timer)
  }, [formData, userId, hasRestoredDraft])

  const handleFieldChange = <K extends keyof RecipeFormData>(
    field: K,
    value: RecipeFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field as string]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field as string]
        return next
      })
    }
  }

  const handleClearDraft = async () => {
    if (!userId) return
    await clearRecipeDraft(userId, 'new')
    setDraftBannerVisible(false)
    setFormData(initialRecipeFormData)
  }

  const handleDiscardPrompt = () => {
    if (!hasMeaningfulContent(formData)) {
      router.back()
      return
    }

    Alert.alert(
      'Discard Recipe?',
      'You have unsaved changes. Your draft will be saved automatically.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard & Exit',
          style: 'destructive',
          onPress: async () => {
            if (userId) {
              await clearRecipeDraft(userId, 'new')
            }
            router.back()
          },
        },
      ]
    )
  }

  const handleSave = async () => {
    setServerError(null)
    const validation = validateRecipeForm(formData)
    setFormErrors(validation.errors)

    if (!validation.isValid) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
      return
    }

    try {
      const created = await createMutation.mutateAsync({ formData, userId })
      if (userId) {
        await clearRecipeDraft(userId, 'new')
      }
      if (created?.id) {
        router.replace(`/(app)/recipe/${created.id}`)
      } else {
        router.replace('/(app)/(tabs)/recipes')
      }
    } catch (err: any) {
      console.error('[NewRecipeScreen] Save failed:', err)
      setServerError(err.message || 'Could not save recipe. Please check your connection and retry.')
      scrollViewRef.current?.scrollTo({ y: 0, animated: true })
    }
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
            accessibilityLabel="Go back or discard recipe"
          >
            <ChevronLeft size={22} color={colors.foreground} />
          </Pressable>

          <View style={styles.navTitleBox}>
            <Text style={[styles.navTitle, { color: colors.foreground, fontFamily: fontFamilies.serifSemiBold }]}>
              New Recipe
            </Text>
            <Text style={[styles.navSubtitle, { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular }]}>
              Craft an original dish
            </Text>
          </View>

          <Pressable
            style={[styles.navSaveButton, { backgroundColor: colors.primary }, createMutation.isPending && styles.navSaveButtonDisabled]}
            disabled={createMutation.isPending}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save recipe"
          >
            {createMutation.isPending ? (
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
                  Draft restored from your last session
                </Text>
              </View>
              <Pressable
                onPress={handleClearDraft}
                style={styles.clearDraftButton}
                accessibilityRole="button"
                accessibilityLabel="Clear restored draft"
              >
                <Text style={[styles.clearDraftText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
                  Clear
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
                  Unable to Save Recipe
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
            accessibilityLabel="Cancel recipe creation"
          >
            <Text style={[styles.cancelFooterButtonText, { color: colors.mutedForeground, fontFamily: fontFamilies.sansMedium }]}>
              Discard
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.saveFooterButton,
              { backgroundColor: colors.primary, borderRadius: radii.pill },
              createMutation.isPending && styles.saveFooterButtonDisabled,
            ]}
            disabled={createMutation.isPending}
            onPress={handleSave}
            accessibilityRole="button"
            accessibilityLabel="Save Recipe to Aurelia"
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <Save size={16} color={colors.primaryForeground} />
                <Text style={[styles.saveFooterButtonText, { color: colors.primaryForeground, fontFamily: fontFamilies.sansBold }]}>
                  Save Recipe
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
