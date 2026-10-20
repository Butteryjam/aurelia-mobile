import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

export interface AuthAlertProps {
  type?: 'error' | 'success' | 'info'
  message: string
}

export function AuthAlert({ type = 'error', message }: AuthAlertProps) {
  const { colors, typography, radii } = useAureliaTheme()

  if (!message) return null

  const isError = type === 'error'
  const isSuccess = type === 'success'

  const bgColor = isError
    ? colors.destructive + '15'
    : isSuccess
    ? colors.success + '15'
    : colors.primary + '15'

  const borderColor = isError
    ? colors.destructive + '40'
    : isSuccess
    ? colors.success + '40'
    : colors.primary + '40'

  const textColor = isError
    ? colors.destructive
    : isSuccess
    ? colors.success
    : colors.primary

  const IconComponent = isError ? AlertCircle : isSuccess ? CheckCircle2 : Info

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor,
          borderRadius: radii.control,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <IconComponent size={18} color={textColor} style={styles.icon} />
      <Text style={[typography.body, styles.text, { color: textColor }]}>
        {message}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },
  icon: {
    marginRight: 10,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
})
