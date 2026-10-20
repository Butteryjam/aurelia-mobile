/**
 * Aurelia Design System — Spacing, Elevation & Radii (Mobile)
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const

export const radii = {
  small: 8,     // Badges, small pills, inner tags
  control: 12,  // Inputs, buttons, dialogs, dropdowns
  card: 16,     // Recipe cards, outer sheets, hero containers
  pill: 9999,   // Avatars, circular action triggers
} as const

export const borderRadius = {
  sm: radii.small,
  md: radii.control,
  lg: radii.card,
  xl: 20,
  full: radii.pill,
} as const

export const touchTargets = {
  min: 44, // Minimum 44x44pt accessibility touch target requirement
} as const

export const shadows = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  dialog: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const
