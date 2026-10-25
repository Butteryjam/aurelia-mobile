import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

export interface ImagePickResult {
  uri: string
  fileName: string
  mimeType: string
  fileSize?: number
}

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Detect image MIME type and file extension directly from binary magic bytes.
 * Protects against incorrect or missing MIME types provided by Android content providers.
 */
export function detectImageFormat(buffer: ArrayBuffer): { mimeType: string; ext: string } | null {
  if (!buffer || buffer.byteLength < 4) return null
  const bytes = new Uint8Array(buffer.slice(0, 16))

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: 'jpg' }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: 'image/png', ext: 'png' }
  }

  // WebP: RIFF (52 49 46 46) .... WEBP (57 45 42 50)
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes.length >= 12 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: 'image/webp', ext: 'webp' }
  }

  // GIF: GIF87a or GIF89a (47 49 46 38)
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
    return { mimeType: 'image/gif', ext: 'gif' }
  }

  return null
}

/**
 * Validates image buffer size and format.
 * Returns the verified MIME type and safe extension.
 */
export function validateImageBuffer(
  buffer: ArrayBuffer,
  fallbackMime?: string
): { mimeType: string; ext: string } {
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Image file is empty.')
  }

  if (buffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image file exceeds the 5 MB size limit.')
  }

  const detected = detectImageFormat(buffer)
  if (detected) {
    return detected
  }

  // Check if fallback MIME is valid and not text/plain
  if (
    fallbackMime &&
    ALLOWED_MIME_TYPES.includes(fallbackMime) &&
    fallbackMime !== 'text/plain'
  ) {
    const ext = fallbackMime.split('/')[1] || 'jpg'
    return { mimeType: fallbackMime, ext }
  }

  throw new Error('Unsupported image format. Please select a valid JPEG, PNG, or WebP photo.')
}

/**
 * Request permission and pick an image from the device photo library.
 */
export async function pickImageFromLibrary(): Promise<ImagePickResult | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Permission to access photo library was denied.')
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  })

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null
  }

  const asset = result.assets[0]
  const mimeType = asset.mimeType || 'image/jpeg'
  const fileName = asset.fileName || `recipe_${Date.now()}.jpg`

  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image file exceeds the 5 MB size limit.')
  }

  return {
    uri: asset.uri,
    fileName,
    mimeType,
    fileSize: asset.fileSize,
  }
}

/**
 * Request permission and take a photo using the device camera.
 */
export async function takePhotoWithCamera(): Promise<ImagePickResult | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Permission to access camera was denied.')
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.85,
  })

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null
  }

  const asset = result.assets[0]
  const mimeType = asset.mimeType || 'image/jpeg'
  const fileName = asset.fileName || `recipe_capture_${Date.now()}.jpg`

  if (asset.fileSize && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Image file exceeds the 5 MB size limit.')
  }

  return {
    uri: asset.uri,
    fileName,
    mimeType,
    fileSize: asset.fileSize,
  }
}

/**
 * Upload an image URI to the user's directory in the `recipe-images` Supabase Storage bucket.
 * Returns the public URL of the uploaded image.
 *
 * Uses raw binary ArrayBuffer upload to avoid React Native Android Blob text/plain bugs.
 */
export async function uploadRecipeImage(
  uri: string,
  fileName = 'photo.jpg',
  mimeType = 'image/jpeg'
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('You must be signed in to upload a recipe image.')
  }

  let buffer: ArrayBuffer

  try {
    const response = await fetch(uri)
    buffer = await response.arrayBuffer()
  } catch (err: any) {
    console.error('[uploadRecipeImage] Error reading file URI:', err)
    throw new Error('Could not read image file for upload. Please try again.')
  }

  // Validate format and size via binary magic bytes
  const { mimeType: verifiedMime, ext } = validateImageBuffer(buffer, mimeType)

  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  const storagePath = `${user.id}/${Date.now()}_${cleanName}.${ext}`

  // Upload raw ArrayBuffer directly — sets exact Content-Type without FormData/Blob interference
  const { data, error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(storagePath, buffer, {
      contentType: verifiedMime,
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError || !data) {
    console.error('[uploadRecipeImage] Error:', uploadError)
    throw new Error(uploadError?.message || 'Failed to upload image. Please try again.')
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('recipe-images').getPublicUrl(data.path)

  return publicUrl
}
