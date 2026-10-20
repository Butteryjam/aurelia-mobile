/**
 * Aurelia Mobile — Immersive Full-Screen Cook Mode
 *
 * Route: /(app)/cook/[id]
 *
 * Immersive, distraction-free cooking experience featuring:
 * - Kitchen standing-distance typography (24pt+)
 * - Wake-lock screen management via expo-keep-awake
 * - Drift-free countdown timer with NL instruction duration parsing
 * - Ingredient drawer with on-the-fly serving scaling
 * - Step-by-step progress tracking
 * - Cooking session persistence (Supabase cooking_sessions table)
 * - Safe exit confirmation and cache invalidation
 */

import React, { useState, useRef, useMemo, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ShoppingBag,
  Sun,
  AlertCircle,
} from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme, fontFamilies } from '@/theme'
import { useRecipeDetail } from '@/features/recipes/hooks'
import { extractTimerDuration, formatElapsedCookingTime } from '@/features/cook-mode/timer-utils'
import { useCookWakeLock } from '@/features/cook-mode/use-cook-wake-lock'
import { useCompleteCookingSession } from '@/features/cook-mode/hooks'
import { CookTimer } from '@/components/cook-mode/cook-timer'
import { StepProgressBar } from '@/components/cook-mode/step-progress-bar'
import { IngredientSheet } from '@/components/cook-mode/ingredient-sheet'
import { CompletionModal } from '@/components/cook-mode/completion-modal'

