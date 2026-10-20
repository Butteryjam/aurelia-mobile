import { colors, type ColorTheme } from './colors'
import { typography, fontFamilies } from './typography'
import { spacing, radii, touchTargets, shadows } from './spacing'
import { useThemeMode } from './theme-context'

export * from './colors'
export * from './typography'
export * from './spacing'
export * from './theme-context'

export function useAureliaTheme() {
  const { isDark } = useThemeMode()
  const activeColors: ColorTheme = isDark ? colors.dark : colors.light

  return {
    colors: activeColors,
    isDark,
    typography,
    fontFamilies,
    spacing,
    radii,
    touchTargets,
    shadows,
  }
}

