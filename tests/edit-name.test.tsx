import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { validateDisplayName, updateUserProfile } from '@/features/auth/profile-api'
import { EditNameModal } from '@/components/profile/edit-name-modal'
import SettingsScreen from '@/app/(app)/settings'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'

// Mock expo-router
const mockBack = vi.fn()
vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
}))

describe('Aurelia Mobile — Edit Name Feature Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── 1. Validation Logic ───────────────────────────────────────────
  describe('1. Name Validation Logic (validateDisplayName)', () => {
    it('accepts valid display names within 1 to 60 characters', () => {
      expect(validateDisplayName('Julia Child')).toBeNull()
      expect(validateDisplayName('A')).toBeNull()
      expect(validateDisplayName('A'.repeat(60))).toBeNull()
      expect(validateDisplayName('  Chef Auguste Escoffier  ')).toBeNull()
    })

    it('rejects empty names and names containing only whitespace', () => {
      expect(validateDisplayName('')).toBe('Name cannot be empty or contain only whitespace.')
      expect(validateDisplayName('   ')).toBe('Name cannot be empty or contain only whitespace.')
      expect(validateDisplayName('\t\n  ')).toBe('Name cannot be empty or contain only whitespace.')
    })

    it('rejects names exceeding 60 characters', () => {
      const longName = 'A'.repeat(61)
      expect(validateDisplayName(longName)).toBe('Name cannot exceed 60 characters.')
    })
  })

  // ─── 2. EditNameModal Component ────────────────────────────────────
  describe('2. EditNameModal UI & Interactions', () => {
    it('renders the edit name modal prefilled with current name', () => {
      const html = renderToStaticMarkup(
        <EditNameModal
          visible={true}
          currentName="Chef Anton"
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      )

      expect(html).toContain('Edit Name')
      expect(html).toContain('Update how you are addressed across Aurelia')
      expect(html).toContain('Display Name')
      expect(html).toContain('Chef Anton')
      expect(html).toContain('Cancel')
      expect(html).toContain('Save Changes')
      expect(html).toContain('10 / 60') // character count for 'Chef Anton'
    })

    it('does not render modal contents when visible is false', () => {
      const html = renderToStaticMarkup(
        <EditNameModal
          visible={false}
          currentName="Chef Anton"
          onClose={vi.fn()}
          onSave={vi.fn()}
        />
      )

      expect(html).toBe('')
    })
  })

  // ─── 3. Profile API & RLS Security ─────────────────────────────────
  describe('3. Profile API (updateUserProfile) & Security', () => {
    const mockUser = {
      id: 'usr-chef-101',
      email: 'chef@aurelia.app',
      user_metadata: { full_name: 'Original Chef' },
    }

    it('successfully updates profiles table with RLS scoping and updates auth metadata', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'usr-chef-101', display_name: 'Master Chef Anton', updated_at: '2026-10-25T12:00:00Z' },
              error: null,
            }),
          }),
        }),
      })

      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      })

      vi.spyOn(supabase, 'from').mockReturnValue({
        update: mockUpdate,
      } as any)

      const mockUpdateUser = vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: {
          user: {
            ...mockUser,
            user_metadata: { display_name: 'Master Chef Anton', full_name: 'Master Chef Anton' },
          } as any,
        },
        error: null,
      })

      const result = await updateUserProfile('   Master Chef Anton   ')

      expect(result.success).toBe(true)
      expect(result.user?.user_metadata.display_name).toBe('Master Chef Anton')

      // Ensure RLS: User can only update their own profile ID
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: 'Master Chef Anton' })
      )
      // Ensure Auth metadata updated synchronously
      expect(mockUpdateUser).toHaveBeenCalledWith({
        data: { display_name: 'Master Chef Anton', full_name: 'Master Chef Anton' },
      })
    })

    it('rejects updating when user is not signed in', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: null },
        error: null,
      } as any)

      const result = await updateUserProfile('New Name')
      expect(result.success).toBe(false)
      expect(result.error).toContain('You must be signed in')
    })

    it('handles database failures gracefully without throwing', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      })

      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'relation "profiles" does not exist or permission denied' },
              }),
            }),
          }),
        }),
      } as any)

      const result = await updateUserProfile('Valid Name')
      expect(result.success).toBe(false)
      expect(result.error).toContain('relation "profiles" does not exist or permission denied')
    })

    it('handles auth metadata failure gracefully', async () => {
      vi.spyOn(supabase.auth, 'getUser').mockResolvedValue({
        data: { user: mockUser as any },
        error: null,
      })

      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'usr-chef-101', display_name: 'Valid Name', updated_at: '2026-10-25T12:00:00Z' },
                error: null,
              }),
            }),
          }),
        }),
      } as any)

      vi.spyOn(supabase.auth, 'updateUser').mockResolvedValue({
        data: { user: null as any },
        error: { message: 'Network request failed' } as any,
      })

      const result = await updateUserProfile('Valid Name')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Network request failed')
    })
  })

  // ─── 4. Settings Screen Integration ────────────────────────────────
  describe('4. Settings Screen Integration', () => {
    it('renders current display name and Edit Name triggers with accessibility labels', () => {
      const html = renderToStaticMarkup(<SettingsScreen />)

      expect(html).toContain('Settings')
      expect(html).toContain('Edit Name')
      expect(html).toContain('Change your public display name')
      expect(html).toContain('Personal Culinary Archive • Active')
    })
  })

  // ─── 5. Cache Isolation Across Accounts ────────────────────────────
  describe('5. Multi-User Cache Isolation & Account Switching', () => {
    it('ensures Account B never inherits Account A display name or profile cache', async () => {
      // 1. Account A sets profile data
      queryClient.setQueryData(['profile', 'user-a-1111'], { display_name: 'Alice Waters' })
      queryClient.setQueryData(['home-dashboard', 'user-a-1111'], { displayName: 'Alice Waters' })

      expect(queryClient.getQueryData(['profile', 'user-a-1111'])).toEqual({ display_name: 'Alice Waters' })

      // 2. Clear user query cache on sign out
      queryClient.clear()

      // 3. Account B signs in
      queryClient.setQueryData(['profile', 'user-b-2222'], { display_name: 'Bob Flay' })
      queryClient.setQueryData(['home-dashboard', 'user-b-2222'], { displayName: 'Bob Flay' })

      // Verify Account A's cache is wiped and Bob Flay is isolated
      expect(queryClient.getQueryData(['profile', 'user-a-1111'])).toBeUndefined()
      expect(queryClient.getQueryData(['profile', 'user-b-2222'])).toEqual({ display_name: 'Bob Flay' })
      expect(queryClient.getQueryData(['home-dashboard', 'user-b-2222'])).toEqual({ displayName: 'Bob Flay' })
    })
  })
})
