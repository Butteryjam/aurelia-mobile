import React, { useState, useEffect } from 'react'
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
import * as Linking from 'expo-linking'
import { useAuth } from '@/features/auth/auth-context'
import { useAureliaTheme } from '@/theme'
import { AuthHeader } from '@/components/auth/auth-header'
import { AuthInput } from '@/components/auth/auth-input'
import { AuthButton } from '@/components/auth/auth-button'
import { AuthAlert } from '@/components/auth/auth-alert'

export default function ResetPasswordScreen() {
  const router = useRouter()
  const params = useLocalSearchParams<{
    access_token?: string
    refresh_token?: string
    code?: string
    token_hash?: string
    type?: string
    error?: string
    error_description?: string
  }>()

  const {
    session,
    recoveryActive,
    handleDeepLinkUrl,
    updatePassword,
    verifyOtp,
  } = useAuth()
  const { colors, typography, spacing } = useAureliaTheme()

  const incomingUrl = Linking.useURL()

  const [otpEmail, setOtpEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [sessionEstablished, setSessionEstablished] = useState(Boolean(session || recoveryActive))

  // 1. Process deep link URL from Linking or route params
  useEffect(() => {
    let isMounted = true

    const checkLink = async () => {
      // Check query params passed via Expo Router
      if (params.error || params.error_description) {
        setErrorMessage(params.error_description || params.error || 'Password reset link is invalid.')
        return
      }

      // If already authenticated via recovery session
      if (session || recoveryActive) {
        setSessionEstablished(true)
        return
      }

      // Check incoming deep link URL (e.g. aurelia://reset-password#access_token=...)
      const targetUrl = incomingUrl || (await Linking.getInitialURL())
      if (targetUrl && (targetUrl.includes('access_token') || targetUrl.includes('code') || targetUrl.includes('token_hash'))) {
        setLoading(true)
        const result = await handleDeepLinkUrl(targetUrl)
        if (!isMounted) return
        setLoading(false)

        if (result.success) {
          setSessionEstablished(true)
          setErrorMessage(null)
        } else {
          setErrorMessage(result.error || 'Failed to authenticate reset link.')
        }
      }
    }

    checkLink()

    return () => {
      isMounted = false
    }
  }, [incomingUrl, params, session, recoveryActive, handleDeepLinkUrl])

  const handleUpdatePassword = async () => {
    if (!password) {
      setErrorMessage('Please enter a new password.')
      return
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setErrorMessage(null)
    setLoading(true)

    try {
      // If session is not yet established, verify OTP first
      if (!sessionEstablished && otpEmail && otpCode) {
        const otpRes = await verifyOtp({
          email: otpEmail.trim(),
          token: otpCode.trim(),
          type: 'recovery',
        })
        if (!otpRes.success) {
          setErrorMessage(otpRes.error || 'Invalid or expired verification code.')
          setLoading(false)
          return
        }
      }

      const res = await updatePassword(password)
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to update password. Please try again.')
      } else {
        setSuccessMessage('Your password has been successfully updated!')
        setTimeout(() => {
          router.replace('/(app)/(tabs)/home')
        }, 1200)
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
            eyebrow="Aurelia • Password Reset"
            title="Create new password"
            subtitle="Choose a secure password to protect your personal culinary collection."
            onBack={() => router.back()}
          />

          {errorMessage && <AuthAlert type="error" message={errorMessage} />}
          {successMessage && <AuthAlert type="success" message={successMessage} />}

          <View style={styles.form}>
            {!sessionEstablished && (
              <>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.mutedForeground, marginBottom: spacing.sm },
                  ]}
                >
                  If you arrived without tapping the email link, enter your email and the 6-digit verification code sent to your inbox.
                </Text>

                <AuthInput
                  label="Email Address"
                  placeholder="you@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={otpEmail}
                  onChangeText={(text) => {
                    setOtpEmail(text)
                    if (errorMessage) setErrorMessage(null)
                  }}
                />

                <AuthInput
                  label="6-Digit Reset Code"
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  value={otpCode}
                  onChangeText={(text) => {
                    setOtpCode(text)
                    if (errorMessage) setErrorMessage(null)
                  }}
                />
              </>
            )}

            <AuthInput
              label="New Password"
              placeholder="At least 6 characters"
              isPassword
              autoCapitalize="none"
              autoComplete="new-password"
              hint="Must be at least 6 characters."
              value={password}
              onChangeText={(text) => {
                setPassword(text)
                if (errorMessage) setErrorMessage(null)
              }}
            />

            <AuthInput
              label="Confirm New Password"
              placeholder="Re-enter your new password"
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
              title="Update Password"
              onPress={handleUpdatePassword}
              loading={loading}
              variant="primary"
              style={{ marginTop: spacing.base }}
            />
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              accessibilityRole="button"
              accessibilityLabel="Cancel and return to Sign in"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.footerPressable}
            >
              <Text
                style={[
                  typography.body,
                  { color: colors.mutedForeground },
                ]}
              >
                Cancel and return to Sign in
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
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  footerPressable: {
    minHeight: 44,
    justifyContent: 'center',
  },
})
