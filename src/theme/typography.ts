import { TextStyle } from 'react-native'

/**
 * Aurelia Typography Tokens (Mobile)
 *
 * Pairings:
 * - Editorial Serif: Playfair Display (Titles, Hero displays, Screen headers)
 * - Modern Sans: DM Sans (UI Controls, Ingredients, Steps, Metadata)
 */

export const fontFamilies = {
  serifBold: 'PlayfairDisplay_700Bold',
  serifSemiBold: 'PlayfairDisplay_600SemiBold',
  serifRegular: 'PlayfairDisplay_400Regular',
  serif: 'PlayfairDisplay_600SemiBold',
  sansRegular: 'DMSans_400Regular',
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  sans: 'DMSans_400Regular',
} as const

export const typography = {
  // Editorial Display Headings
  display: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  pageTitle: {
    fontFamily: fontFamilies.serifBold,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.3,
  } as TextStyle,
  sectionTitle: {
    fontFamily: fontFamilies.serifSemiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.2,
  } as TextStyle,

  // Interface & Content
  cardTitle: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  bodyLarge: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontFamily: fontFamilies.sansRegular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  eyebrow: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  } as TextStyle,
  meta: {
    fontFamily: fontFamilies.sansMedium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,

  // Cook Mode — Standing-Distance Legibility
  cookModeStep: {
    fontFamily: fontFamilies.sansBold,
    fontSize: 24,
    lineHeight: 34,
    letterSpacing: -0.2,
  } as TextStyle,

  // Font family string conveniences
  serif: fontFamilies.serifBold,
  serifBold: fontFamilies.serifBold,
  serifSemiBold: fontFamilies.serifSemiBold,
  serifRegular: fontFamilies.serifRegular,
  sans: fontFamilies.sansRegular,
  sansMedium: fontFamilies.sansMedium,
  sansBold: fontFamilies.sansBold,
} as const
