import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const { colors, typography, spacing, radii } = useAureliaTheme()

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.card,
          padding: spacing.xl,
        },
      ]}
      accessibilityLabel={title}
    >
      {Icon ? (
        <View
          style={[
            styles.iconBadge,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.pill,
              marginBottom: spacing.base,
            },
          ]}
        >
          <Icon size={28} color={colors.primary} />
        </View>
      ) : null}

      <Text
        style={[
          typography.cardTitle,
          {
            color: colors.foreground,
            textAlign: 'center',
            fontSize: 19,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          typography.body,
          {
            color: colors.mutedForeground,
            textAlign: 'center',
            fontSize: 14,
            lineHeight: 20,
            maxWidth: 280,
            marginBottom: actionLabel ? spacing.lg : 0,
          },
        ]}
      >
        {description}
      </Text>

      {(actionLabel || secondaryActionLabel) && (
        <View style={styles.actionRow}>
          {secondaryActionLabel && onSecondaryAction && (
            <Pressable
              onPress={onSecondaryAction}
              style={({ pressed }) => [
                styles.button,
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  backgroundColor: pressed ? colors.muted : colors.card,
                  borderRadius: radii.control,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={secondaryActionLabel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.foreground, fontSize: 13, fontWeight: '600' },
                ]}
              >
                {secondaryActionLabel}
              </Text>
            </Pressable>
          )}

          {actionLabel && onAction && (
            <Pressable
              onPress={onAction}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.primary,
                  borderRadius: radii.control,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={actionLabel}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  typography.bodyMedium,
                  { color: colors.primaryForeground, fontSize: 13, fontWeight: '600' },
                ]}
              >
                {actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  iconBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    borderWidth: 1,
  },
})
