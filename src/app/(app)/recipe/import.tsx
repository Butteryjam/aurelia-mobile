/**
 * Aurelia Mobile — AI Recipe Import Screen
 *
 * Production-quality import from text or image.
 * Calls POST /api/ai/extract-text or POST /api/ai/extract-image.
 * Shows editable preview before saving via POST /api/recipes.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  BackHandler,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  X,
  FileText,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme } from '@/theme'
import { useAuth } from '@/features/auth/auth-context'
import { useExtractRecipeFromText, useExtractRecipeFromImage } from '@/features/ai/hooks'
import { useCreateRecipe } from '@/features/recipes/recipe-mutations'
import { extractionToFormData } from '@/features/ai/extraction-converter'
import { validateRecipeForm, type RecipeFormData } from '@/features/recipes/recipe-form-schema'
import { classifyAiError, type ExtractionStage } from '@/features/ai/types'
import { pickImageFromLibrary, takePhotoWithCamera } from '@/features/recipes/image-upload'
import { AureliaImage } from '@/components/common/aurelia-image'

// Editable preview sections
import { RecipeBasicInfoSection } from '@/components/recipe-editor/recipe-basic-info-section'
import { RecipeIngredientsSection } from '@/components/recipe-editor/recipe-ingredients-section'
import { RecipeInstructionsSection } from '@/components/recipe-editor/recipe-instructions-section'
import { RecipeTagsSection } from '@/components/recipe-editor/recipe-tags-section'

type ImportMode = 'select' | 'text' | 'image'

export default function ImportRecipeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  // State
  const [mode, setMode] = useState<ImportMode>('select')
  const [textInput, setTextInput] = useState('')
  const [selectedImage, setSelectedImage] = useState<{
    uri: string
    base64: string
    mimeType: string
  } | null>(null)
  const [stage, setStage] = useState<ExtractionStage>('idle')
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [formData, setFormData] = useState<RecipeFormData | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saveSubmitted, setSaveSubmitted] = useState(false)

  // Hooks
  const textExtraction = useExtractRecipeFromText()
  const imageExtraction = useExtractRecipeFromImage()
  const createRecipe = useCreateRecipe()

  // Abort on unmount
  useEffect(() => {
    return () => {
      textExtraction.cancel()
      imageExtraction.cancel()
    }
  }, [])

  // ─── Text Extraction ─────────────────────────────────────

  const handleTextExtract = useCallback(async () => {
    if (textInput.trim().length < 15) {
      setExtractionError('Please enter at least 15 characters of recipe text.')
      return
    }

    setExtractionError(null)
    setStage('preparing')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

    // Simulate real stages
    setTimeout(() => setStage('extracting'), 400)
    setTimeout(() => setStage('structuring'), 1200)

    try {
      const result = await textExtraction.mutateAsync(textInput.trim())
      const form = extractionToFormData(result)
      setFormData(form)
      setStage('ready')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (err: any) {
      const errorInfo = classifyAiError(
        err.status || null,
        err.message,
        err.rateLimited,
        err.retryAfterSeconds
      )
      setExtractionError(errorInfo.message)
      setStage('error')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
    }
  }, [textInput, textExtraction])

  // ─── Image Selection ─────────────────────────────────────

  const handlePickImage = useCallback(async (fromCamera: boolean) => {
    try {
      const result = fromCamera
        ? await takePhotoWithCamera()
        : await pickImageFromLibrary()

      if (!result) return

      // Convert to base64 for the API
      const response = await fetch(result.uri)
      const blob = await response.blob()
      const reader = new FileReader()

      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      const base64 = await base64Promise

      setSelectedImage({
        uri: result.uri,
        base64,
        mimeType: result.mimeType,
      })
      setExtractionError(null)
    } catch (err: any) {
      setExtractionError(err.message || 'Failed to select image.')
    }
  }, [])

  const handleImageExtract = useCallback(async () => {
    if (!selectedImage) return

    setExtractionError(null)
    setStage('preparing')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})

    setTimeout(() => setStage('extracting'), 400)
    setTimeout(() => setStage('structuring'), 1500)

    try {
      const result = await imageExtraction.mutateAsync({
        base64Data: selectedImage.base64,
        mimeType: selectedImage.mimeType,
      })
      const form = extractionToFormData(result)
      setFormData(form)
      setStage('ready')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    } catch (err: any) {
      const errorInfo = classifyAiError(
        err.status || null,
        err.message,
        err.rateLimited,
        err.retryAfterSeconds
      )
      setExtractionError(errorInfo.message)
      setStage('error')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
    }
  }, [selectedImage, imageExtraction])

  // ─── Save ────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!formData || !user || saveSubmitted) return

    const validation = validateRecipeForm(formData)
    setValidationErrors(validation.errors)

    if (!validation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
      return
    }

    setSaveSubmitted(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})

    try {
      const result = await createRecipe.mutateAsync({
        formData,
        userId: user.id,
      })
      router.replace(`/(app)/recipe/${result.id}`)
    } catch (err: any) {
      setSaveSubmitted(false)
      Alert.alert('Save Failed', err.message || 'Could not save recipe. Please try again.')
    }
  }, [formData, user, saveSubmitted, createRecipe, router])

  const handleBack = useCallback(() => {
    if (stage === 'ready' || formData) {
      Alert.alert(
        'Discard Import?',
        'You have extracted recipe data that has not been saved. Discard this import?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setFormData(null)
              setStage('idle')
              setMode('select')
            },
          },
        ]
      )
      return
    }
    if (mode !== 'select') {
      setMode('select')
      setExtractionError(null)
      return
    }
    router.back()
  }, [mode, stage, formData, router])

  useEffect(() => {
    const onBackPress = () => {
      if (mode !== 'select' || stage === 'ready' || formData) {
        handleBack()
        return true
      }
      return false
    }

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress)
    return () => sub.remove()
  }, [mode, stage, formData, handleBack])

  // ─── Stage Progress ──────────────────────────────────────

  const stageLabels: Record<ExtractionStage, string> = {
    idle: '',
    preparing: 'Preparing…',
    extracting: 'Extracting recipe…',
    structuring: 'Structuring data…',
    ready: 'Ready for review',
    error: 'Extraction failed',
  }

  const isProcessing = stage === 'preparing' || stage === 'extracting' || stage === 'structuring'

  // ─── Render ──────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border + '60' }]}>
          <Pressable
            onPress={handleBack}
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
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 19 }]}>
              Import Recipe
            </Text>
          </View>

          <View style={styles.navButton} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 80 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Stage 1: Mode Selection */}
          {stage === 'idle' && mode === 'select' && (
            <View style={styles.modeSection}>
              <View style={styles.heroTextContainer}>
                <Text style={[typography.eyebrow, { color: colors.primary, marginBottom: spacing.xs }]}>
                  AI Extraction
                </Text>
                <Text style={[typography.pageTitle, { color: colors.foreground }]}>
                  Import a Recipe
                </Text>
                <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.sm, lineHeight: 22 }]}>
                  Paste recipe text or photograph a recipe card, and Aurelia's AI will extract and structure it for your vault.
                </Text>
              </View>

              {/* Text Option */}
              <Pressable
                onPress={() => setMode('text')}
                style={({ pressed }) => [
                  styles.modeCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.card,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Import from text"
              >
                <View style={[styles.modeIconBadge, { backgroundColor: colors.secondary, borderRadius: radii.small }]}>
                  <FileText size={22} color={colors.primary} />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={[typography.cardTitle, { color: colors.foreground }]}>
                    Paste Recipe Text
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                    Copy from any source and paste here
                  </Text>
                </View>
              </Pressable>

              {/* Image Option */}
              <Pressable
                onPress={() => setMode('image')}
                style={({ pressed }) => [
                  styles.modeCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.card,
                    opacity: pressed ? 0.9 : 1,
                    marginTop: spacing.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Import from image"
              >
                <View style={[styles.modeIconBadge, { backgroundColor: colors.secondary, borderRadius: radii.small }]}>
                  <Camera size={22} color={colors.primary} />
                </View>
                <View style={styles.modeTextContainer}>
                  <Text style={[typography.cardTitle, { color: colors.foreground }]}>
                    Upload Image / Photo
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                    Photograph a recipe card or cookbook page
                  </Text>
                </View>
              </Pressable>
            </View>
          )}

          {/* Stage 2A: Text Input */}
          {stage === 'idle' && mode === 'text' && (
            <View style={styles.inputSection}>
              <Pressable
                onPress={() => setMode('select')}
                style={styles.backLink}
                accessibilityRole="button"
              >
                <ArrowLeft size={16} color={colors.primary} />
                <Text style={[typography.bodyMedium, { color: colors.primary, marginLeft: 4 }]}>
                  Back
                </Text>
              </Pressable>

              <Text style={[typography.sectionTitle, { color: colors.foreground, marginTop: spacing.md }]}>
                Paste Recipe Text
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
                Paste the full recipe including ingredients and instructions. At least 15 characters.
              </Text>

              <View
                style={[
                  styles.textInputContainer,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderRadius: radii.control,
                    marginTop: spacing.md,
                  },
                ]}
              >
                <TextInput
                  style={[
                    typography.body,
                    styles.textInput,
                    { color: colors.foreground },
                  ]}
                  placeholder="Paste your recipe text here…"
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  textAlignVertical="top"
                  value={textInput}
                  onChangeText={setTextInput}
                  accessibilityLabel="Recipe text input"
                />

                {textInput.length > 0 && (
                  <Pressable
                    onPress={() => setTextInput('')}
                    style={[styles.clearButton, { backgroundColor: colors.muted, borderRadius: radii.pill }]}
                    accessibilityRole="button"
                    accessibilityLabel="Clear text"
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={14} color={colors.mutedForeground} />
                  </Pressable>
                )}
              </View>

              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs, textAlign: 'right' }]}>
                {textInput.length} characters
              </Text>

              {extractionError && (
                <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '40', borderRadius: radii.control }]}>
                  <AlertCircle size={16} color={colors.destructive} />
                  <Text style={[typography.body, { color: colors.destructive, marginLeft: 8, flex: 1 }]}>
                    {extractionError}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleTextExtract}
                disabled={textInput.trim().length < 15}
                style={({ pressed }) => [
                  styles.extractButton,
                  {
                    backgroundColor: textInput.trim().length >= 15 ? colors.primary : colors.muted,
                    borderRadius: radii.control,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Extract recipe from text"
              >
                <Sparkles size={18} color={textInput.trim().length >= 15 ? colors.primaryForeground : colors.mutedForeground} />
                <Text
                  style={[
                    typography.bodyMedium,
                    {
                      color: textInput.trim().length >= 15 ? colors.primaryForeground : colors.mutedForeground,
                      fontWeight: '700',
                      marginLeft: 8,
                    },
                  ]}
                >
                  Extract Recipe
                </Text>
              </Pressable>
            </View>
          )}

          {/* Stage 2B: Image Input */}
          {stage === 'idle' && mode === 'image' && (
            <View style={styles.inputSection}>
              <Pressable
                onPress={() => { setMode('select'); setSelectedImage(null) }}
                style={styles.backLink}
                accessibilityRole="button"
              >
                <ArrowLeft size={16} color={colors.primary} />
                <Text style={[typography.bodyMedium, { color: colors.primary, marginLeft: 4 }]}>
                  Back
                </Text>
              </Pressable>

              <Text style={[typography.sectionTitle, { color: colors.foreground, marginTop: spacing.md }]}>
                Upload Recipe Image
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
                Photograph a recipe card, cookbook page, or handwritten recipe.
              </Text>

              {!selectedImage ? (
                <View style={[styles.imagePickerActions, { marginTop: spacing.lg }]}>
                  <Pressable
                    onPress={() => handlePickImage(false)}
                    style={({ pressed }) => [
                      styles.imagePickerButton,
                      shadows.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: radii.card,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Choose from photo library"
                  >
                    <ImageIcon size={28} color={colors.primary} />
                    <Text style={[typography.bodyMedium, { color: colors.foreground, marginTop: spacing.sm }]}>
                      Photo Library
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handlePickImage(true)}
                    style={({ pressed }) => [
                      styles.imagePickerButton,
                      shadows.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        borderRadius: radii.card,
                        opacity: pressed ? 0.9 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Take a photo"
                  >
                    <Camera size={28} color={colors.primary} />
                    <Text style={[typography.bodyMedium, { color: colors.foreground, marginTop: spacing.sm }]}>
                      Camera
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ marginTop: spacing.md }}>
                  <View style={[styles.imagePreview, { borderRadius: radii.card, borderColor: colors.border }]}>
                    <AureliaImage
                      source={selectedImage.uri}
                      style={styles.previewImage}
                      aspectRatio={4 / 3}
                      accessibilityLabel="Selected recipe image"
                    />
                  </View>

                  <View style={styles.imageActions}>
                    <Pressable
                      onPress={() => setSelectedImage(null)}
                      style={({ pressed }) => [
                        styles.imageActionButton,
                        { borderColor: colors.border, borderRadius: radii.control, opacity: pressed ? 0.7 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Remove image"
                    >
                      <X size={16} color={colors.destructive} />
                      <Text style={[typography.bodyMedium, { color: colors.destructive, marginLeft: 4 }]}>
                        Remove
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handlePickImage(false)}
                      style={({ pressed }) => [
                        styles.imageActionButton,
                        { borderColor: colors.border, borderRadius: radii.control, opacity: pressed ? 0.7 : 1 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Replace image"
                    >
                      <RefreshCw size={16} color={colors.primary} />
                      <Text style={[typography.bodyMedium, { color: colors.primary, marginLeft: 4 }]}>
                        Replace
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {extractionError && (
                <View style={[styles.errorBanner, { backgroundColor: colors.destructive + '14', borderColor: colors.destructive + '40', borderRadius: radii.control }]}>
                  <AlertCircle size={16} color={colors.destructive} />
                  <Text style={[typography.body, { color: colors.destructive, marginLeft: 8, flex: 1 }]}>
                    {extractionError}
                  </Text>
                </View>
              )}

              {selectedImage && (
                <Pressable
                  onPress={handleImageExtract}
                  style={({ pressed }) => [
                    styles.extractButton,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radii.control,
                      opacity: pressed ? 0.88 : 1,
                      marginTop: spacing.md,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Extract recipe from image"
                >
                  <Sparkles size={18} color={colors.primaryForeground} />
                  <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700', marginLeft: 8 }]}>
                    Extract Recipe
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Stage 3: Processing */}
          {isProcessing && (
            <View style={styles.processingSection}>
              <View style={[styles.processingCard, shadows.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.card }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[typography.cardTitle, { color: colors.foreground, marginTop: spacing.base }]}>
                  {stageLabels[stage]}
                </Text>
                <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs, textAlign: 'center' }]}>
                  AI is analyzing your recipe. This may take a moment.
                </Text>

                {/* Stage indicators */}
                <View style={[styles.stageRow, { marginTop: spacing.lg }]}>
                  {(['preparing', 'extracting', 'structuring'] as ExtractionStage[]).map((s) => {
                    const isActive = s === stage
                    const isDone =
                      (s === 'preparing' && (stage === 'extracting' || stage === 'structuring')) ||
                      (s === 'extracting' && stage === 'structuring')

                    return (
                      <View key={s} style={styles.stageItem}>
                        <View
                          style={[
                            styles.stageDot,
                            {
                              backgroundColor: isDone
                                ? colors.success
                                : isActive
                                ? colors.primary
                                : colors.muted,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            typography.caption,
                            {
                              color: isActive ? colors.primary : isDone ? colors.success : colors.mutedForeground,
                              marginTop: 4,
                              fontSize: 11,
                            },
                          ]}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Text>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )}

          {/* Stage 4: Error State */}
          {stage === 'error' && (
            <View style={styles.inputSection}>
              <View style={[styles.errorCard, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30', borderRadius: radii.card }]}>
                <AlertCircle size={24} color={colors.destructive} />
                <Text style={[typography.cardTitle, { color: colors.destructive, marginTop: spacing.sm }]}>
                  Extraction Failed
                </Text>
                <Text style={[typography.body, { color: colors.foreground, marginTop: spacing.xs, textAlign: 'center', lineHeight: 22 }]}>
                  {extractionError || 'Something went wrong during extraction.'}
                </Text>
                <Pressable
                  onPress={() => {
                    setStage('idle')
                    setExtractionError(null)
                  }}
                  style={({ pressed }) => [
                    styles.retryButton,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: radii.control,
                      opacity: pressed ? 0.88 : 1,
                      marginTop: spacing.base,
                    },
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
            </View>
          )}

          {/* Stage 5: Editable Preview */}
          {stage === 'ready' && formData && (
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <View style={[styles.successBadge, { backgroundColor: colors.success + '18', borderRadius: radii.small }]}>
                  <Check size={14} color={colors.success} />
                  <Text style={[typography.caption, { color: colors.success, fontWeight: '700', marginLeft: 4 }]}>
                    Recipe Extracted
                  </Text>
                </View>
                <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
                  Review and edit before saving to your vault.
                </Text>
              </View>

              {/* Validation errors */}
              {Object.keys(validationErrors).length > 0 && (
                <View style={[styles.validationBanner, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30', borderRadius: radii.control }]}>
                  <Text style={[typography.bodyMedium, { color: colors.destructive, fontWeight: '700' }]}>
                    Please fix the following:
                  </Text>
                  {Object.values(validationErrors).map((err, i) => (
                    <Text key={i} style={[typography.caption, { color: colors.destructive, marginTop: 2 }]}>
                      • {err}
                    </Text>
                  ))}
                </View>
              )}

              <RecipeBasicInfoSection
                formData={formData}
                onChange={(field, value) => {
                  setFormData((prev) => prev ? { ...prev, [field]: value } : prev)
                }}
                errors={validationErrors}
              />
              <RecipeIngredientsSection
                ingredients={formData.ingredients}
                onChange={(ings) => {
                  setFormData((prev) => prev ? { ...prev, ingredients: ings } : prev)
                }}
                error={validationErrors.ingredients}
              />
              <RecipeInstructionsSection
                instructions={formData.instructions}
                onChange={(insts) => {
                  setFormData((prev) => prev ? { ...prev, instructions: insts } : prev)
                }}
                error={validationErrors.instructions}
              />
              <RecipeTagsSection
                tags={formData.tags}
                onChange={(tags) => {
                  setFormData((prev) => prev ? { ...prev, tags } : prev)
                }}
              />
            </View>
          )}
        </ScrollView>

        {/* Sticky Save Bar */}
        {stage === 'ready' && formData && (
          <View
            style={[
              styles.saveBar,
              {
                backgroundColor: colors.card,
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setStage('idle')
                setFormData(null)
                setExtractionError(null)
                setValidationErrors({})
              }}
              style={({ pressed }) => [
                styles.discardButton,
                {
                  borderColor: colors.border,
                  borderRadius: radii.control,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Discard extraction"
            >
              <Text style={[typography.bodyMedium, { color: colors.mutedForeground }]}>
                Discard
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSave}
              disabled={createRecipe.isPending || saveSubmitted}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: createRecipe.isPending || saveSubmitted ? colors.muted : colors.primary,
                  borderRadius: radii.control,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Save imported recipe"
            >
              {createRecipe.isPending ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <>
                  <Check size={18} color={createRecipe.isPending || saveSubmitted ? colors.mutedForeground : colors.primaryForeground} />
                  <Text
                    style={[
                      typography.bodyMedium,
                      {
                        color: createRecipe.isPending || saveSubmitted ? colors.mutedForeground : colors.primaryForeground,
                        fontWeight: '700',
                        marginLeft: 6,
                      },
                    ]}
                  >
                    Save to Vault
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  navButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20 },
  modeSection: {},
  heroTextContainer: { marginBottom: 24 },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 16,
    minHeight: 72,
  },
  modeIconBadge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  modeTextContainer: { flex: 1 },
  inputSection: {},
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  textInputContainer: {
    borderWidth: 1,
    position: 'relative',
  },
  textInput: {
    minHeight: 200,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  clearButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  extractButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 16,
  },
  imagePickerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePickerButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    borderWidth: 1,
  },
  imagePreview: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  previewImage: { width: '100%' },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
  },
  processingSection: {
    paddingTop: 40,
    alignItems: 'center',
  },
  processingCard: {
    width: '100%',
    alignItems: 'center',
    padding: 32,
    borderWidth: 1,
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  stageItem: { alignItems: 'center' },
  stageDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  errorCard: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    marginTop: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 24,
  },
  previewSection: { marginTop: 4 },
  previewHeader: { marginBottom: 16 },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  validationBanner: {
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  saveBar: {
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
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
})
