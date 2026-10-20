import React, { useState } from 'react'
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
import { X, FolderPlus } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

interface Props {
  visible: boolean
  onClose: () => void
  onSubmit: (name: string, description: string) => Promise<void>
}

export function CreateCollectionModal({ visible, onClose, onSubmit }: Props) {
  const { colors, typography, spacing, radii } = useAureliaTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Collection name is required')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      await onSubmit(name.trim(), description.trim())
      setName('')
      setDescription('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Could not create collection.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (isSubmitting) return
    setName('')
    setDescription('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheetContainer, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: radii.card }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FolderPlus size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>New Collection</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
            >
              <X size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Collection Name <Text style={[styles.required, { color: colors.primary }]}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: radii.control,
                },
                error ? styles.inputError : null,
              ]}
              value={name}
              onChangeText={(t) => {
                setName(t)
                if (error) setError(null)
              }}
              placeholder="e.g. Italian Sunday Feasts, Quick Weeknights"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
              accessibilityLabel="Collection name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Description (optional)</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                  borderRadius: radii.control,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Theme, wine pairings, or season..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Collection description"
            />
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.cancelButton, { borderColor: colors.border, borderRadius: radii.pill }]}
              onPress={handleClose}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={[styles.cancelButtonText, { color: colors.mutedForeground }]}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.createButton,
                { backgroundColor: colors.primary, borderRadius: radii.pill },
                (!name.trim() || isSubmitting) && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={!name.trim() || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Create Collection"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text style={[styles.createButtonText, { color: colors.primaryForeground }]}>Create Binder</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  closeButton: {
    padding: 6,
    borderRadius: 999,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  textArea: {
    minHeight: 70,
    paddingTop: 10,
  },
  inputError: {
    borderWidth: 1.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  required: {
    fontSize: 13,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
})
