import React from 'react'
import { StyleSheet, View, Text, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { ArrowLeft, Construction } from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'

interface PlaceholderScreenProps {
  title: string
  subtitle?: string
  routePath: string
  phaseNote?: string
}

export function PlaceholderScreen({
  title,
  subtitle,
  routePath,
  phaseNote = 'Phase B Architectural Route Placeholder',
}: PlaceholderScreenProps) {
  const router = useRouter()
  const { colors, typography, spacing, radii } = useAureliaTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace('/(app)/(tabs)/home')
            }
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.foreground} />
          <Text style={[typography.bodyMedium, { color: colors.foreground, marginLeft: 8 }]}>
            Back
          </Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={[typography.eyebrow, { color: colors.primary }]}>
            {phaseNote}
          </Text>
          <Text style={[typography.pageTitle, { color: colors.foreground, marginTop: spacing.xs }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.xs }]}>
              {subtitle}
            </Text>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.base,
              marginTop: spacing.xl,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Construction size={20} color={colors.primary} />
            <Text style={[typography.cardTitle, { color: colors.foreground, marginLeft: 8 }]}>
              Route Destination Verified
            </Text>
          </View>
          <Text style={[typography.body, { color: colors.mutedForeground, marginTop: spacing.sm }]}>
            This screen verifies that deep navigation and stack transitions resolve correctly to {routePath}. Detailed feature UI will be introduced in subsequent phases.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: 20,
  },
  header: {
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
