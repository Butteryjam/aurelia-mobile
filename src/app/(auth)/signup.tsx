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
import { useRouter } from 'expo-router'
import { useAuth } from '@/features/auth/auth-context'
import { useAureliaTheme } from '@/theme'
import { AuthHeader } from '@/components/auth/auth-header'
import { AuthInput } from '@/components/auth/auth-input'
import { AuthButton } from '@/components/auth/auth-button'
import { AuthAlert } from '@/components/auth/auth-alert'
import { GoogleIcon } from '@/components/auth/google-icon'

export default function SignupScreen() {
  const router = useRouter()
  const { signUp, signInWithGoogle } = useAuth()
  const { colors, typography, spacing } = useAureliaTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const isSubmitting = loading || googleLoading

  const validate = (): string | null => {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) return 'Please enter your email address.'
    if (!trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      return 'Please enter a valid email address.'
    }
    if (!password) return 'Please enter a password.'
    if (password.length < 6) return 'Password must be at least 6 characters long.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    return null
  }

  const handleSignUp = async () => {
    const validationError = validate()
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setLoading(true)

    try {
      const res = await signUp(email.trim(), password)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account. Please try again.')
      } else if (res.requiresEmailConfirmation) {
        setSuccessMessage(
          'Account created! Please check your email inbox to confirm your email before signing in.'
        )
      } else {
        router.replace('/(app)/(tabs)/home')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setGoogleLoading(true)

    try {
      const res = await signInWithGoogle()
      if (res.cancelled) {
        return
      }
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to sign up with Google.')
      } else {
        router.replace('/(app)/(tabs)/home')
      }
    } finally {
      setGoogleLoading(false)
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
            eyebrow="Aurelia • New Member"
            title="Create account"
            subtitle="Begin curating your personal recipe vault, customized meal plans, and culinary memories."
            onBack={() => router.back()}
          />

          {errorMessage && <AuthAlert type="error" message={errorMessage} />}
          {successMessage && <AuthAlert type="success" message={successMessage} />}

          {/* Primary OAuth: Continue with Google */}
          <View style={styles.oauthContainer}>
            <AuthButton
              title="Continue with Google"
              icon={<GoogleIcon size={18} />}
              onPress={handleGoogleSignUp}
              loading={googleLoading}
              disabled={isSubmitting}
              variant="outline"
              accessibilityLabel="Continue with Google"
            />

            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[typography.caption, { color: colors.mutedForeground, marginHorizontal: 12 }]}>
                OR CONTINUE WITH EMAIL
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
          </View>

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
              placeholder="At least 6 characters"
              isPassword
              autoCapitalize="none"
              autoComplete="new-password"
              hint="Must be at least 6 characters long."
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (errorMessage) setErrorMessage(null)
              }}
            />

            <AuthInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              isPassword
              autoCapitalize="none"
              autoComplete="new-password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text)
                if (errorMessage) setErrorMessage(null)
              }}
            />

            <AuthButton
              title="Create Account"
              onPress={handleSignUp}
              loading={loading}
              disabled={isSubmitting}
              variant="primary"
              style={{ marginTop: spacing.base }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[typography.body, { color: colors.mutedForeground }]}>
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Sign in with existing account"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.primary, fontWeight: '700' },
                ]}
              >
                Sign in
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  oauthContainer: {
    marginTop: 16,
    marginBottom: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  form: {
    marginTop: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 36,
    minHeight: 44,
  },
})
