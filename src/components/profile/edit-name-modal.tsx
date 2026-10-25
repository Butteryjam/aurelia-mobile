import React, { useState, useEffect } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { X, User, AlertCircle } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { validateDisplayName } from '@/features/auth/profile-api'

export interface EditNameModalProps {
  visible: boolean
  currentName: string
  onClose: () => void
  onSave: (newName: string) => Promise<{ success: boolean; error?: string }>
}

export function EditNameModal({
  visible,
  currentName,
  onClose,
  onSave,
}: EditNameModalProps) {
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()
  const [name, setName] = useState(currentName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset name and clear errors whenever modal opens with currentName
  useEffect(() => {
    if (visible) {
      setName(currentName)
      setError(null)
      setIsSubmitting(false)
    }
  }, [visible, currentName])

  const handleSave = async () => {
    if (isSubmitting) return

    const validationError = validateDisplayName(name)
    if (validationError) {
      setError(validationError)
      return
    }

    const trimmed = name.trim()

    setError(null)
    setIsSubmitting(true)
    try {
      const result = await onSave(trimmed)
      if (result.success) {
        onClose()
      } else {
        setError(result.error || 'Failed to update name. Please try again.')
      }
    } catch (err: any) {
      setError(err?.message || 'A network error occurred while updating your name.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (isSubmitting) return
    setName(currentName)
    setError(null)
    onClose()
  }

  const trimmedLength = name.trim().length
  const isSaveDisabled = isSubmitting || trimmedLength === 0 || name.length > 60

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={styles.backdrop}
          onPress={handleCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss dialog backdrop"
        />

        <View
          style={[
            styles.cardContainer,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: colors.secondary, borderRadius: radii.pill },
                ]}
              >
                <User size={18} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={[typography.sectionTitle, { color: colors.foreground, fontSize: 18 }]}>
                  Edit Name
                </Text>
                <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                  Update how you are addressed across Aurelia
                </Text>
              </View>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed || isSubmitting ? 0.6 : 1 },
              ]}
              onPress={handleCancel}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Close edit name dialog"
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Form Content */}
          <View style={styles.body}>
            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: colors.destructive + '15',
                    borderColor: colors.destructive + '40',
                    borderRadius: radii.control,
                  },
                ]}
              >
                <AlertCircle size={16} color={colors.destructive} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={[typography.caption, { color: colors.foreground, fontWeight: '600' }]}>
                  Display Name
                </Text>
                <Text
                  style={[
                    typography.caption,
                    {
                      color: name.length > 60 ? colors.destructive : colors.mutedForeground,
                      fontSize: 11,
                    },
                  ]}
                >
                  {name.length} / 60
                </Text>
              </View>

              <TextInput
                style={[
                  styles.input,
                  typography.body,
                  {
                    backgroundColor: colors.background,
                    borderColor: error ? colors.destructive : colors.border,
                    color: colors.foreground,
                    borderRadius: radii.control,
                  },
                ]}
                value={name}
                onChangeText={(text) => {
                  setName(text)
                  if (error) setError(null)
                }}
                placeholder="Enter your name"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
                maxLength={70}
                editable={!isSubmitting}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleSave}
                accessibilityLabel="Display Name input field"
              />
            </View>
          </View>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                {
                  borderColor: colors.border,
                  borderRadius: radii.control,
                  opacity: pressed || isSubmitting ? 0.7 : 1,
                },
              ]}
              onPress={handleCancel}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel editing name"
            >
              <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.control,
                  opacity: isSaveDisabled ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
              onPress={handleSave}
              disabled={isSaveDisabled}
              accessibilityRole="button"
              accessibilityLabel="Save Changes"
            >
              {isSubmitting ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={colors.primaryForeground} style={{ marginRight: 8 }} />
                  <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                    Saving...
                  </Text>
                </View>
              ) : (
                <Text style={[typography.bodyMedium, { color: colors.primaryForeground, fontWeight: '700' }]}>
                  Save Changes
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTextGroup: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  inputGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButton: {
    paddingHorizontal: 20,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
