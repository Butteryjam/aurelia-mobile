import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { Image } from 'expo-image'
import { Camera, Image as ImageIcon, Trash2, RefreshCw, AlertCircle } from 'lucide-react-native'
import { useAureliaTheme, colors, typography, spacing, borderRadius } from '@/theme'
import {
  pickImageFromLibrary,
  takePhotoWithCamera,
  uploadRecipeImage,
} from '@/features/recipes/image-upload'

interface Props {
  imageUrl: string
  onChange: (url: string) => void
}

export function RecipeImageSection({ imageUrl, onChange }: Props) {
  const { colors } = useAureliaTheme()
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [localPreviewUri, setLocalPreviewUri] = useState<string | null>(null)

  const handlePickFromLibrary = async () => {
    setErrorMessage(null)
    try {
      const picked = await pickImageFromLibrary()
      if (!picked) return

      setLocalPreviewUri(picked.uri)
      setIsUploading(true)

      const uploadedUrl = await uploadRecipeImage(picked.uri, picked.fileName, picked.mimeType)
      onChange(uploadedUrl)
      setLocalPreviewUri(null)
    } catch (err: any) {
      console.warn('[handlePickFromLibrary] upload failed:', err)
      setErrorMessage(err.message || 'Image upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCaptureCamera = async () => {
    setErrorMessage(null)
    try {
      const captured = await takePhotoWithCamera()
      if (!captured) return

      setLocalPreviewUri(captured.uri)
      setIsUploading(true)

      const uploadedUrl = await uploadRecipeImage(captured.uri, captured.fileName, captured.mimeType)
      onChange(uploadedUrl)
      setLocalPreviewUri(null)
    } catch (err: any) {
      console.warn('[handleCaptureCamera] camera upload failed:', err)
      setErrorMessage(err.message || 'Could not upload photo from camera.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    setLocalPreviewUri(null)
    setErrorMessage(null)
  }

  const currentDisplayUri = localPreviewUri || imageUrl

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Recipe Photography</Text>

      {/* Error Banner */}
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#DC2626" />
          <Text style={styles.errorBannerText}>{errorMessage}</Text>
        </View>
      ) : null}

      {currentDisplayUri ? (
        <View style={[styles.previewContainer, { backgroundColor: colors.surfaceSubtle }]}>
          <Image
            source={{ uri: currentDisplayUri }}
            style={styles.previewImage}
            contentFit="cover"
            accessibilityLabel="Recipe photo preview"
          />

          {isUploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.uploadingText}>Uploading to Aurelia Vault...</Text>
            </View>
          ) : (
            <View style={styles.previewActions}>
              <Pressable
                style={[styles.actionButton, styles.replaceButton]}
                onPress={handlePickFromLibrary}
                accessibilityRole="button"
                accessibilityLabel="Replace photo"
              >
                <RefreshCw size={14} color={colors.foreground} />
                <Text style={[styles.replaceButtonText, { color: colors.foreground }]}>Replace</Text>
              </Pressable>

              <Pressable
                style={[styles.actionButton, styles.removeButton]}
                onPress={handleRemoveImage}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          )}
        </View>
      ) : (
        <View style={[styles.emptyContainer, { backgroundColor: colors.surfaceSubtle, borderColor: colors.border }]}>
          {isUploading ? (
            <View style={styles.uploadingState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.uploadingStateText, { color: colors.textSecondary }]}>Uploading photo...</Text>
            </View>
          ) : (
            <>
              <View style={styles.iconCircle}>
                <ImageIcon size={28} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Add Editorial Food Photo</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Showcase your culinary dish with vibrant photography. Max 5 MB.
              </Text>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.pickButton, { backgroundColor: colors.primary }]}
                  onPress={handlePickFromLibrary}
                  accessibilityRole="button"
                  accessibilityLabel="Choose from photo library"
                >
                  <ImageIcon size={16} color="#FFFFFF" />
                  <Text style={styles.pickButtonText}>Photo Library</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.pickButton,
                    styles.cameraButton,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                  ]}
                  onPress={handleCaptureCamera}
                  accessibilityRole="button"
                  accessibilityLabel="Take a photo with camera"
                >
                  <Camera size={16} color={colors.foreground} />
                  <Text style={[styles.cameraButtonText, { color: colors.foreground }]}>Take Photo</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  sectionHeader: {
    fontFamily: typography.serif,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#F87171',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 12,
    color: '#DC2626',
  },
  previewContainer: {
    position: 'relative',
    height: 200,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSubtle,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  uploadingText: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  previewActions: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    minHeight: 36,
  },
  replaceButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  replaceButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: colors.textPrimary,
  },
  removeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  removeButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 12,
    color: '#DC2626',
  },
  emptyContainer: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSubtle,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(200, 90, 50, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: typography.sans,
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 240,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: borderRadius.full,
    minHeight: 44,
  },
  pickButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: '#FFFFFF',
  },
  cameraButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cameraButtonText: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.textPrimary,
  },
  uploadingState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  uploadingStateText: {
    fontFamily: typography.sansMedium,
    fontSize: 13,
    color: colors.textSecondary,
  },
})
