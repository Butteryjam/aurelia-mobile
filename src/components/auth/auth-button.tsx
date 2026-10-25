import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native'
import { useAureliaTheme } from '@/theme'

export interface AuthButtonProps {
  title: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  icon?: React.ReactNode
  style?: ViewStyle
  textStyle?: TextStyle
  accessibilityLabel?: string
}

export function AuthButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
  style,
  textStyle,
  accessibilityLabel,
}: AuthButtonProps) {
  const { colors, typography, radii } = useAureliaTheme()

  const isDisabled = disabled || loading

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let base: ViewStyle = {
      minHeight: 48,
      borderRadius: radii.control,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      opacity: isDisabled ? 0.6 : pressed ? 0.88 : 1,
    }

    if (variant === 'primary') {
      base.backgroundColor = colors.primary
    } else if (variant === 'secondary') {
      base.backgroundColor = colors.secondary
    } else if (variant === 'outline') {
      base.backgroundColor = 'transparent'
      base.borderWidth = 1.2
      base.borderColor = colors.border
    } else if (variant === 'ghost') {
      base.backgroundColor = 'transparent'
    }

    return base
  }

  const getTextColor = (): string => {
    if (variant === 'primary') return colors.primaryForeground
    if (variant === 'secondary') return colors.secondaryForeground
    if (variant === 'outline') return colors.foreground
    return colors.primary
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [getContainerStyle(pressed), style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{
        busy: loading,
        disabled: isDisabled,
      }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.primaryForeground : colors.primary}
        />
      ) : icon ? (
        <View style={styles.contentRow}>
          {icon}
          <Text
            style={[
              typography.bodyMedium,
              styles.text,
              { color: getTextColor() },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            typography.bodyMedium,
            styles.text,
            { color: getTextColor() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    fontWeight: '600',
    fontSize: 15,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
})
