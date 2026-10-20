/**
 * Aurelia Mobile — AI Recipe Modification Modal
 *
 * Non-destructive recipe modification: the original is never overwritten.
 * Opens as a bottom sheet from Recipe Detail.
 * Uses POST /api/ai/modify-recipe.
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  X,
  Sparkles,
  Leaf,
  Flame,
  Zap,
  Heart,
  Clock,
  RefreshCw,
  Check,
  AlertCircle,
  ArrowRight,
  ChevronDown,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useModifyRecipe } from '@/features/ai/hooks'
import { useCreateRecipe } from '@/features/recipes/recipe-mutations'
import { extractionToFormData } from '@/features/ai/extraction-converter'
import { classifyAiError, type RecipeModificationAction, type ModifiedRecipeResult } from '@/features/ai/types'
import { useAuth } from '@/features/auth/auth-context'
import { MarkdownText } from '@/components/ai/markdown-text'

interface ModificationModalProps {
  visible: boolean
  onClose: () => void
  recipeId: string
  recipeTitle: string
}

interface PresetSuggestion {
  action: RecipeModificationAction
  label: string
  icon: React.ComponentType<{ size: number; color: string }>
  description: string
}

const PRESETS: PresetSuggestion[] = [
  { action: 'healthier', label: 'Healthier', icon: Heart, description: 'Lower fat, sodium, sugar' },
  { action: 'protein', label: 'More Protein', icon: Flame, description: 'Boost protein content' },
  { action: 'vegetarian', label: 'Vegetarian', icon: Leaf, description: 'Remove meat ingredients' },
  { action: 'vegan', label: 'Vegan', icon: Leaf, description: 'Fully plant-based' },
  { action: 'faster', label: 'Faster', icon: Clock, description: 'Reduce cooking time' },
  { action: 'spicier', label: 'Spicier', icon: Flame, description: 'Add more heat' },
  { action: 'milder', label: 'Milder', icon: Zap, description: 'Reduce spiciness' },
]

type ModalStage = 'select' | 'loading' | 'preview' | 'error'

export function RecipeModificationModal({
  visible,
  onClose,
  recipeId,
  recipeTitle,
}: ModificationModalProps) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { user } = useAuth()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const [stage, setStage] = useState<ModalStage>('select')
  const [customInstruction, setCustomInstruction] = useState('')
  const [selectedAction, setSelectedAction] = useState<RecipeModificationAction | null>(null)
  const [result, setResult] = useState<ModifiedRecipeResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const modifyMutation = useModifyRecipe()
  const createRecipe = useCreateRecipe()

  // Reset when closed
  useEffect(() => {
    if (!visible) {
      setStage('select')
      setCustomInstruction('')
      setSelectedAction(null)
      setResult(null)
      setErrorMessage(null)
      setSaving(false)
    }
  }, [visible])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      modifyMutation.cancel()
    }
  }, [])

  const handleModify = useCallback(
    async (action: RecipeModificationAction, instruction?: string) => {
      setSelectedAction(action)
      setErrorMessage(null)
      setStage('loading')
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

      try {
        const modResult = await modifyMutation.mutateAsync({
          recipeId,
          action,
          customInstruction: instruction || undefined,
        })
        setResult(modResult)
        setStage('preview')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      } catch (err: any) {
        const errorInfo = classifyAiError(
          err.status || null,
          err.message,
          err.rateLimited,
          err.retryAfterSeconds
        )
        setErrorMessage(errorInfo.message)
        setStage('error')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
      }
    },
    [recipeId, modifyMutation]
  )

  const handleSaveAsNew = useCallback(async () => {
    if (!result || !user || saving) return
    setSaving(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    try {
      const formData = extractionToFormData(result.recipe)
      // Prefix title to indicate it's a modification
      formData.title = formData.title || `${recipeTitle} (Modified)`
      const saved = await createRecipe.mutateAsync({ formData, userId: user.id })
      onClose()
      router.push(`/(app)/recipe/${saved.id}`)
    } catch (err: any) {
      setSaving(false)
      setErrorMessage(err.message || 'Failed to save recipe.')
    }
  }, [result, user, saving, createRecipe, recipeTitle, onClose, router])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalContainer, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Handle / Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border + '60' }]}>
          <View style={[styles.handle, { backgroundColor: colors.muted }]} />
          <View style={styles.headerRow}>
            <View style={styles.headerTextContainer}>
              <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 19 }]}>
                AI Modification
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground }]} numberOfLines={1}>
                {recipeTitle}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: colors.muted, borderRadius: radii.pill, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Close modification"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Selection Stage */}
          {stage === 'select' && (
            <>
              <Text style={[typography.eyebrow, { color: colors.primary, marginBottom: spacing.sm }]}>
                Suggestions
              </Text>

              <View style={styles.presetsGrid}>
                {PRESETS.map((preset) => {
                  const Icon = preset.icon
                  return (
                    <Pressable
                      key={preset.action}
                      onPress={() => handleModify(preset.action)}
                      style={({ pressed }) => [
                        styles.presetChip,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          borderRadius: radii.control,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Modify recipe: ${preset.label}`}
                    >
                      <Icon size={16} color={colors.primary} />
                      <Text style={[typography.bodyMedium, { color: colors.foreground, marginLeft: 6 }]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Text style={[typography.eyebrow, { color: colors.primary, marginTop: spacing.xl, marginBottom: spacing.sm }]}>
                Custom Request
              </Text>

              <View
                style={[
                  styles.customInputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.control },
                ]}
              >
                <TextInput
                  style={[typography.body, styles.customInput, { color: colors.foreground }]}
                  placeholder="e.g., Make it gluten-free and add avocado"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  value={customInstruction}
                  onChangeText={setCustomInstruction}
                  accessibilityLabel="Custom modification instruction"
                />
              </View>

              {customInstruction.trim().length > 0 && (
                <Pressable
                  onPress={() => handleModify('custom', customInstruction.trim())}
                  style={({ pressed }) => [
                    styles.customSubmitButton,
                    { backgroundColor: colors.primary, borderRadius: radii.control, opacity: pressed ? 0.88 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Apply custom modification"
                >
                  <Sparkles size={16} color={colors.primaryForeground} />
                  <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700', marginLeft: 8 }]}>
                    Apply Modification
                  </Text>
                </Pressable>
              )}
            </>
          )}

          {/* Loading Stage */}
          {stage === 'loading' && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[typography.cardTitle, { color: colors.foreground, marginTop: spacing.base }]}>
                Modifying Recipe…
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs, textAlign: 'center' }]}>
                AI is generating a{' '}
                {selectedAction === 'custom' ? 'custom modification' : selectedAction}{' '}
                version of your recipe.
              </Text>
            </View>
          )}

          {/* Error Stage */}
          {stage === 'error' && (
            <View style={styles.errorContainer}>
              <AlertCircle size={28} color={colors.destructive} />
              <Text style={[typography.cardTitle, { color: colors.destructive, marginTop: spacing.sm }]}>
                Modification Failed
              </Text>
              <Text style={[typography.body, { color: colors.foreground, marginTop: spacing.xs, textAlign: 'center', lineHeight: 22 }]}>
                {errorMessage}
              </Text>
              <Pressable
                onPress={() => setStage('select')}
                style={({ pressed }) => [
                  styles.retryButton,
                  { backgroundColor: colors.primary, borderRadius: radii.control, opacity: pressed ? 0.88 : 1, marginTop: spacing.lg },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Try again"
              >
                <RefreshCw size={16} color={colors.primaryForeground} />
                <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700', marginLeft: 8 }]}>
                  Try Again
                </Text>
              </Pressable>
            </View>
          )}

          {/* Preview Stage */}
          {stage === 'preview' && result && (
            <>
              {/* Summary of Changes */}
              <View style={[styles.changesSummary, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30', borderRadius: radii.card }]}>
                <Sparkles size={16} color={colors.primary} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={[typography.bodyMedium, { color: colors.primary, fontWeight: '700' }]}>
                    Changes Applied
                  </Text>
                  <Text style={[typography.body, { color: colors.foreground, marginTop: 4, lineHeight: 21 }]}>
                    {result.summaryOfChanges}
                  </Text>
                </View>
              </View>

              {/* Culinary Notes */}
              {result.culinaryNotes && (
                <View style={[styles.culinaryNotes, { backgroundColor: colors.secondary + '60', borderColor: colors.border, borderRadius: radii.card }]}>
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
                    Culinary Notes
                  </Text>
                  <MarkdownText content={result.culinaryNotes} />
                </View>
              )}

              {/* Modified Recipe Preview */}
              <Text style={[typography.sectionTitle, { color: colors.foreground, marginTop: spacing.lg }]}>
                {result.recipe.title || recipeTitle}
              </Text>

              {result.recipe.description && (
                <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.xs, lineHeight: 22 }]}>
                  {result.recipe.description}
                </Text>
              )}

              {/* Ingredients */}
              {result.recipe.ingredients.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginBottom: spacing.sm }]}>
                    Ingredients
                  </Text>
                  {result.recipe.ingredients.map((ing, i) => (
                    <Text key={i} style={[typography.body, { color: colors.foreground, marginBottom: 4 }]}>
                      • {ing.quantity ? `${ing.quantity} ` : ''}{ing.unit ? `${ing.unit} ` : ''}{ing.name}
                      {ing.preparationNote ? `, ${ing.preparationNote}` : ''}
                      {ing.isOptional ? ' (optional)' : ''}
                    </Text>
                  ))}
                </View>
              )}

              {/* Instructions */}
              {result.recipe.instructions.length > 0 && (
                <View style={{ marginTop: spacing.lg }}>
                  <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '700', marginBottom: spacing.sm }]}>
                    Instructions
                  </Text>
                  {result.recipe.instructions.map((inst, i) => (
                    <Text key={i} style={[typography.body, { color: colors.foreground, marginBottom: 8, lineHeight: 22 }]}>
                      {inst.stepNumber}. {inst.instruction}
                    </Text>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Preview Action Bar */}
        {stage === 'preview' && result && (
          <View
            style={[
              styles.actionBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.discardButton,
                { borderColor: colors.border, borderRadius: radii.control, opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Discard modification"
            >
              <Text style={[typography.bodyMedium, { color: colors.mutedForeground }]}>
                Discard
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSaveAsNew}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveAsNewButton,
                {
                  backgroundColor: saving ? colors.muted : colors.primary,
                  borderRadius: radii.control,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save as new recipe"
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Check size={18} color={colors.primaryForeground} />
                  <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700', marginLeft: 6 }]}>
                    Save as New Recipe
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalHeader: {
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextContainer: { flex: 1 },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
  },
  customInputContainer: {
    borderWidth: 1,
  },
  customInput: {
    minHeight: 80,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  customSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  errorContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
  },
  changesSummary: {
    flexDirection: 'row',
    padding: 14,
    borderWidth: 1,
  },
  culinaryNotes: {
    padding: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 10,
  },
  discardButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
  },
  saveAsNewButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
})
