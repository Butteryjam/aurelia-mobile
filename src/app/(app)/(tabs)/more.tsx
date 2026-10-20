import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  FolderArchive,
  ShoppingCart,
  Heart,
  Settings,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useAuth } from '@/features/auth/auth-context'
import { MORE_HUB_ITEMS } from '@/constants/navigation'

export default function MoreTabScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()

  const handleSignOut = async () => {
    await signOut()
    router.replace('/(auth)/login')
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.eyebrow, { color: colors.primary }]}>
            Archive &amp; Utilities
          </Text>
          <Text style={[typography.pageTitle, { color: colors.foreground, marginTop: spacing.xs }]}>
            More
          </Text>
        </View>

        {/* User Account Card */}
        <View
          style={[
            styles.accountCard,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.base,
              marginTop: spacing.lg,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: colors.secondary, borderRadius: radii.pill },
            ]}
          >
            <UserIcon size={20} color={colors.primary} />
          </View>
          <View style={styles.accountInfo}>
            <Text style={[typography.cardTitle, { color: colors.foreground }]}>
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aurelia Member'}
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
              {user?.email ? `${user.email} · Personal Vault` : 'Personal Vault • Authenticated'}
            </Text>
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <Text
            style={[
              typography.eyebrow,
              { color: colors.mutedForeground, marginBottom: spacing.sm, marginLeft: 4 },
            ]}
          >
            Sanctuary Hub
          </Text>

          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
              },
            ]}
          >
            {MORE_HUB_ITEMS.map((item, index) => {
              const IconComp = item.icon
              const isLast = index === MORE_HUB_ITEMS.length - 1

              return (
                <Pressable
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    styles.menuRow,
                    pressed && { backgroundColor: colors.muted + '40' },
                    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.title}, ${item.subtitle}`}
                >
                  <View
                    style={[
                      styles.iconBadge,
                      { backgroundColor: colors.secondary, borderRadius: radii.small },
                    ]}
                  >
                    <IconComp size={18} color={colors.primary} />
                  </View>

                  <View style={styles.menuTextContainer}>
                    <Text style={[typography.bodyMedium, { color: colors.foreground, fontWeight: '600' }]}>
                      {item.title}
                    </Text>
                    <Text
                      style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}
                      numberOfLines={1}
                    >
                      {item.subtitle}
                    </Text>
                  </View>

                  <ChevronRight size={18} color={colors.mutedForeground} />
                </Pressable>
              )
            })}
          </View>
        </View>

        {/* Sign Out Action */}
        <View style={styles.signOutContainer}>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              {
                borderColor: colors.destructive + '40',
                backgroundColor: pressed ? colors.destructive + '10' : 'transparent',
                borderRadius: radii.control,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sign out of Aurelia"
          >
            <LogOut size={18} color={colors.destructive} style={{ marginRight: 8 }} />
            <Text style={[typography.bodyMedium, { color: colors.destructive, fontWeight: '600' }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 4,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountInfo: {
    flex: 1,
  },
  section: {
    marginTop: 28,
  },
  menuContainer: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTextContainer: {
    flex: 1,
  },
  signOutContainer: {
    marginTop: 32,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1.2,
  },
})
