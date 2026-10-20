import * as ImagePicker from 'expo-image-picker'
import { supabase } from '@/lib/supabase'

export interface ImagePickResult {
  uri: string
  fileName: string
  mimeType: string
  fileSize?: number
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
]

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

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
    throw new Error('Image must be smaller than 5 MB.')
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
    throw new Error('Image must be smaller than 5 MB.')
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

  // Sanitize file extension and name
  const rawExt = fileName.split('.').pop()?.toLowerCase() || 'jpg'
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'].includes(rawExt) ? rawExt : 'jpg'
  const cleanName = fileName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)
  const storagePath = `${user.id}/${Date.now()}_${cleanName}.${ext}`

  let body: Blob | ArrayBuffer

  try {
    // In React Native and modern web, fetch(uri) works for local file/content/blob URIs
    const response = await fetch(uri)
    const blob = await response.blob()

    if (blob.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Image file exceeds the 5 MB size limit.')
    }

    body = blob
  } catch (err: any) {
    if (err.message && err.message.includes('5 MB')) {
      throw err
    }
    // Fallback: If blob conversion fails, attempt arrayBuffer
    try {
      const response = await fetch(uri)
      body = await response.arrayBuffer()
    } catch {
      throw new Error('Could not read image file for upload. Please try again.')
    }
  }

  const { data, error: uploadError } = await supabase.storage
    .from('recipe-images')
    .upload(storagePath, body, {
      contentType: mimeType,
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