export default function CookModeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { colors, radii, shadows, isDark } = useAureliaTheme()
  const { id, servings: initialServingsParam } = useLocalSearchParams<{
    id: string
    servings?: string
  }>()

  // 1. Fetch recipe data
  const {
    data: recipe,
    isLoading,
    isError,
    refetch,
  } = useRecipeDetail(id || '')

  // 2. Wake lock management
  const { isWakeLockActive } = useCookWakeLock()

  // 3. Session time tracking
  const startedAtRef = useRef<string>(new Date().toISOString())

  // 4. Step and UI state
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [ingredientSheetVisible, setIngredientSheetVisible] = useState(false)
  const [completionModalVisible, setCompletionModalVisible] = useState(false)
  const [checkedIngredientIds, setCheckedIngredientIds] = useState<Set<string>>(new Set())
  const [customServings, setCustomServings] = useState<number | null>(null)
  const [timerStartedAnywhere, setTimerStartedAnywhere] = useState(false)

  // 5. Complete session mutation
  const completeMutation = useCompleteCookingSession()

  // Sort instructions by step_number
  const instructions = useMemo(() => {
    if (!recipe?.instructions) return []
    return [...recipe.instructions].sort((a, b) => a.step_number - b.step_number)
  }, [recipe?.instructions])

  const totalSteps = instructions.length
  const currentStep = instructions[currentStepIndex] || null
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex >= totalSteps - 1

  // Determine current active servings
  const activeServings = customServings ?? (initialServingsParam ? parseInt(initialServingsParam, 10) : (recipe?.servings || 2))

  // Determine timer duration for current step (explicit DB duration or NL parse)
  const stepTimerDuration = useMemo(() => {
    if (!currentStep) return null
    if (typeof currentStep.timer_duration === 'number' && currentStep.timer_duration > 0) {
      return currentStep.timer_duration
    }
    return extractTimerDuration(currentStep.instruction)
  }, [currentStep])

  // Identify ingredients referenced in this step instruction
  const relevantIngredients = useMemo(() => {
    if (!currentStep || !recipe?.ingredients) return []
    const textLower = currentStep.instruction.toLowerCase()
    return recipe.ingredients.filter(ing => {
      if (!ing.name) return false
      const nameLower = ing.name.toLowerCase().trim()
      if (textLower.includes(nameLower)) return true
      const words = nameLower.split(/\s+/)
      return words.some(w => w.length >= 4 && textLower.includes(w))
    })
  }, [currentStep, recipe?.ingredients])

  // Toggle ingredient checked in sheet
  const handleToggleIngredient = useCallback((ingId: string) => {
    setCheckedIngredientIds(prev => {
      const next = new Set(prev)
      if (next.has(ingId)) {
        next.delete(ingId)
      } else {
        next.add(ingId)
      }
      return next
    })
  }, [])

  const handleClearChecks = useCallback(() => {
    setCheckedIngredientIds(new Set())
  }, [])

  // Step navigation
  const handlePrevStep = () => {
    if (isFirstStep) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
    setCurrentStepIndex(prev => Math.max(0, prev - 1))
  }

  const handleNextStep = () => {
    if (isLastStep) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      setCompletionModalVisible(true)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setCurrentStepIndex(prev => Math.min(totalSteps - 1, prev + 1))
  }

  // Exit flow with interruption safety
  const handleExitPress = () => {
    if (isFirstStep && !timerStartedAnywhere) {
      router.back()
      return
    }

    Alert.alert(
      'Leave Cook Mode?',
      'Your cooking session is still in progress. Exiting will not record a completed session.',
      [
        { text: 'Keep Cooking', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    )
  }

  // Confirm completion
  const handleConfirmCompletion = async (rating: number | null, notes: string) => {
    if (!recipe) return
    const completedAt = new Date().toISOString()

    try {
      await completeMutation.mutateAsync({
        recipeId: recipe.id,
        startedAt: startedAtRef.current,
        completedAt,
        rating,
        notes,
      })

      setCompletionModalVisible(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
      router.back()
    } catch (err: any) {
      Alert.alert(
        'Session Save Failed',
        err?.message || 'Could not record your cooking session. Please try again.',
        [
          { text: 'Retry', onPress: () => handleConfirmCompletion(rating, notes) },
          { text: 'Dismiss', style: 'cancel' },
        ]
      )
    }
  }

  // ----------------------------------------------------
  // Loading State
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular },
          ]}
        >
          Setting up kitchen workspace...
        </Text>
      </SafeAreaView>
    )
  }

  // ----------------------------------------------------
  // Error State
  // ----------------------------------------------------
  if (isError || !recipe) {
    return (
      <SafeAreaView style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <AlertCircle size={48} color={colors.destructive} />
        <Text
          style={[
            styles.errorTitle,
            { color: colors.foreground, fontFamily: fontFamilies.serifBold },
          ]}
        >
          Recipe Not Found
        </Text>
        <Text
          style={[
            styles.errorSubtitle,
            { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular },
          ]}
        >
          Could not load the recipe for Cook Mode.
        </Text>

        <View style={styles.errorActions}>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary, borderRadius: radii.pill }]}
          >
            <Text style={[styles.retryBtnText, { fontFamily: fontFamilies.sansBold, color: colors.primaryForeground }]}>
              Try Again
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { borderColor: colors.border, borderRadius: radii.pill }]}
          >
            <Text style={[styles.backBtnText, { color: colors.foreground }]}>
              Exit
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  // Calculate elapsed real time string
  const elapsedTimeString = formatElapsedCookingTime(
    startedAtRef.current,
    new Date().toISOString()
  )

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 10) },
      ]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* TOP KITCHEN HUD BAR */}
      <View style={[styles.hudBar, { borderBottomColor: colors.border }]}>
        {/* Exit Button */}
        <Pressable
          testID="exit-cook-mode-btn"
          onPress={handleExitPress}
          hitSlop={12}
          accessibilityLabel="Exit Cook Mode"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.exitBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <X size={20} color={colors.foreground} />
        </Pressable>

        {/* Recipe Title & Wake-lock badge */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.recipeHeaderTitle,
              { color: colors.foreground, fontFamily: fontFamilies.serifBold },
            ]}
            numberOfLines={1}
          >
            {recipe.title}
          </Text>

          <View style={styles.statusRow}>
            {isWakeLockActive && (
              <View style={styles.wakeLockBadge}>
                <Sun size={11} color={colors.primary} />
                <Text
                  style={[
                    styles.wakeLockText,
                    { color: colors.primary, fontFamily: fontFamilies.sansMedium },
                  ]}
                >
                  Screen Stay Awake ON
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Ingredient Drawer Trigger */}
        <Pressable
          testID="open-ingredients-btn"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
            setIngredientSheetVisible(true)
          }}
          accessibilityLabel="Open ingredient list"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.ingredientsBtn,
            { backgroundColor: colors.secondary, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <ShoppingBag size={18} color={colors.primary} />
          <Text
            style={[
              styles.ingredientsBtnText,
              { color: colors.foreground, fontFamily: fontFamilies.sansBold },
            ]}
          >
            {recipe.ingredients?.length || 0}
          </Text>
        </Pressable>
      </View>

      {/* STEP PROGRESS BAR */}
      <StepProgressBar
        currentStepIndex={currentStepIndex}
        totalSteps={totalSteps}
        onSelectStep={(idx) => setCurrentStepIndex(idx)}
      />

      {/* MAIN STEP CONTENT AREA */}
      <ScrollView
        style={styles.stepScroll}
        contentContainerStyle={[
          styles.stepScrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {totalSteps === 0 ? (
          <View style={styles.noStepsContainer}>
            <Text
              style={[
                styles.noStepsText,
                { color: colors.mutedForeground, fontFamily: fontFamilies.sansRegular },
              ]}
            >
              This recipe does not have separate step instructions.
            </Text>
          </View>
        ) : (
          <>
            {/* Step Counter Label */}
            <Text
              style={[
                styles.stepCounterText,
                { color: colors.primary, fontFamily: fontFamilies.sansBold },
              ]}
            >
              STEP {currentStepIndex + 1}
            </Text>

            {/* Giant Instruction Text for Kitchen Standing Distance */}
            <Text
              testID="cook-instruction-text"
              style={[
                styles.instructionText,
                {
                  color: colors.foreground,
                  fontFamily: fontFamilies.sansMedium,
                },
              ]}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Step ${currentStepIndex + 1}: ${currentStep?.instruction}`}
            >
              {currentStep?.instruction}
            </Text>

            {/* Relevant Ingredients for this step */}
            {relevantIngredients.length > 0 && (
              <View style={[styles.relevantBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text
                  style={[
                    styles.relevantHeader,
                    { color: colors.mutedForeground, fontFamily: fontFamilies.sansBold },
                  ]}
                >
                  Step Ingredients:
                </Text>
                <View style={styles.relevantPills}>
                  {relevantIngredients.map(ing => (
                    <View
                      key={ing.id}
                      style={[styles.relevantPill, { backgroundColor: colors.secondary }]}
                    >
                      <Text
                        style={[
                          styles.relevantPillText,
                          { color: colors.foreground, fontFamily: fontFamilies.sansMedium },
                        ]}
                      >
                        {ing.name}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Step Timer if duration present */}
            {stepTimerDuration && stepTimerDuration > 0 ? (
              <View style={styles.timerWrapper}>
                <CookTimer
                  key={`timer-step-${currentStepIndex}`}
                  durationSeconds={stepTimerDuration}
                  stepNumber={currentStepIndex + 1}
                  onComplete={() => {
                    setTimerStartedAnywhere(true)
                  }}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* FLOATING ACTION BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 14),
          },
          shadows.card,
        ]}
      >
        {/* Previous Button */}
        <Pressable
          testID="prev-step-btn"
          onPress={handlePrevStep}
          disabled={isFirstStep}
          accessibilityLabel="Previous Step"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.navButton,
            styles.prevButton,
            {
              borderColor: isFirstStep ? colors.border + '40' : colors.border,
              backgroundColor: isFirstStep ? 'transparent' : colors.secondary,
              opacity: isFirstStep ? 0.35 : pressed ? 0.7 : 1,
            },
          ]}
        >
          <ChevronLeft size={22} color={colors.foreground} />
          <Text
            style={[
              styles.navButtonText,
              { color: colors.foreground, fontFamily: fontFamilies.sansBold },
            ]}
          >
            Prev
          </Text>
        </Pressable>

        {/* Next / Finish Button */}
        <Pressable
          testID={isLastStep ? 'finish-cooking-btn' : 'next-step-btn'}
          onPress={handleNextStep}
          accessibilityLabel={isLastStep ? 'Finish Cooking' : 'Next Step'}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.navButton,
            styles.nextButton,
            {
              backgroundColor: isLastStep ? '#10B981' : colors.primary,
              opacity: pressed ? 0.85 : 1,
            },
            shadows.card,
          ]}
        >
          {isLastStep ? (
            <>
              <CheckCircle2 size={20} color="#FFF" />
              <Text
                style={[
                  styles.nextButtonText,
                  { color: '#FFF', fontFamily: fontFamilies.sansBold },
                ]}
              >
                Finish Cooking
              </Text>
            </>
          ) : (
            <>
              <Text
                style={[
                  styles.nextButtonText,
                  { color: '#FFF', fontFamily: fontFamilies.sansBold },
                ]}
              >
                Next Step
              </Text>
              <ChevronRight size={22} color="#FFF" />
            </>
          )}
        </Pressable>
      </View>

      {/* INGREDIENT BOTTOM SHEET */}
      <IngredientSheet
        visible={ingredientSheetVisible}
        onClose={() => setIngredientSheetVisible(false)}
        ingredients={recipe.ingredients || []}
        baseServings={recipe.servings}
        currentServings={activeServings}
        onServingsChange={setCustomServings}
        checkedIds={checkedIngredientIds}
        onToggleIngredient={handleToggleIngredient}
        onClearChecks={handleClearChecks}
      />

      {/* COMPLETION MODAL */}
      <CompletionModal
        visible={completionModalVisible}
        recipeTitle={recipe.title}
        elapsedTimeString={elapsedTimeString}
        isSubmitting={completeMutation.isPending}
        onConfirm={handleConfirmCompletion}
        onCancel={() => setCompletionModalVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    marginTop: 16,
  },
  errorTitle: {
    fontSize: 22,
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontSize: 15,
  },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 15,
  },
  hudBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  exitBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    paddingHorizontal: 12,
  },
  recipeHeaderTitle: {
    fontSize: 17,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  wakeLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wakeLockText: {
    fontSize: 11,
    letterSpacing: 0.3,
  },
  ingredientsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
  },
  ingredientsBtnText: {
    fontSize: 14,
  },
  stepScroll: {
    flex: 1,
  },
  stepScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepCounterText: {
    fontSize: 13,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 26,
    lineHeight: 38,
    letterSpacing: 0.2,
    marginBottom: 24,
  },
  relevantBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  relevantHeader: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  relevantPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relevantPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  relevantPillText: {
    fontSize: 13,
  },
  timerWrapper: {
    marginVertical: 12,
  },
  noStepsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noStepsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  navButton: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
  },
  prevButton: {
    flex: 1,
    borderWidth: 1,
    gap: 6,
  },
  nextButton: {
    flex: 2,
    gap: 6,
  },
  navButtonText: {
    fontSize: 16,
  },
  nextButtonText: {
    fontSize: 16,
    letterSpacing: 0.2,
  },
})
