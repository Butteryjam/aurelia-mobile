/**
 * Aurelia Mobile — Cook Mode Completion Flow Modal
 *
 * Prompts user for a 1-5 star rating and optional chef's notes upon
 * completing all cooking steps. Confirms and records the session.
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Star, CheckCircle2, ChefHat, X, Clock } from 'lucide-react-native'
import * as Haptics from 'expo-haptics'
import { useAureliaTheme, fontFamilies } from '@/theme'

interface CompletionModalProps {
  visible: boolean
  recipeTitle: string
  elapsedTimeString: string
  isSubmitting: boolean
  onConfirm: (rating: number | null, notes: string) => void
  onCancel: () => void
}

export function CompletionModal({
  visible,
  recipeTitle,
  elapsedTimeString,
  isSubmitting,
  onConfirm,
  onCancel,
}: CompletionModalProps) {
  const insets = useSafeAreaInsets()
  const { colors, radii, shadows } = useAureliaTheme()

  const [rating, setRating] = useState<number | null>(5)
  const [notes, setNotes] = useState('')

  if (!visible) return null

  const handleStarPress = (score: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setRating(prev => (prev === score ? null : score))
  }

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
    onConfirm(rating, notes)
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={onCancel}
            accessibilityLabel="Close completion dialog"
            accessibilityRole="button"
          />

          <View
            style={[
              styles.dialog,
              {
                backgroundColor: colors.surface,
                borderRadius: radii.card,
                paddingBottom: Math.max(insets.bottom, 20),
              },
              shadows.dialog,
            ]}
          >
            {/* Close button */}
            <Pressable
              testID="close-completion-btn"
              onPress={onCancel}
              hitSlop={10}
              accessibilityLabel="Cancel completion"
              accessibilityRole="button"
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSubtle }]}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Celebration Icon */}
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(186, 74, 46, 0.12)' }]}>
                <ChefHat size={36} color={colors.primary} />
              </View>

              <Text
                style={[
                  styles.congratsTitle,
                  { color: colors.textPrimary, fontFamily: fontFamilies.serifBold },
                ]}
              >
                Bon Appétit!
              </Text>

              <Text
                style={[
                  styles.recipeTitle,
                  { color: colors.textSecondary, fontFamily: fontFamilies.sansRegular },
                ]}
                numberOfLines={2}
              >
                You’ve finished cooking {recipeTitle}.
              </Text>

              {/* Time elapsed badge */}
              <View style={[styles.elapsedBadge, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Clock size={14} color={colors.primary} />
                <Text
                  style={[
                    styles.elapsedText,
                    { color: colors.textPrimary, fontFamily: fontFamilies.sansBold },
                  ]}
                >
                  Cook time: {elapsedTimeString}
                </Text>
              </View>

              {/* Rating Section */}
              <View style={styles.ratingSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textPrimary, fontFamily: fontFamilies.sansBold },
                  ]}
                >
                  How was it?
                </Text>

                <View
                  style={styles.starsRow}
                  accessible={true}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Rate this recipe"
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isSelected = (rating ?? 0) >= star
                    return (
                      <Pressable
                        key={star}
                        testID={`star-rating-${star}`}
                        onPress={() => handleStarPress(star)}
                        hitSlop={8}
                        accessibilityLabel={`${star} stars`}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        style={({ pressed }) => [
                          styles.starButton,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Star
                          size={32}
                          color={isSelected ? '#F59E0B' : colors.border}
                          fill={isSelected ? '#F59E0B' : 'transparent'}
                        />
                      </Pressable>
                    )
                  })}
                </View>
              </View>

              {/* Cooking Notes Input */}
              <View style={styles.notesSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: colors.textPrimary, fontFamily: fontFamilies.sansBold },
                  ]}
                >
                  Cooking Notes (optional)
                </Text>

                <TextInput
                  testID="cooking-notes-input"
                  style={[
                    styles.notesInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.textPrimary,
                      fontFamily: fontFamilies.sansRegular,
                      borderRadius: radii.control,
                    },
                  ]}
                  placeholder="e.g. Added extra garlic, baked 3 minutes longer for crispiness..."
                  placeholderTextColor={colors.textSecondary}
                  multiline={true}
                  numberOfLines={3}
                  value={notes}
                  onChangeText={setNotes}
                  maxLength={500}
                />
              </View>

              {/* Confirm / Record button */}
              <Pressable
                testID="confirm-complete-btn"
                onPress={handleFinish}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel="Confirm and save cooking session"
                style={({ pressed }) => [
                  styles.confirmBtn,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.pill,
                    opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1,
                  },
                  shadows.card,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <CheckCircle2 size={18} color="#FFF" />
                    <Text
                      style={[
                        styles.confirmBtnText,
                        { color: '#FFF', fontFamily: fontFamilies.sansBold },
                      ]}
                    >
                      Save Cooking Session
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  congratsTitle: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 6,
  },
  recipeTitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  elapsedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  elapsedText: {
    fontSize: 12,
  },
  ratingSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  starButton: {
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesSection: {
    width: '100%',
    marginBottom: 24,
  },
  notesInput: {
    width: '100%',
    minHeight: 80,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  confirmBtn: {
    width: '100%',
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 16,
    letterSpacing: 0.3,
  },
})
