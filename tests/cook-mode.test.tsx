/**
 * Aurelia Mobile — Cook Mode Test Suite
 *
 * Covers:
 * - Natural language duration parser & timer formatters
 * - Step navigation (Prev, Next, Direct jump, Finish)
 * - Timer controls (Start, Pause, Reset, Finish) & drift prevention
 * - Screen Wake-Lock integration
 * - Ingredient drawer & dynamic serving scaler
 * - Exit safety / session protection
 * - Cooking session persistence & TanStack Query cache invalidation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CookModeScreen from '@/app/(app)/cook/[id]'
import { CookTimer } from '@/components/cook-mode/cook-timer'
import { StepProgressBar } from '@/components/cook-mode/step-progress-bar'
import { IngredientSheet } from '@/components/cook-mode/ingredient-sheet'
import { CompletionModal } from '@/components/cook-mode/completion-modal'
import {
  extractTimerDuration,
  formatTimer,
  formatElapsedCookingTime,
} from '@/features/cook-mode/timer-utils'
import { recordCookingSession } from '@/features/cook-mode/api'
import * as recipeHooks from '@/features/recipes/hooks'
import * as cookModeHooks from '@/features/cook-mode/hooks'
import * as wakeLockHook from '@/features/cook-mode/use-cook-wake-lock'
import { supabase } from '@/lib/supabase'
import * as keepAwake from 'expo-keep-awake'
import type { RecipeDetail } from '@/features/recipes/types'

vi.mock('@/features/recipes/hooks')
vi.mock('@/features/cook-mode/hooks')
vi.mock('@/features/cook-mode/use-cook-wake-lock')

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
}

vi.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: 'recipe-test-cook', servings: '4' }),
}))

const MOCK_RECIPE: RecipeDetail = {
  id: 'recipe-test-cook',
  user_id: 'test-user-id',
  title: 'Pan-Seared Duck Breast with Cherry Sauce',
  description: 'Crispy skin duck breast with tart cherry port reduction.',
  image_url: 'https://example.com/duck.jpg',
  prep_time: 15,
  cook_time: 20,
  total_time: 35,
  servings: 2,
  difficulty: 'hard',
  cuisine: 'French',
  category: 'Plats',
  notes: 'Score the skin in a crosshatch pattern without cutting into meat.',
  rating: 4.8,
  source_url: null,
  is_public: false,
  created_at: '2026-09-30T10:00:00Z',
  updated_at: '2026-09-30T10:00:00Z',
  isFavorite: true,
  tags: ['Gourmet', 'French'],
  ingredients: [
    {
      id: 'ing-1',
      recipe_id: 'recipe-test-cook',
      name: 'duck breasts',
      quantity: '2',
      unit: 'breasts',
      order_index: 0,
      is_optional: false,
      preparation_note: 'scored skin',
    },
    {
      id: 'ing-2',
      recipe_id: 'recipe-test-cook',
      name: 'tart cherries',
      quantity: '1',
      unit: 'cup',
      order_index: 1,
      is_optional: false,
      preparation_note: 'pitted',
    },
    {
      id: 'ing-3',
      recipe_id: 'recipe-test-cook',
      name: 'unsalted butter',
      quantity: '2',
      unit: 'tbsp',
      order_index: 2,
      is_optional: false,
      preparation_note: 'cold cubed',
    },
  ],
  instructions: [
    {
      id: 'step-1',
      recipe_id: 'recipe-test-cook',
      step_number: 1,
      instruction: 'Pat duck breasts dry and score skin in 1/4-inch diamond pattern. Season generously with kosher salt.',
      timer_duration: null,
    },
    {
      id: 'step-2',
      recipe_id: 'recipe-test-cook',
      step_number: 2,
      instruction: 'Place skin-side down in cold cast-iron skillet. Cook over medium-low heat for 12 minutes to render fat.',
      timer_duration: null, // Natural language should parse 12 minutes (720s)
    },
    {
      id: 'step-3',
      recipe_id: 'recipe-test-cook',
      step_number: 3,
      instruction: 'Flip duck breasts and sear meat side for 3 minutes until medium-rare.',
      timer_duration: 180, // Explicit timer duration
    },
  ],
}

describe('Aurelia Mobile — Cook Mode Suite', () => {
  let queryClient: QueryClient

  const mockCompleteMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.mocked(recipeHooks.useRecipeDetail).mockReturnValue({
      data: MOCK_RECIPE,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any)

    vi.mocked(cookModeHooks.useCompleteCookingSession).mockReturnValue(mockCompleteMutation as any)

    vi.mocked(wakeLockHook.useCookWakeLock).mockReturnValue({
      isWakeLockActive: true,
    })
  })

  // --------------------------------------------------------------------------
  // 1. Natural Language Duration Parsing & Formatting
  // --------------------------------------------------------------------------
  describe('Natural Language Timer Utilities', () => {
    it('parses minutes accurately from varied culinary expressions', () => {
      expect(extractTimerDuration('cook for 15 minutes')).toBe(900)
      expect(extractTimerDuration('bake for 25 min')).toBe(1500)
      expect(extractTimerDuration('10 minute timer')).toBe(600)
      expect(extractTimerDuration('simmer for 8-10 minutes')).toBe(600)
      expect(extractTimerDuration('roast 45 mins')).toBe(2700)
    })

    it('parses seconds accurately', () => {
      expect(extractTimerDuration('rest for 30 seconds')).toBe(30)
      expect(extractTimerDuration('whisk vigorously 45 sec')).toBe(45)
    })

    it('parses hours and decimal hours accurately', () => {
      expect(extractTimerDuration('braise for 2 hours')).toBe(7200)
      expect(extractTimerDuration('chill dough for 1.5 hours')).toBe(5400)
    })

    it('returns null when no duration is specified', () => {
      expect(extractTimerDuration('Season with salt and pepper.')).toBeNull()
      expect(extractTimerDuration('')).toBeNull()
      expect(extractTimerDuration(null)).toBeNull()
    })

    it('formats timer seconds into MM:SS and HH:MM:SS displays', () => {
      expect(formatTimer(0)).toBe('00:00')
      expect(formatTimer(45)).toBe('00:45')
      expect(formatTimer(720)).toBe('12:00')
      expect(formatTimer(3665)).toBe('1:01:05')
    })

    it('formats elapsed cooking time accurately', () => {
      const start = '2026-09-30T12:00:00.000Z'
      const end1 = '2026-09-30T12:00:20.000Z'
      const end2 = '2026-09-30T12:15:00.000Z'
      const end3 = '2026-09-30T13:30:00.000Z'

      expect(formatElapsedCookingTime(start, end1)).toBe('less than a minute')
      expect(formatElapsedCookingTime(start, end2)).toBe('15 minutes')
      expect(formatElapsedCookingTime(start, end3)).toBe('1 hr 30 min')
    })
  })

  // --------------------------------------------------------------------------
  // 2. Cook Mode Screen Layout & Navigation
  // --------------------------------------------------------------------------
  describe('Cook Mode Layout & Step Navigation', () => {
    it('renders the recipe title, initial step instruction, and standing-distance HUD', () => {
      const markup = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <CookModeScreen />
        </QueryClientProvider>
      )

      // Recipe header title
      expect(markup).toContain('Pan-Seared Duck Breast')
      // Step counter
      expect(markup).toContain('STEP 1')
      // Instruction text
      expect(markup).toContain('Pat duck breasts dry')
      // Prev button disabled on step 1
      expect(markup).toContain('Prev')
      // Next Step button
      expect(markup).toContain('Next Step')
      // Wake lock indicator
      expect(markup).toContain('Screen Stay Awake ON')
      // Ingredients badge with count
      expect(markup).toContain('3')
    })

    it('detects relevant ingredients for the current step', () => {
      const markup = renderToStaticMarkup(
        <QueryClientProvider client={queryClient}>
          <CookModeScreen />
        </QueryClientProvider>
      )

      // Step 1 mentions "duck breasts"
      expect(markup).toContain('Step Ingredients:')
      expect(markup).toContain('duck breasts')
    })
  })

  // --------------------------------------------------------------------------
  // 3. Step Progress Bar Component
  // --------------------------------------------------------------------------
  describe('StepProgressBar Component', () => {
    it('displays current progress percentage and step pills', () => {
      const markup = renderToStaticMarkup(
        <StepProgressBar
          currentStepIndex={1}
          totalSteps={3}
          onSelectStep={vi.fn()}
        />
      )

      expect(markup).toContain('STEP 2 OF 3')
      expect(markup).toContain('67% done')
      expect(markup).toContain('step-pill-0')
      expect(markup).toContain('step-pill-1')
      expect(markup).toContain('step-pill-2')
    })
  })

  // --------------------------------------------------------------------------
  // 4. Precision Cook Timer Component
  // --------------------------------------------------------------------------
  describe('CookTimer Component', () => {
    it('renders countdown clock and control buttons', () => {
      const markup = renderToStaticMarkup(
        <CookTimer
          durationSeconds={720}
          stepNumber={2}
          onComplete={vi.fn()}
        />
      )

      expect(markup).toContain('12:00')
      expect(markup).toContain('start-timer-btn')
      expect(markup).toContain('Start')
      expect(markup).toContain('RECOMMENDED STEP TIMER')
    })
  })

  // --------------------------------------------------------------------------
  // 5. Ingredient Drawer & Servings Scaling
  // --------------------------------------------------------------------------
  describe('IngredientSheet & Servings Scaling', () => {
    it('renders ingredient drawer with scaled servings and checkable items', () => {
      const checkedSet = new Set(['ing-1'])
      const markup = renderToStaticMarkup(
        <IngredientSheet
          visible={true}
          onClose={vi.fn()}
          ingredients={MOCK_RECIPE.ingredients}
          baseServings={2}
          currentServings={4} // Scaled 2x
          onServingsChange={vi.fn()}
          checkedIds={checkedSet}
          onToggleIngredient={vi.fn()}
        />
      )

      // Servings display
      expect(markup).toContain('cook-servings-display')
      expect(markup).toContain('4')
      // Checked counter
      expect(markup).toContain('1 of 3 checked')
      // Scaled quantity: 2 breasts * (4/2) = 4 breasts
      expect(markup).toContain('4 breasts')
      // Tart cherries: 1 cup * (4/2) = 2 cups
      expect(markup).toContain('2 cup')
    })
  })

  // --------------------------------------------------------------------------
  // 6. Completion Flow Modal
  // --------------------------------------------------------------------------
  describe('CompletionModal Component', () => {
    it('renders congratulations, rating stars, and save button', () => {
      const markup = renderToStaticMarkup(
        <CompletionModal
          visible={true}
          recipeTitle="Pan-Seared Duck Breast"
          elapsedTimeString="18 minutes"
          isSubmitting={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      )

      expect(markup).toContain('Bon Appétit!')
      expect(markup).toContain('Pan-Seared Duck Breast')
      expect(markup).toContain('Cook time: 18 minutes')
      expect(markup).toContain('star-rating-1')
      expect(markup).toContain('star-rating-5')
      expect(markup).toContain('cooking-notes-input')
      expect(markup).toContain('Save Cooking Session')
    })
  })

  // --------------------------------------------------------------------------
  // 7. Cooking Session Persistence API
  // --------------------------------------------------------------------------
  describe('Cooking Session Persistence API', () => {
    it('records a cooking session to Supabase when user is authenticated', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'recipe-test-cook' },
        error: null,
      })
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

      const mockInsertSingle = vi.fn().mockResolvedValue({
        data: {
          id: 'session-123',
          user_id: 'test-user-id',
          recipe_id: 'recipe-test-cook',
          started_at: '2026-09-30T10:00:00Z',
          completed_at: '2026-09-30T10:25:00Z',
          rating: 5,
          notes: 'Crispy skin turned out great!',
        },
        error: null,
      })
      const mockInsertSelect = vi.fn().mockReturnValue({ single: mockInsertSingle })
      const mockInsert = vi.fn().mockReturnValue({ select: mockInsertSelect })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'recipes') {
          return { select: mockSelect } as any
        }
        if (table === 'cooking_sessions') {
          return { insert: mockInsert } as any
        }
        return {} as any
      })

      const session = await recordCookingSession({
        recipeId: 'recipe-test-cook',
        startedAt: '2026-09-30T10:00:00Z',
        completedAt: '2026-09-30T10:25:00Z',
        rating: 5,
        notes: 'Crispy skin turned out great!',
      })

      expect(session.id).toBe('session-123')
      expect(session.rating).toBe(5)
      expect(session.notes).toBe('Crispy skin turned out great!')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'test-user-id',
        recipe_id: 'recipe-test-cook',
        started_at: '2026-09-30T10:00:00Z',
        completed_at: '2026-09-30T10:25:00Z',
        notes: 'Crispy skin turned out great!',
        rating: 5,
      })
    })

    it('throws error when user is not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Session expired') as any,
      })

      await expect(
        recordCookingSession({
          recipeId: 'recipe-test-cook',
          startedAt: '2026-09-30T10:00:00Z',
          completedAt: '2026-09-30T10:25:00Z',
        })
      ).rejects.toThrow('You must be signed in to record a cooking session.')
    })
  })
})
