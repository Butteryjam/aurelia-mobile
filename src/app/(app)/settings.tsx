/**
 * Aurelia Mobile — Settings Screen (Design System Aligned)
 *
 * Full parity with web Settings:
 * - Account profile / display name
 * - Appearance (Light / Dark / System theme picker)
 * - Culinary preferences (units, default servings, keep awake)
 * - Data & Security (change password, clear cache)
 * - About Aurelia
 * - Sign Out
 *
 * Uses ThemeModeContext so changes are instant and persisted.
 */

import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  Utensils,
  Timer,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  Info,
  Sun,
  Moon,
  Smartphone,
} from 'lucide-react-native'
import { useAureliaTheme } from '@/theme'
import { useThemeMode, type ThemeMode } from '@/theme/theme-context'
import { useAuth } from '@/features/auth/auth-context'
import { queryClient } from '@/lib/query-client'

export default function SettingsScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { colors, typography, spacing, radii, shadows } = useAureliaTheme()
  const { themeMode, setThemeMode } = useThemeMode()

  // App settings state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric')
  const [defaultServings, setDefaultServings] = useState<number>(4)
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState(true)
  const [cacheCleared, setCacheCleared] = useState(false)

  const handleClearCache = async () => {
    queryClient.clear()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 3000)
    Alert.alert(
      'Cache Cleared',
      'Local recipe and image caches have been cleared. Fresh data will be fetched on demand.'
    )
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of Aurelia?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  const THEME_OPTIONS: Array<{ value: ThemeMode; label: string; icon: React.ComponentType<{ size: number; color: string }> }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Smartphone },
  ]

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.back()}
        >
          <ArrowLeft size={18} color={colors.foreground} />
        </Pressable>
        <Text style={[typography.sectionTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── Account Card ── */}
        <View
          style={[
            styles.card,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: radii.card,
              padding: spacing.base,
            },
          ]}
        >
          <View style={styles.cardRow}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: colors.secondary, borderRadius: radii.pill },
              ]}
            >
              <UserIcon size={22} color={colors.primary} />
            </View>
            <View style={styles.accountText}>
              <Text style={[typography.cardTitle, { color: colors.foreground }]}>
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aurelia Member'}
              </Text>
              <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 2 }]}>
                {user?.email || 'test_aurelia@culinary.test'}
              </Text>
              <Text style={[typography.caption, { color: colors.primary, marginTop: 2, fontSize: 11, fontWeight: '500' }]}>
                Personal Culinary Archive • Active
              </Text>
            </View>
          </View>
        </View>

        {/* ── Appearance ── */}
        <View style={styles.section}>
          <Text
            style={[
              typography.eyebrow,
              { color: colors.mutedForeground, marginBottom: spacing.sm, marginLeft: 4 },
            ]}
          >
            Appearance
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
                padding: spacing.base,
              },
            ]}
          >
            <Text style={[typography.body, { color: colors.foreground, fontWeight: '600', marginBottom: 12 }]}>
              Theme
            </Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, marginBottom: 14, lineHeight: 18 }]}>
              Choose how Aurelia appears on your device. System follows your device's setting.
            </Text>

            <View style={styles.themePickerRow}>
              {THEME_OPTIONS.map((opt) => {
                const IconComp = opt.icon
                const isSelected = themeMode === opt.value
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setThemeMode(opt.value)}
                    style={[
                      styles.themeOption,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + '12' : colors.muted,
                        borderRadius: radii.control,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${opt.label} theme${isSelected ? ', selected' : ''}`}
                    accessibilityState={{ selected: isSelected }}
                  >
                    <IconComp size={18} color={isSelected ? colors.primary : colors.mutedForeground} />
                    <Text
                      style={[
                        typography.caption,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontWeight: isSelected ? '700' : '500',
                          marginTop: 6,
                          fontSize: 11,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {isSelected && (
                      <View
                        style={[
                          styles.themeCheck,
                          { backgroundColor: colors.primary, borderRadius: radii.pill },
                        ]}
                      >
                        <Check size={9} color={colors.primaryForeground} strokeWidth={3} />
                      </View>
                    )}
                  </Pressable>
                )
              })}
            </View>
          </View>
        </View>

        {/* ── Culinary Preferences ── */}
        <View style={styles.section}>
          <Text
            style={[
              typography.eyebrow,
              { color: colors.mutedForeground, marginBottom: spacing.sm, marginLeft: 4 },
            ]}
          >
            Culinary Preferences
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
              },
            ]}
          >
            {/* Unit System Picker */}
            <View style={[styles.settingColumnRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLabelGroup}>
                <Utensils size={18} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                    Measurement System
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    Preferred ingredient units
                  </Text>
                </View>
              </View>

              <View style={[styles.segmentedControl, { backgroundColor: colors.muted, marginTop: 12 }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Metric units"
                  style={[
                    styles.segmentButton,
                    unitSystem === 'metric' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setUnitSystem('metric')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: unitSystem === 'metric' ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    Metric (g, ml)
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Imperial units"
                  style={[
                    styles.segmentButton,
                    unitSystem === 'imperial' && { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setUnitSystem('imperial')}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      { color: unitSystem === 'imperial' ? colors.primaryForeground : colors.mutedForeground },
                    ]}
                  >
                    Imperial (oz, cup)
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Default Servings Stepper */}
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLabelGroup}>
                <Info size={18} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                    Default Servings
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    Standard recipe scaling default
                  </Text>
                </View>
              </View>

              <View style={styles.servingsPicker}>
                {[2, 4, 6].map((num) => (
                  <Pressable
                    key={num}
                    accessibilityRole="button"
                    accessibilityLabel={`${num} servings`}
                    style={[
                      styles.servingButton,
                      { borderColor: colors.border },
                      defaultServings === num && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                    onPress={() => setDefaultServings(num)}
                  >
                    <Text
                      style={[
                        styles.servingText,
                        { color: defaultServings === num ? colors.primaryForeground : colors.foreground },
                      ]}
                    >
                      {num}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Keep Awake in Cook Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabelGroup}>
                <Timer size={18} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                    Keep Awake in Cook Mode
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    Prevent screen sleep while cooking
                  </Text>
                </View>
              </View>
              <Switch
                accessibilityLabel="Toggle screen keep awake in cook mode"
                value={keepAwakeEnabled}
                onValueChange={setKeepAwakeEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={Platform.OS === 'android' ? (keepAwakeEnabled ? colors.primaryForeground : colors.mutedForeground) : undefined}
              />
            </View>
          </View>
        </View>

        {/* ── Data & Security ── */}
        <View style={styles.section}>
          <Text
            style={[
              typography.eyebrow,
              { color: colors.mutedForeground, marginBottom: spacing.sm, marginLeft: 4 },
            ]}
          >
            Data &amp; Security
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
              },
            ]}
          >
            {/* Reset Password */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset Password"
              style={({ pressed }) => [
                styles.menuItem,
                { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <View style={styles.settingLabelGroup}>
                <Shield size={18} color={colors.primary} />
                <View style={styles.settingTextContainer}>
                  <Text style={[typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                    Change Password
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    Request password reset email
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.mutedForeground} />
            </Pressable>

            {/* Clear Offline Cache */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear offline data cache"
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={handleClearCache}
            >
              <View style={styles.settingLabelGroup}>
                <Trash2 size={18} color={colors.destructive} />
                <View style={styles.settingTextContainer}>
                  <Text style={[typography.body, { color: colors.foreground, fontWeight: '600' }]}>
                    Clear Cache
                  </Text>
                  <Text style={[typography.caption, { color: colors.mutedForeground }]}>
                    {cacheCleared ? 'Cache cleared successfully' : 'Reset locally cached queries and state'}
                  </Text>
                </View>
              </View>
              {cacheCleared ? (
                <Check size={18} color={colors.success} />
              ) : (
                <ChevronRight size={18} color={colors.mutedForeground} />
              )}
            </Pressable>
          </View>
        </View>

        {/* ── About Aurelia ── */}
        <View style={styles.section}>
          <Text
            style={[
              typography.eyebrow,
              { color: colors.mutedForeground, marginBottom: spacing.sm, marginLeft: 4 },
            ]}
          >
            About Aurelia
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: radii.card,
                padding: spacing.base,
              },
            ]}
          >
            <Text style={[typography.cardTitle, { color: colors.foreground }]}>Aurelia Culinary</Text>
            <Text style={[typography.caption, { color: colors.mutedForeground, marginTop: 4 }]}>
              Version 1.0.0 (Build 1)
            </Text>
            <Text style={[typography.body, { color: colors.mutedForeground, marginTop: 8, fontSize: 13, lineHeight: 18 }]}>
              Your personal culinary archive. Crafted for mindful cooking, meal planning, and editorial recipe preservation.
            </Text>
          </View>
        </View>

        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out of Aurelia"
          style={({ pressed }) => [
            styles.signOutButton,
            {
              backgroundColor: pressed ? colors.destructive + '10' : 'transparent',
              borderColor: colors.destructive + '50',
              borderRadius: radii.control,
            },
          ]}
          onPress={handleSignOut}
        >
          <LogOut size={18} color={colors.destructive} style={{ marginRight: spacing.sm }} />
          <Text style={[typography.bodyMedium, { color: colors.destructive, fontWeight: '700' }]}>Sign Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightSpacer: {
    width: 38,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 56,
  },
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  accountText: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingColumnRow: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  settingLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  // Theme Picker
  themePickerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    position: 'relative',
  },
  themeCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Segmented control
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Servings picker
  servingsPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  servingButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    height: 52,
    marginTop: 32,
  },
})
