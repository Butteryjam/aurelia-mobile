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

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const { sendPasswordReset } = useAuth()
  const { colors, typography, spacing } = useAureliaTheme()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sentSuccess, setSentSuccess] = useState(false)

  const handleSendReset = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setErrorMessage(null)
    setLoading(true)

    try {
      const res = await sendPasswordReset(trimmed)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to send recovery link. Please try again.')
      } else {
        setSentSuccess(true)
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
            eyebrow="Aurelia • Account Recovery"
            title="Reset password"
            subtitle="Enter your email to receive recovery instructions and regain access to your recipe collection."
            onBack={() => router.back()}
          />

          {errorMessage && <AuthAlert type="error" message={errorMessage} />}

          {sentSuccess ? (
            <View style={styles.successContainer}>
              <AuthAlert
                type="success"
                message={`A password reset link has been dispatched to ${email.trim()}. Tap the link in your email on this device to reset your password.`}
              />

              <AuthButton
                title="Enter Reset Code Manually"
                onPress={() => router.push('/(auth)/reset-password')}
                variant="outline"
                style={{ marginTop: spacing.md }}
              />

              <AuthButton
                title="Return to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                variant="primary"
                style={{ marginTop: spacing.md }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <AuthInput
                label="Email Address"
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

              <AuthButton
                title="Send Recovery Link"
                onPress={handleSendReset}
                loading={loading}
                variant="primary"
                style={{ marginTop: spacing.base }}
              />
            </View>
          )}

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Back to Sign in"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.footerPressable}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.primary, fontWeight: '600' },
                ]}
              >
                Back to Sign in
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
  form: {
    marginTop: 8,
  },
  successContainer: {
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerPressable: {
    minHeight: 44,
    justifyContent: 'center',
  },
})
