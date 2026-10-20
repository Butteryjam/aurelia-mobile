/**
 * Aurelia Auth Header — Editorial Brand Treatment
 *
 * Displays the Aurelia wordmark (serif), an eyebrow context label,
 * a serif page title, and an optional subtitle. Aligned with the
 * premium editorial aesthetic of the web sign-in page.
 */

import React from 'react'
import { StyleSheet, Text, View, Pressable } from 'react-native'
import { ArrowLeft } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

export interface AuthHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  onBack?: () => void
}

export function AuthHeader({
  eyebrow = 'Aurelia • Culinary Archive',
  title,
  subtitle,
  onBack,
}: AuthHeaderProps) {
  const { colors, typography, spacing } = useAureliaTheme()

  return (
    <View style={styles.container}>
      {onBack && (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            { opacity: pressed ? 0.6 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
      )}

      {/* Serif Wordmark */}
      <Text
        style={[
          typography.display,
          styles.wordmark,
          { color: colors.primary },
        ]}
        accessibilityRole="header"
        aria-level={1}
      >
        Aurelia
      </Text>

      {/* Thin rule */}
      <View style={[styles.rule, { backgroundColor: colors.border }]} />

      {eyebrow && (
        <Text style={[typography.eyebrow, { color: colors.mutedForeground, marginBottom: spacing.sm }]}>
          {eyebrow}
        </Text>
      )}

      <Text style={[typography.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>

      {subtitle && (
        <Text
          style={[
            typography.body,
            { color: colors.mutedForeground, marginTop: spacing.xs, lineHeight: 22 },
          ]}
        >
          {subtitle}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -10,
    marginBottom: 8,
  },
  wordmark: {
    fontSize: 36,
    letterSpacing: -1,
    marginBottom: 12,
  },
  rule: {
    height: 1,
    width: 40,
    marginBottom: 16,
  },
})
