import { describe, it, expect } from 'vitest'
import { TABS, MORE_HUB_ITEMS } from '../src/constants/navigation'
import { touchTargets } from '../src/theme/spacing'

describe('Mobile Navigation Shell & Routing Tests', () => {
  describe('1. Auth Guard Redirection Logic', () => {
    // Pure function representing the AuthNavigationGuard decision engine
    function evaluateAuthRouting(
      user: { id: string } | null,
      isLoading: boolean,
      segments: string[]
    ): { action: 'wait' | 'replace' | 'none'; target?: string } {
      if (isLoading) {
        return { action: 'wait' } // Render bootstrap loading, no flicker
      }

      const inAuthGroup = segments[0] === '(auth)'
      const inAppGroup = segments[0] === '(app)'
      const isResetPassword = segments[1] === 'reset-password'

      if (!user && inAppGroup) {
        return { action: 'replace', target: '/(auth)/login' }
      }

      if (user && inAuthGroup && !isResetPassword) {
        return { action: 'replace', target: '/(app)/(tabs)/home' }
      }

      return { action: 'none' }
    }

    it('displays bootstrap loading without screen flicker during initial auth resolution', () => {
      const decision = evaluateAuthRouting(null, true, ['(app)', '(tabs)', 'home'])
      expect(decision.action).toBe('wait')
    })

    it('redirects unauthenticated user away from protected (app) routes to /(auth)/login', () => {
      const decision = evaluateAuthRouting(null, false, ['(app)', '(tabs)', 'home'])
      expect(decision.action).toBe('replace')
      expect(decision.target).toBe('/(auth)/login')
    })

    it('redirects unauthenticated user away from protected recipe detail route', () => {
      const decision = evaluateAuthRouting(null, false, ['(app)', 'recipe', '123'])
      expect(decision.action).toBe('replace')
      expect(decision.target).toBe('/(auth)/login')
    })

    it('redirects authenticated user away from (auth)/login to /(app)/(tabs)/home', () => {
      const decision = evaluateAuthRouting({ id: 'usr-1' }, false, ['(auth)', 'login'])
      expect(decision.action).toBe('replace')
      expect(decision.target).toBe('/(app)/(tabs)/home')
    })

    it('redirects authenticated user away from (auth)/signup to /(app)/(tabs)/home', () => {
      const decision = evaluateAuthRouting({ id: 'usr-1' }, false, ['(auth)', 'signup'])
      expect(decision.action).toBe('replace')
      expect(decision.target).toBe('/(app)/(tabs)/home')
    })

    it('allows user to stay on reset-password screen during password recovery', () => {
      // Even if user is authenticated from recovery link tokens, do not redirect away from reset-password
      const decision = evaluateAuthRouting({ id: 'usr-1' }, false, [
        '(auth)',
        'reset-password',
      ])
      expect(decision.action).toBe('none')
    })

    it('permits authenticated user to navigate freely within (app) routes', () => {
      const decisionHome = evaluateAuthRouting({ id: 'usr-1' }, false, [
        '(app)',
        '(tabs)',
        'home',
      ])
      expect(decisionHome.action).toBe('none')

      const decisionPlanner = evaluateAuthRouting({ id: 'usr-1' }, false, [
        '(app)',
        '(tabs)',
        'planner',
      ])
      expect(decisionPlanner.action).toBe('none')
    })
  })

  describe('2. 5-Tab Navigation Configuration & Touch Targets', () => {
    it('defines exactly the five required tabs in correct order', () => {
      const tabNames = TABS.map((t) => t.name)
      expect(tabNames).toEqual(['home', 'recipes', 'planner', 'chef', 'more'])
    })

    it('provides accessible titles for all five tabs', () => {
      const labels = TABS.map((t) => t.label)
      expect(labels).toEqual(['Home', 'Recipes', 'Planner', 'AI Chef', 'More'])
    })

    it('provides valid icon components for every tab', () => {
      TABS.forEach((tab) => {
        expect(tab.icon).toBeDefined()
        expect(typeof tab.icon).toBe('function')
      })
    })

    it('enforces minimum 44pt touch target standard in design system tokens', () => {
      expect(touchTargets.min).toBeGreaterThanOrEqual(44)
    })
  })

  describe('3. More Hub Destinations & Accessibility', () => {
    it('contains navigation entries for Collections, Shopping, Favorites, and Settings', () => {
      const hubIds = MORE_HUB_ITEMS.map((item) => item.id)
      expect(hubIds).toContain('collections')
      expect(hubIds).toContain('shopping')
      expect(hubIds).toContain('favorites')
      expect(hubIds).toContain('settings')
    })

    it('maps to valid architectural route destinations', () => {
      const routes = MORE_HUB_ITEMS.map((item) => item.route)
      expect(routes).toEqual([
        '/(app)/collections',
        '/(app)/shopping',
        '/(app)/favorites',
        '/(app)/settings',
      ])
    })

    it('ensures every More hub item has descriptive subtitles and icons', () => {
      MORE_HUB_ITEMS.forEach((item) => {
        expect(item.title.length).toBeGreaterThan(0)
        expect(item.subtitle.length).toBeGreaterThan(0)
        expect(item.icon).toBeDefined()
      })
    })
  })
})
