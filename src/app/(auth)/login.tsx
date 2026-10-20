import React, { useState } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useAuth } from '@/features/auth/auth-context'
import { useAureliaTheme } from '@/theme'
import { AuthHeader } from '@/components/auth/auth-header'
import { AuthInput } from '@/components/auth/auth-input'
import { AuthButton } from '@/components/auth/auth-button'
import { AuthAlert } from '@/components/auth/auth-alert'

export default function LoginScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{ redirect?: string }>()
  const { signIn } = useAuth()
  const { colors, typography, spacing } = useAureliaTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.')
      return
    }

    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await signIn(email.trim(), password)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.')
      } else {
        const dest = params.redirect
        if (dest && typeof dest === 'string' && !dest.includes('login') && !dest.includes('(auth)')) {
          router.replace(dest as any)
        } else {
          router.replace('/(app)/(tabs)/home')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AuthHeader
            eyebrow="Aurelia • Culinary Archive"
            title="Welcome back"
            subtitle="Sign in to access your curated recipes, meal plans, and intelligent kitchen assistant."
          />

          {errorMessage && <AuthAlert type="error" message={errorMessage} />}

          <View style={styles.form}>
            <AuthInput
              label="Email"
              placeholder="you@domain.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                if (errorMessage) setErrorMessage(null)
              }}
            />

            <AuthInput
              label="Password"
              placeholder="Enter your password"
              isPassword
              autoCapitalize="none"
              autoComplete="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (errorMessage) setErrorMessage(null)
              }}
            />

            <View style={styles.forgotPasswordContainer}>
              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                accessibilityRole="button"
                accessibilityLabel="Forgot password?"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.forgotPasswordPressable}
              >
                <Text style={[typography.caption, { color: colors.primary, fontWeight: '600' }]}>
                  Forgot password?
                </Text>
              </Pressable>
            </View>

            <AuthButton
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              variant="primary"
              style={{ marginTop: spacing.base }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.body, { color: colors.mutedForeground }]}>
              Don't have an account?{' '}
            </Text>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              accessibilityRole="button"
              accessibilityLabel="Sign up for Aurelia"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.primary, fontWeight: '700' },
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  form: {
    marginTop: 8,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginTop: -4,
    marginBottom: 12,
  },
  forgotPasswordPressable: {
    minHeight: 44,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    minHeight: 44,
  },
})
