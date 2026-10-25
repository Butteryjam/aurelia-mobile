import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  safeParseJsonResponse,
  createRecipeDirect,
  updateRecipeDirect,
} from '@/features/recipes/recipe-mutations'
import { supabase } from '@/lib/supabase'
import { initialRecipeFormData, type RecipeFormData } from '@/features/recipes/recipe-form-schema'

describe('Issue 2 — Recipe Saving & Safe Response Parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('safeParseJsonResponse', () => {
    it('successfully parses valid JSON response', async () => {
      const mockResponse = new Response(JSON.stringify({ data: { id: 'recipe-123' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      const result = await safeParseJsonResponse(mockResponse)
      expect(result).toEqual({ data: { id: 'recipe-123' } })
    })

    it('safely handles 307 Temporary Redirect / login redirect without throwing JSON Parse error', async () => {
      const mockRedirect = new Response('Redirecting to /login...', {
        status: 307,
        headers: { 'content-type': 'text/plain' },
      })
      await expect(safeParseJsonResponse(mockRedirect)).rejects.toThrow(
        'Your session has expired. Please sign in again.'
      )
    })

    it('safely handles HTML error responses without throwing JSON Parse error', async () => {
      const mockHtmlResponse = new Response('<html><body>502 Bad Gateway</body></html>', {
        status: 502,
        headers: { 'content-type': 'text/html' },
      })
      await expect(safeParseJsonResponse(mockHtmlResponse)).rejects.toThrow(
        'Server encountered an error (502)'
      )
    })

    it('safely handles empty responses with application/json header', async () => {
      const emptyJsonResponse = new Response('', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
      await expect(safeParseJsonResponse(emptyJsonResponse)).rejects.toThrow(
        'Malformed JSON response from server (200).'
      )
    })
  })

  describe('createRecipeDirect & Rollback Atomicity', () => {
    const testFormData: RecipeFormData = {
      ...initialRecipeFormData,
      title: 'Hyderabadi Chicken Biryani',
      description: 'Fragrant basmati rice cooked with marinated chicken and saffron.',
      cuisine: 'Indian',
      category: 'Main Course',
      difficulty: 'hard',
      servings: '6',
      prepTime: '45',
      cookTime: '60',
      totalTime: '105',
      imageUrl: 'https://images.example.com/biryani.jpg',
      ingredients: [
        { id: '1', name: 'Basmati Rice', quantity: '500', unit: 'g', preparationNote: 'washed', isOptional: false },
        { id: '2', name: 'Chicken', quantity: '800', unit: 'g', preparationNote: 'cut into pieces', isOptional: false },
      ],
      instructions: [
        { id: '1', instruction: 'Marinate chicken with yogurt and spices.', timerDuration: '30' },
        { id: '2', instruction: 'Parboil rice with whole spices.', timerDuration: '8' },
      ],
      tags: ['Biryani', 'Festive'],
    }

    it('requires authenticated user session', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any)

      await expect(createRecipeDirect(testFormData)).rejects.toThrow('You must be signed in')
    })

    it('creates parent recipe, ingredients, instructions, tags, and version snapshot atomically', async () => {
      const mockUser = { id: 'chef-456' }
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser as any },
        error: null,
      } as any)

      const insertRecipeMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'recipe-biryani-uuid' }, error: null }),
        }),
      })

      const insertIngredientsMock = vi.fn().mockResolvedValue({ error: null })
      const insertInstructionsMock = vi.fn().mockResolvedValue({ error: null })
      const insertVersionsMock = vi.fn().mockResolvedValue({ error: null })

      const upsertTagsMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'tag-1' } }),
        }),
      })
      const insertRecipeTagsMock = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'recipes') {
          return { insert: insertRecipeMock } as any
        }
        if (table === 'recipe_ingredients') {
          return { insert: insertIngredientsMock } as any
        }
        if (table === 'recipe_instructions') {
          return { insert: insertInstructionsMock } as any
        }
        if (table === 'recipe_versions') {
          return { insert: insertVersionsMock } as any
        }
        if (table === 'tags') {
          return { upsert: upsertTagsMock } as any
        }
        if (table === 'recipe_tags') {
          return { insert: insertRecipeTagsMock } as any
        }
        return {} as any
      })

      const result = await createRecipeDirect(testFormData)

      expect(result).toEqual({ id: 'recipe-biryani-uuid' })
      expect(insertRecipeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'chef-456',
          title: 'Hyderabadi Chicken Biryani',
          total_time: 105,
        })
      )
      expect(insertIngredientsMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Basmati Rice', recipe_id: 'recipe-biryani-uuid' }),
          expect.objectContaining({ name: 'Chicken', recipe_id: 'recipe-biryani-uuid' }),
        ])
      )
      expect(insertInstructionsMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ step_number: 1, recipe_id: 'recipe-biryani-uuid' }),
        ])
      )
      expect(insertVersionsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          recipe_id: 'recipe-biryani-uuid',
          version_number: 1,
        })
      )
    })

    it('rolls back parent recipe by deleting it if child ingredients fail', async () => {
      const mockUser = { id: 'chef-456' }
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: mockUser as any },
        error: null,
      } as any)

      const deleteParentMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'recipes') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: { id: 'recipe-failed-uuid' }, error: null }),
              }),
            }),
            delete: deleteParentMock,
          } as any
        }
        if (table === 'recipe_ingredients') {
          return {
            insert: vi.fn().mockResolvedValue({ error: new Error('Postgres connection failed') }),
          } as any
        }
        return {} as any
      })

      await expect(createRecipeDirect(testFormData)).rejects.toThrow(
        'Postgres connection failed'
      )

      // Verified rollback: parent recipe was deleted to prevent orphaned records
      expect(deleteParentMock).toHaveBeenCalled()
    })
  })
})
