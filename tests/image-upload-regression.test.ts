import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  detectImageFormat,
  validateImageBuffer,
  uploadRecipeImage,
  MAX_IMAGE_SIZE_BYTES,
} from '@/features/recipes/image-upload'
import { supabase } from '@/lib/supabase'

describe('Issue 1 — Recipe Photo Upload & MIME Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('detects JPEG format from binary magic bytes (FF D8 FF)', () => {
    const jpegBuffer = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]).buffer
    const format = detectImageFormat(jpegBuffer)
    expect(format).toEqual({ mimeType: 'image/jpeg', ext: 'jpg' })
  })

  it('detects PNG format from binary magic bytes (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngBuffer = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]).buffer
    const format = detectImageFormat(pngBuffer)
    expect(format).toEqual({ mimeType: 'image/png', ext: 'png' })
  })

  it('detects WebP format from binary magic bytes (RIFF ... WEBP)', () => {
    const webpBuffer = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    ]).buffer
    const format = detectImageFormat(webpBuffer)
    expect(format).toEqual({ mimeType: 'image/webp', ext: 'webp' })
  })

  it('rejects plain text files and arbitrary non-image buffers', () => {
    const textBytes = new TextEncoder().encode('mime type text/plain is not supported')
    const format = detectImageFormat(textBytes.buffer)
    expect(format).toBeNull()

    expect(() => validateImageBuffer(textBytes.buffer, 'text/plain')).toThrow(
      'Unsupported image format'
    )
  })

  it('rejects image files exceeding 5 MB limit', () => {
    const largeBuffer = new ArrayBuffer(MAX_IMAGE_SIZE_BYTES + 1024)
    expect(() => validateImageBuffer(largeBuffer, 'image/jpeg')).toThrow(
      'Image file exceeds the 5 MB size limit.'
    )
  })

  it('safely falls back to valid image MIME when magic bytes are non-standard but allowed', () => {
    const dummyBuffer = new Uint8Array([0x01, 0x02, 0x03, 0x04, 0x05]).buffer
    const validated = validateImageBuffer(dummyBuffer, 'image/png')
    expect(validated).toEqual({ mimeType: 'image/png', ext: 'png' })
  })

  it('uploads ArrayBuffer directly to Supabase Storage with explicit content-type', async () => {
    const mockUser = { id: 'usr-123' }
    vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
      data: { user: mockUser as any },
      error: null,
    } as any)

    const uploadMock = vi.fn().mockResolvedValue({
      data: { path: 'usr-123/123456_my_photo.jpg' },
      error: null,
    })
    const getPublicUrlMock = vi.fn().mockReturnValue({
      data: { publicUrl: 'https://upzkcqovqstfsizerulx.supabase.co/storage/v1/object/public/recipe-images/usr-123/123456_my_photo.jpg' },
    })

    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: uploadMock,
      getPublicUrl: getPublicUrlMock,
    } as any)

    // Mock fetch for image URI returning a valid JPEG arrayBuffer
    const fakeJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(fakeJpegBytes.buffer),
    } as any)

    const publicUrl = await uploadRecipeImage('file:///photos/biryani.jpg', 'biryani.jpg', 'image/jpeg')

    expect(uploadMock).toHaveBeenCalledWith(
      expect.stringContaining('usr-123/'),
      expect.any(ArrayBuffer),
      expect.objectContaining({
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: true,
      })
    )
    expect(publicUrl).toBe(
      'https://upzkcqovqstfsizerulx.supabase.co/storage/v1/object/public/recipe-images/usr-123/123456_my_photo.jpg'
    )
  })
})
