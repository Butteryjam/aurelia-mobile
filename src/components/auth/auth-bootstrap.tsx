import React from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { useAureliaTheme } from '@/theme'

export function AuthBootstrapScreen() {
  const { colors, typography, spacing } = useAureliaTheme()

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading Aurelia application, please wait"
    >
      <View style={styles.content}>
        <Text style={[typography.eyebrow, { color: colors.primary, marginBottom: spacing.xs }]}>
          Culinary Archive
        </Text>
        <Text style={[typography.display, { color: colors.foreground }]}>
          Aurelia
        </Text>
        <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.sm }]}>
          Preparing your culinary sanctuary...
        </Text>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={[styles.spinner, { marginTop: spacing.xxl }]}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    transform: [{ scale: 1.1 }],
  },
})
