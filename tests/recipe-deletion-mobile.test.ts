import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  deleteRecipeDirect,
  bulkDeleteRecipesDirect,
} from '@/features/recipes/recipe-mutations'
import { supabase } from '@/lib/supabase'

vi.mock('@/lib/supabase', () => {
  const mockGetUser = vi.fn()
  const mockDelete = vi.fn()
  const mockEq = vi.fn()
  const mockIn = vi.fn()
  const mockSelect = vi.fn()
  const mockStorageRemove = vi.fn()

  return {
    supabase: {
      auth: {
        getUser: mockGetUser,
      },
      from: vi.fn(() => ({
        delete: mockDelete,
      })),
      storage: {
        from: vi.fn(() => ({
          remove: mockStorageRemove,
        })),
      },
      // Export mocks for test access
      __mockGetUser: mockGetUser,
      __mockDelete: mockDelete,
      __mockEq: mockEq,
      __mockIn: mockIn,
      __mockSelect: mockSelect,
      __mockStorageRemove: mockStorageRemove,
    },
  }
})

describe('Aurelia Mobile — Recipe Deletion & Bulk Deletion Direct Suite', () => {
  const mock = supabase as any

  beforeEach(() => {
    vi.clearAllMocks()

    mock.__mockGetUser.mockResolvedValue({
      data: { user: { id: 'mobile-user-1' } },
    })

    mock.__mockSelect.mockResolvedValue({
      data: [
        {
          id: 'rec-mobile-1',
          image_url: 'https://xyz.supabase.co/storage/v1/object/public/recipe-images/mobile-user-1/dish.jpg',
        },
      ],
      error: null,
    })

    mock.__mockEq.mockReturnValue({
      eq: mock.__mockEq,
      select: mock.__mockSelect,
    })
    mock.__mockIn.mockReturnValue({
      eq: mock.__mockEq,
      select: mock.__mockSelect,
    })
    mock.__mockDelete.mockReturnValue({
      eq: mock.__mockEq,
      in: mock.__mockIn,
      select: mock.__mockSelect,
    })
    mock.__mockStorageRemove.mockResolvedValue({ data: [], error: null })
  })

  describe('Single-Recipe Deletion (deleteRecipeDirect)', () => {
    it('deletes owned recipe and cleans up storage object', async () => {
      await expect(deleteRecipeDirect('rec-mobile-1')).resolves.toBeUndefined()
      expect(mock.__mockEq).toHaveBeenCalledWith('id', 'rec-mobile-1')
      expect(mock.__mockEq).toHaveBeenCalledWith('user_id', 'mobile-user-1')
      expect(mock.__mockStorageRemove).toHaveBeenCalledWith(['mobile-user-1/dish.jpg'])
    })

    it('throws error when user is unauthenticated', async () => {
      mock.__mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      await expect(deleteRecipeDirect('rec-mobile-1')).rejects.toThrow(
        'You must be signed in to delete a recipe.'
      )
    })

    it('throws error when recipe is not found or not owned by user', async () => {
      mock.__mockSelect.mockResolvedValueOnce({ data: [], error: null })
      await expect(deleteRecipeDirect('rec-other')).rejects.toThrow(
        'Recipe not found or you do not have permission to delete it.'
      )
    })
  })

  describe('Bulk-Recipe Deletion (bulkDeleteRecipesDirect)', () => {
    it('deletes multiple recipes owned by user and cleans up images', async () => {
      mock.__mockSelect.mockResolvedValueOnce({
        data: [
          { id: 'rec-1', image_url: 'https://xyz/recipe-images/u/img1.jpg' },
          { id: 'rec-2', image_url: null },
        ],
        error: null,
      })

      const res = await bulkDeleteRecipesDirect(['rec-1', 'rec-2'])
      expect(res.count).toBe(2)
      expect(res.deletedIds).toEqual(['rec-1', 'rec-2'])
      expect(mock.__mockIn).toHaveBeenCalledWith('id', ['rec-1', 'rec-2'])
      expect(mock.__mockStorageRemove).toHaveBeenCalledWith(['u/img1.jpg'])
    })

    it('rejects empty recipe list', async () => {
      await expect(bulkDeleteRecipesDirect([])).rejects.toThrow('No recipes selected for deletion.')
    })

    it('throws error when unauthenticated', async () => {
      mock.__mockGetUser.mockResolvedValueOnce({ data: { user: null } })
      await expect(bulkDeleteRecipesDirect(['rec-1'])).rejects.toThrow(
        'You must be signed in to delete recipes.'
      )
    })
  })
})
