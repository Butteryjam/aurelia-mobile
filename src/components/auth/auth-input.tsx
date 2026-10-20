import React, { useState } from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  type TextInputProps,
} from 'react-native'
import { Eye, EyeOff } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

export interface AuthInputProps extends TextInputProps {
  label: string
  error?: string | null
  hint?: string
  isPassword?: boolean
}

export function AuthInput({
  label,
  error,
  hint,
  isPassword = false,
  style,
  ...rest
}: AuthInputProps) {
  const { colors, typography, radii, spacing } = useAureliaTheme()
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isSecure = isPassword && !showPassword

  const borderColor = error
    ? colors.destructive
    : isFocused
    ? colors.ring
    : colors.border

  return (
    <View style={styles.container}>
      <Text
        style={[
          typography.bodyMedium,
          styles.label,
          { color: error ? colors.destructive : colors.foreground },
        ]}
      >
        {label}
      </Text>

      <View
        style={[
          styles.inputWrapper,
          {
            borderColor,
            backgroundColor: colors.card,
            borderRadius: radii.control,
          },
          isFocused && styles.focusedWrapper,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            typography.body,
            { color: colors.foreground },
            isPassword && styles.inputWithToggle,
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={hint || undefined}
          aria-invalid={Boolean(error)}
          {...rest}
        />

        {isPassword && (
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={colors.mutedForeground} />
            ) : (
              <Eye size={18} color={colors.mutedForeground} />
            )}
          </Pressable>
        )}
      </View>

      {error ? (
        <Text
          style={[
            typography.caption,
            styles.helperText,
            { color: colors.destructive },
          ]}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      ) : hint ? (
        <Text
          style={[
            typography.caption,
            styles.helperText,
            { color: colors.mutedForeground },
          ]}
        >
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '500',
  },
  inputWrapper: {
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
  },
  focusedWrapper: {
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    paddingVertical: 0,
  },
  inputWithToggle: {
    paddingRight: 8,
  },
  toggleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helperText: {
    marginTop: 4,
  },
})
