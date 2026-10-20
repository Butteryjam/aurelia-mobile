/**
 * Aurelia Design System — Color Tokens (Mobile)
 *
 * Grounded in luxury culinary aesthetics:
 * Light: Creamy porcelain canvas, warm stone surfaces, terracotta accent, charcoal text.
 * Dark: Deep warm charcoals, muted amber & terracotta highlights.
 * Semantic: Restrained sage (success), warm amber (warning), muted terracotta (destructive).
 */

export interface ColorTheme {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  surface: string
  surfaceSubtle: string
  borderLight: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
}

const lightTheme: ColorTheme = {
  background: '#FAF7F2',       // Warm porcelain canvas
  foreground: '#231F1D',       // Deep espresso text
  card: '#F7F3ED',             // Warm stone card surface
  cardForeground: '#231F1D',
  popover: '#FAF7F2',
  popoverForeground: '#231F1D',
  primary: '#BA4A2E',          // Signature terracotta accent
  primaryForeground: '#FAF7F2',
  secondary: '#ECE5DC',        // Warm sand
  secondaryForeground: '#3D3531',
  muted: '#F0EBE3',            // Muted background
  mutedForeground: '#78716C',  // Warm stone gray
  accent: '#ECE5DC',
  accentForeground: '#3D3531',
  border: '#E8E1D7',           // Subtle warm border
  input: '#E8E1D7',
  ring: '#BA4A2E',
  destructive: '#C93B2B',      // Refined crimson/terracotta
  destructiveForeground: '#FFFFFF',
  success: '#47875E',          // Restrained sage green
  successForeground: '#FFFFFF',
  warning: '#C47C1E',          // Warm culinary amber
  warningForeground: '#231F1D',
  surface: '#F7F3ED',
  surfaceSubtle: '#F2ECE4',
  borderLight: '#E8E1D7',
  textPrimary: '#231F1D',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
}

const darkTheme: ColorTheme = {
  background: '#161311',       // Deep warm charcoal
  foreground: '#E9E5DE',       // Cream text
  card: '#1E1A17',             // Deep stone surface
  cardForeground: '#E9E5DE',
  popover: '#1E1A17',
  popoverForeground: '#E9E5DE',
  primary: '#C55D3F',          // Warm vibrant terracotta
  primaryForeground: '#161311',
  secondary: '#28231F',        // Dark sand surface
  secondaryForeground: '#D8D3CB',
  muted: '#25201C',
  mutedForeground: '#9E9790',
  accent: '#28231F',
  accentForeground: '#D8D3CB',
  border: '#2E2723',
  input: '#2E2723',
  ring: '#C55D3F',
  destructive: '#D44A3A',
  destructiveForeground: '#FFFFFF',
  success: '#539E6E',
  successForeground: '#FFFFFF',
  warning: '#D48C28',
  warningForeground: '#161311',
  surface: '#1E1A17',
  surfaceSubtle: '#25201C',
  borderLight: '#2E2723',
  textPrimary: '#E9E5DE',
  textSecondary: '#C5BFB7',
  textTertiary: '#9E9790',
}

export const colors: { light: ColorTheme; dark: ColorTheme } & ColorTheme = Object.assign(
  {},
  lightTheme,
  {
    light: lightTheme,
    dark: darkTheme,
  }
)

